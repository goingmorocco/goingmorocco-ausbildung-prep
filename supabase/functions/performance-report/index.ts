// Aggregates a student's own performance across every completed test
// attempt: strengths/weaknesses by section type (Lesen/Sprachbausteine/
// Hoeren), plus a chronological score trend. Called fresh every time the
// dashboard loads, so it naturally "updates after each test" -- there's
// no separate cache to invalidate, it's just always computed live.
//
//   supabase.functions.invoke('performance-report', { body: {} })
//
// Only ever summarizes the caller's OWN completed attempts (scoped by
// their own auth.uid()), and only ever returns rolled-up percentages --
// never raw is_correct/answer data -- so there's no answer-key exposure
// risk in aggregating across history the way there would be for an
// in-progress test.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return json({ success: false, message: 'غير مصرح به' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: attempts, error: attemptsErr } = await admin
      .from('user_test_attempts')
      .select('id, test_id, score, completed_at, answers, tests(title)')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true });

    if (attemptsErr) throw attemptsErr;

    const trend = (attempts || []).map((a: any) => ({
      attempt_id: a.id,
      test_title: a.tests?.title || 'اختبار غير معروف',
      completed_at: a.completed_at,
      score_percentage: a.score
    }));

    // Section-type breakdown across every attempt. One question-bank
    // fetch per distinct test_id (cached in testSectionsCache), not per
    // attempt, to keep this reasonably cheap even with a long history.
    const breakdown: Record<string, { correct: number; total: number }> = {};
    const testSectionsCache: Record<string, any[]> = {};

    for (const attempt of (attempts || [])) {
      if (!testSectionsCache[attempt.test_id]) {
        const { data: sections } = await admin
          .from('test_sections')
          .select('type, test_questions(id, test_answers(id, is_correct))')
          .eq('test_id', attempt.test_id);
        testSectionsCache[attempt.test_id] = sections || [];
      }

      const questionTypeMap: Record<string, string> = {};
      const correctAnswerMap: Record<string, string> = {};
      testSectionsCache[attempt.test_id].forEach((s: any) => {
        (s.test_questions || []).forEach((q: any) => {
          questionTypeMap[q.id] = s.type;
          const correct = (q.test_answers || []).find((a: any) => a.is_correct);
          if (correct) correctAnswerMap[q.id] = correct.id;
        });
      });

      const submitted: any[] = Array.isArray(attempt.answers) ? attempt.answers : [];
      submitted.forEach((a) => {
        const type = questionTypeMap[a.question_id] || 'other';
        if (!breakdown[type]) breakdown[type] = { correct: 0, total: 0 };
        breakdown[type].total++;
        if (correctAnswerMap[a.question_id] === a.answer_id) breakdown[type].correct++;
      });
    }

    return json({
      success: true,
      report: {
        attempts_count: (attempts || []).length,
        trend,
        section_breakdown: breakdown
      }
    });
  } catch (err) {
    console.error(err);
    return json({ success: false, message: 'حدث خطأ في الخادم' }, 500);
  }
});
