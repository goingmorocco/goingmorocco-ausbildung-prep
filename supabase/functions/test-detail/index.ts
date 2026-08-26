// GET-style function: returns one test's full content (sections,
// passages, audio URLs, questions + answer options) with is_correct
// stripped out, plus the writing prompt. This is the only path that's
// allowed to read test_answers at all (see the migration that dropped
// direct table access) -- it uses the service role internally, then
// manually sanitizes before responding, exactly like the old Express
// mock backend did.
//
// Call from the frontend as:
//   supabase.functions.invoke('test-detail', { body: { test_id } })

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// CORS headers inlined directly (rather than imported from _shared/) to
// avoid a known Supabase bundler bug where deploying a function by name
// sometimes fails to resolve sibling _shared/ imports.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the caller is logged in (any authenticated user may browse
    // test content -- matches the existing "anyone can view active
    // tests" policy intent).
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

    const { test_id } = await req.json();
    if (!test_id) {
      return new Response(JSON.stringify({ success: false, message: 'test_id مطلوب' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: test, error: testError } = await admin
      .from('tests')
      .select('*')
      .eq('id', test_id)
      .eq('is_active', true)
      .single();

    if (testError || !test) {
      return new Response(JSON.stringify({ success: false, message: 'الاختبار غير موجود' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: sections, error: sectionsError } = await admin
      .from('test_sections')
      .select('*, test_questions(*, test_answers(id, answer_text, order_index))')
      .eq('test_id', test_id)
      .order('order_index');

    if (sectionsError) throw sectionsError;

    const { data: writing } = await admin
      .from('test_writing_prompts')
      .select('*')
      .eq('test_id', test_id)
      .maybeSingle();

    const sanitizedSections = (sections || []).map((s: any) => ({
      key: s.key,
      name: s.name,
      type: s.type,
      official_duration_minutes: s.official_duration_minutes,
      instructions: s.instructions,
      passage: s.passage,
      audio_url: s.audio_url,
      items: (s.test_questions || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          points: q.points,
          explanation: q.explanation,
          order_index: q.order_index,
          // is_correct intentionally omitted
          answers: (q.test_answers || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((a: any) => ({ id: a.id, answer_text: a.answer_text }))
        }))
    }));

    return new Response(
      JSON.stringify({
        success: true,
        test: {
          id: test.id,
          title: test.title,
          description: test.description,
          test_type: test.test_type,
          level: test.level,
          duration_minutes: test.duration_minutes,
          total_questions: test.total_questions,
          passing_score: test.passing_score,
          sections: sanitizedSections,
          writing: writing || null
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, message: 'حدث خطأ في الخادم' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
