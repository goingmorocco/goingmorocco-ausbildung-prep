// Handles starting and submitting a test attempt.
//   supabase.functions.invoke('test-attempt', { body: { action: 'start', test_id } })
//   supabase.functions.invoke('test-attempt', { body: { action: 'submit', attempt_id, answers, time_taken_seconds } })
//
// 'submit' needs to check submitted answer_ids against is_correct, which
// is only readable via the service role (see the migration that dropped
// direct access to test_answers) -- so scoring happens here, server-side,
// exactly like the old Express mock did.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// CORS headers inlined directly (rather than imported from _shared/) to
// avoid a known Supabase bundler bug where deploying a function by name
// sometimes fails to resolve sibling _shared/ imports.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Rolls per-question results up into per-section-type totals, e.g.
// { reading: {correct, total}, language: {correct, total}, listening: {correct, total} }.
// Used for the "your performance in this test, by skill" chart shown
// right alongside the score.
function buildSectionBreakdown(allQuestions: any[], questionsReview: any[]) {
  const breakdown: Record<string, { correct: number; total: number }> = {};
  allQuestions.forEach((q, i) => {
    const type = q.section_type || 'other';
    if (!breakdown[type]) breakdown[type] = { correct: 0, total: 0 };
    breakdown[type].total++;
    if (questionsReview[i]?.is_correct) breakdown[type].correct++;
  });
  return breakdown;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, message: 'غير مصرح به' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (body.action === 'start') {
      const { test_id } = body;
      const { data: test } = await admin
        .from('tests')
        .select('id')
        .eq('id', test_id)
        .eq('is_active', true)
        .single();

      if (!test) {
        return new Response(JSON.stringify({ success: false, message: 'الاختبار غير موجود' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: allowed, error: accessError } = await authClient.rpc('can_access_test', {
        target_test_id: test_id
      });
      if (accessError) throw accessError;
      if (!allowed) {
        return new Response(
          JSON.stringify({ success: false, message: 'هذا الاختبار غير متاح في الخطة المجانية', code: 'upgrade_required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: attempt, error } = await admin
        .from('user_test_attempts')
        .insert({ user_id: user.id, test_id, started_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, attempt: { id: attempt.id, test_id: attempt.test_id, started_at: attempt.started_at } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.action === 'submit') {
      const { attempt_id, answers, time_taken_seconds } = body;

      const { data: attempt, error: attemptErr } = await admin
        .from('user_test_attempts')
        .select('*')
        .eq('id', attempt_id)
        .eq('user_id', user.id)
        .single();

      if (attemptErr || !attempt) {
        return new Response(JSON.stringify({ success: false, message: 'محاولة الاختبار غير موجودة' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (attempt.completed_at !== null) {
        return new Response(JSON.stringify({ success: false, message: 'تم إكمال هذه المحاولة بالفعل' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: test } = await admin.from('tests').select('*').eq('id', attempt.test_id).single();

      const { data: sections } = await admin
        .from('test_sections')
        .select('name, type, test_questions(id, question_text, explanation, test_answers(id, answer_text, is_correct))')
        .eq('test_id', attempt.test_id);

      const allQuestions: any[] = [];
      (sections || []).forEach((s: any) => {
        (s.test_questions || []).forEach((q: any) => allQuestions.push({ ...q, section_name: s.name, section_type: s.type }));
      });

      const submitted: any[] = Array.isArray(answers) ? answers : [];
      let correctAnswers = 0;

      const questionsReview = allQuestions.map((q) => {
        const submittedAnswer = submitted.find((a) => a.question_id === q.id);
        const selected = submittedAnswer
          ? (q.test_answers || []).find((a: any) => a.id === submittedAnswer.answer_id)
          : null;
        const correct = (q.test_answers || []).find((a: any) => a.is_correct);
        const isCorrect = !!(selected && selected.is_correct);
        if (isCorrect) correctAnswers++;

        return {
          id: q.id,
          section_name: q.section_name,
          question_text: q.question_text,
          selected_answer_text: selected ? selected.answer_text : null,
          correct_answer_text: correct ? correct.answer_text : null,
          is_correct: isCorrect,
          explanation: q.explanation
        };
      });

      const totalQuestions = allQuestions.length;
      const scorePercentage = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const passed = scorePercentage >= (test?.passing_score ?? 60);
      const sectionBreakdown = buildSectionBreakdown(allQuestions, questionsReview);

      const { error: updateErr } = await admin
        .from('user_test_attempts')
        .update({
          completed_at: new Date().toISOString(),
          score: scorePercentage,
          passed,
          time_taken_seconds: time_taken_seconds || 0,
          answers: submitted
        })
        .eq('id', attempt_id);

      if (updateErr) throw updateErr;

      return new Response(
        JSON.stringify({
          success: true,
          result: {
            id: attempt_id,
            score_percentage: scorePercentage,
            passed,
            correct_answers: correctAnswers,
            total_questions: totalQuestions,
            incorrect_answers: totalQuestions - correctAnswers,
            time_taken_seconds: time_taken_seconds || 0,
            questions_review: questionsReview,
            section_breakdown: sectionBreakdown
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.action === 'list') {
      const { data: attempts, error } = await admin
        .from('user_test_attempts')
        .select('*, tests(title)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false, nullsFirst: false })
        .order('started_at', { ascending: false });
      if (error) throw error;

      const list = attempts.map((a: any) => ({
        id: a.id,
        test_id: a.test_id,
        test_title: a.tests?.title || 'اختبار غير معروف',
        started_at: a.started_at,
        completed_at: a.completed_at,
        score_percentage: a.score,
        passed: a.passed,
        time_taken_seconds: a.time_taken_seconds,
        total_questions: Array.isArray(a.answers) ? a.answers.length : 0
      }));

      return json({ success: true, attempts: list });
    }

    if (body.action === 'detail') {
      const { attempt_id } = body;
      const { data: attempt, error: attemptErr } = await admin
        .from('user_test_attempts')
        .select('*, tests(title)')
        .eq('id', attempt_id)
        .eq('user_id', user.id)
        .single();

      if (attemptErr || !attempt) {
        return json({ success: false, message: 'محاولة الاختبار غير موجودة' }, 404);
      }

      const { data: sections } = await admin
        .from('test_sections')
        .select('name, type, test_questions(id, question_text, explanation, test_answers(id, answer_text, is_correct))')
        .eq('test_id', attempt.test_id);

      const allQuestions: any[] = [];
      (sections || []).forEach((s: any) => {
        (s.test_questions || []).forEach((q: any) => allQuestions.push({ ...q, section_name: s.name, section_type: s.type }));
      });

      const submitted: any[] = Array.isArray(attempt.answers) ? attempt.answers : [];
      const questionsReview = allQuestions.map((q) => {
        const submittedAnswer = submitted.find((a) => a.question_id === q.id);
        const selected = submittedAnswer
          ? (q.test_answers || []).find((a: any) => a.id === submittedAnswer.answer_id)
          : null;
        const correct = (q.test_answers || []).find((a: any) => a.is_correct);
        return {
          id: q.id,
          section_name: q.section_name,
          question_text: q.question_text,
          selected_answer_text: selected ? selected.answer_text : null,
          correct_answer_text: correct ? correct.answer_text : null,
          is_correct: !!(selected && selected.is_correct),
          explanation: q.explanation
        };
      });

      return json({
        success: true,
        attempt: {
          id: attempt.id,
          test_id: attempt.test_id,
          test_title: attempt.tests?.title || 'اختبار غير معروف',
          started_at: attempt.started_at,
          completed_at: attempt.completed_at,
          score_percentage: attempt.score,
          passed: attempt.passed,
          time_taken_seconds: attempt.time_taken_seconds,
          total_questions: allQuestions.length,
          questions_review: questionsReview,
          section_breakdown: buildSectionBreakdown(allQuestions, questionsReview)
        }
      });
    }

    return json({ success: false, message: 'action غير معروف' }, 400);
  } catch (err) {
    console.error(err);
    return json({ success: false, message: 'حدث خطأ في الخادم' }, 500);
  }
});
