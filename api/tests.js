// Mock Tests API Endpoints
// In a real implementation, these would connect to Supabase.
//
// Content (test metadata, sections, questions, writing prompts) lives in
// ./testsContent.js so it can be shared with scripts/generate-audio.js.

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./authMiddleware');
const { mockTests, mockContent } = require('./testsContent');

function gradedItemCount(testId) {
  const content = mockContent[testId];
  if (!content) return 0;
  return content.sections.reduce((sum, s) => sum + s.items.length, 0);
}

function findAnswer(testId, questionId, answerId) {
  const content = mockContent[testId];
  if (!content) return null;
  for (const section of content.sections) {
    const question = section.items.find(q => q.id === questionId);
    if (question) return question.answers.find(a => a.id === answerId) || null;
  }
  return null;
}

// Get all available tests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const activeTests = mockTests.filter(test => test.is_active);
    res.json({
      success: true,
      tests: activeTests.map(test => ({
        id: test.id, title: test.title, description: test.description, test_type: test.test_type,
        level: test.level, duration_minutes: test.duration_minutes, total_questions: test.total_questions,
        passing_score: test.passing_score, trial_question_count: gradedItemCount(test.id)
      }))
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Get specific test by ID (with its trial sections + writing prompt embedded)
router.get('/:testId', authenticateToken, async (req, res) => {
  try {
    const test = mockTests.find(t => t.id === req.params.testId);
    if (!test || !test.is_active) {
      return res.status(404).json({ success: false, message: 'الاختبار غير موجود' });
    }

    const content = mockContent[test.id] || { sections: [], writing: null };

    res.json({
      success: true,
      test: {
        id: test.id, title: test.title, description: test.description, test_type: test.test_type,
        level: test.level, duration_minutes: test.duration_minutes, total_questions: test.total_questions,
        passing_score: test.passing_score,
        sections: content.sections.map(s => ({
          key: s.key, name: s.name, type: s.type,
          official_duration_minutes: s.official_duration_minutes,
          instructions: s.instructions, passage: s.passage || null,
          audio_url: s.audio_url || null,
          items: s.items.map(q => ({
            id: q.id, question_text: q.question_text, question_type: q.question_type,
            points: q.points, explanation: q.explanation, order_index: q.order_index,
            answers: q.answers.map(a => ({ id: a.id, answer_text: a.answer_text }))
          }))
        })),
        writing: content.writing
      }
    });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

let mockTestAttempts = [];

// Start a test attempt
router.post('/attempts', authenticateToken, async (req, res) => {
  try {
    const { test_id } = req.body;
    const test = mockTests.find(t => t.id === test_id);
    if (!test || !test.is_active) {
      return res.status(404).json({ success: false, message: 'الاختبار غير موجود' });
    }

    const attemptId = `attempt_${Math.random().toString(36).substr(2, 9)}`;
    const newAttempt = {
      id: attemptId, user_id: req.userId, test_id, started_at: new Date().toISOString(),
      completed_at: null, score: null, passed: null, time_taken_seconds: null, answers: []
    };
    mockTestAttempts.push(newAttempt);

    res.json({ success: true, attempt: { id: newAttempt.id, test_id: newAttempt.test_id, started_at: newAttempt.started_at } });
  } catch (error) {
    console.error('Start test attempt error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Submit test attempt
router.put('/attempts/:attemptId', authenticateToken, async (req, res) => {
  try {
    const { answers, completed_at, time_taken_seconds } = req.body;
    const attemptIndex = mockTestAttempts.findIndex(a => a.id === req.params.attemptId && a.user_id === req.userId);
    if (attemptIndex === -1) {
      return res.status(404).json({ success: false, message: 'محاولة الاختبار غير موجودة' });
    }

    const attempt = mockTestAttempts[attemptIndex];
    if (attempt.completed_at !== null) {
      return res.status(400).json({ success: false, message: 'تم إكمال هذه المحاولة بالفعل' });
    }

    const test = mockTests.find(t => t.id === attempt.test_id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'الاختبار غير موجود' });
    }

    const totalQuestions = gradedItemCount(test.id);
    let correctAnswers = 0;
    const submitted = Array.isArray(answers) ? answers : [];

    submitted.forEach(a => {
      const found = findAnswer(test.id, a.question_id, a.answer_id);
      if (found && found.is_correct) correctAnswers++;
    });

    const scorePercentage = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passed = scorePercentage >= test.passing_score;

    mockTestAttempts[attemptIndex] = {
      ...attempt,
      completed_at: completed_at || new Date().toISOString(),
      score: scorePercentage, passed, time_taken_seconds: time_taken_seconds || 0, answers: submitted
    };

    const content = mockContent[test.id] || { sections: [] };
    const questionsReview = [];
    content.sections.forEach(section => {
      section.items.forEach(question => {
        const submittedAnswer = submitted.find(a => a.question_id === question.id);
        const selected = submittedAnswer ? question.answers.find(a => a.id === submittedAnswer.answer_id) : null;
        const correct = question.answers.find(a => a.is_correct);
        questionsReview.push({
          id: question.id, section_name: section.name, question_text: question.question_text,
          selected_answer_text: selected ? selected.answer_text : null,
          correct_answer_text: correct ? correct.answer_text : null,
          is_correct: selected ? !!selected.is_correct : false,
          explanation: question.explanation
        });
      });
    });

    res.json({
      success: true,
      result: {
        id: attempt.id, score_percentage: scorePercentage, passed,
        correct_answers: correctAnswers, total_questions: totalQuestions,
        incorrect_answers: totalQuestions - correctAnswers,
        time_taken_seconds: time_taken_seconds || 0, questions_review: questionsReview
      }
    });
  } catch (error) {
    console.error('Submit test attempt error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Get user's test attempts
router.get('/attempts', authenticateToken, async (req, res) => {
  try {
    const userAttempts = mockTestAttempts
      .filter(a => a.user_id === req.userId)
      .map(attempt => {
        const test = mockTests.find(t => t.id === attempt.test_id);
        const totalQ = gradedItemCount(attempt.test_id);
        return {
          id: attempt.id, test_id: attempt.test_id, test_title: test ? test.title : 'اختبار غير معروف',
          started_at: attempt.started_at, completed_at: attempt.completed_at,
          score_percentage: attempt.score, passed: attempt.passed, time_taken_seconds: attempt.time_taken_seconds,
          correct_answers: attempt.score !== null ? Math.round((attempt.score / 100) * totalQ) : 0,
          total_questions: totalQ
        };
      })
      .sort((a, b) => new Date(b.completed_at || b.started_at) - new Date(a.completed_at || a.started_at));

    res.json({ success: true, attempts: userAttempts });
  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// Get specific test attempt details
router.get('/attempts/:attemptId', authenticateToken, async (req, res) => {
  try {
    const attempt = mockTestAttempts.find(a => a.id === req.params.attemptId && a.user_id === req.userId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'محاولة الاختبار غير موجودة' });
    }

    const test = mockTests.find(t => t.id === attempt.test_id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'الاختبار غير موجود' });
    }

    const content = mockContent[test.id] || { sections: [] };
    const questionsReview = [];
    content.sections.forEach(section => {
      section.items.forEach(question => {
        const submittedAnswer = attempt.answers.find(a => a.question_id === question.id);
        const selected = submittedAnswer ? question.answers.find(a => a.id === submittedAnswer.answer_id) : null;
        const correct = question.answers.find(a => a.is_correct);
        questionsReview.push({
          id: question.id, section_name: section.name, question_text: question.question_text,
          selected_answer_text: selected ? selected.answer_text : null,
          correct_answer_text: correct ? correct.answer_text : null,
          is_correct: selected ? !!selected.is_correct : false,
          explanation: question.explanation
        });
      });
    });

    const totalQ = gradedItemCount(test.id);

    res.json({
      success: true,
      attempt: {
        id: attempt.id, test_id: attempt.test_id, test_title: test.title,
        started_at: attempt.started_at, completed_at: attempt.completed_at,
        score_percentage: attempt.score, passed: attempt.passed, time_taken_seconds: attempt.time_taken_seconds,
        correct_answers: attempt.score !== null ? Math.round((attempt.score / 100) * totalQ) : 0,
        total_questions: totalQ,
        questions_review: questionsReview
      }
    });
  } catch (error) {
    console.error('Get attempt details error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

module.exports = router;
