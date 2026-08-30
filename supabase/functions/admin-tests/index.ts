// Admin-only test management: list / get / save (create or full
// replace) / delete / toggle_active. Lets an admin build a test from
// the dashboard instead of going through the code-based seed pipeline.
//
//   supabase.functions.invoke('admin-tests', { body: { action: 'list' } })
//   supabase.functions.invoke('admin-tests', { body: { action: 'get', test_id } })
//   supabase.functions.invoke('admin-tests', { body: { action: 'save', test: {...} } })
//   supabase.functions.invoke('admin-tests', { body: { action: 'delete', test_id } })
//   supabase.functions.invoke('admin-tests', { body: { action: 'toggle_active', test_id, is_active } })
//
// 'save' handles both creating a new test and fully editing an existing
// one, using the same "delete all sections then re-insert everything
// fresh" approach scripts/seed-supabase.js already uses -- simpler and
// more reliable than trying to diff a nested structure question by
// question, at the cost of regenerating IDs for existing questions on
// every edit (fine here: nothing else references a test_question's ID
// across saves).

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

async function requireAdmin(req: Request) {
  const authClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
  );
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return { ok: false as const, status: 401, message: 'غير مصرح به' };

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return { ok: false as const, status: 403, message: 'هذا الإجراء متاح للمشرفين فقط' };
  }
  return { ok: true as const, admin };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const check = await requireAdmin(req);
  if (!check.ok) return json({ success: false, message: check.message }, check.status);
  const { admin } = check;

  try {
    const body = await req.json();

    if (body.action === 'list') {
      const { data, error } = await admin
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return json({ success: true, tests: data });
    }

    if (body.action === 'get') {
      const { test_id } = body;
      const { data: test, error: testErr } = await admin.from('tests').select('*').eq('id', test_id).single();
      if (testErr || !test) return json({ success: false, message: 'الاختبار غير موجود' }, 404);

      const { data: sections } = await admin
        .from('test_sections')
        .select('*, test_questions(*, test_answers(*))')
        .eq('test_id', test_id)
        .order('order_index');

      const { data: writing } = await admin
        .from('test_writing_prompts')
        .select('*')
        .eq('test_id', test_id)
        .maybeSingle();

      const sortedSections = (sections || []).map((s: any) => ({
        ...s,
        test_questions: (s.test_questions || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((q: any) => ({
            ...q,
            test_answers: (q.test_answers || []).sort((a: any, b: any) => a.order_index - b.order_index)
          }))
      }));

      return json({ success: true, test, sections: sortedSections, writing: writing || null });
    }

    if (body.action === 'toggle_active') {
      const { test_id, is_active } = body;
      const { error } = await admin.from('tests').update({ is_active }).eq('id', test_id);
      if (error) throw error;
      return json({ success: true });
    }

    if (body.action === 'delete') {
      const { test_id } = body;
      const { error } = await admin.from('tests').delete().eq('id', test_id);
      if (error) throw error;
      return json({ success: true });
    }

    if (body.action === 'save') {
      const t = body.test;
      if (!t || !t.title || !t.test_type) {
        return json({ success: false, message: 'العنوان ورمز نوع الاختبار مطلوبان' }, 400);
      }
      if (!Array.isArray(t.sections) || t.sections.length === 0) {
        return json({ success: false, message: 'يجب إضافة قسم واحد على الأقل' }, 400);
      }

      // Validate every question has exactly one correct answer before
      // writing anything -- same rule the original Python content
      // builders enforced, now enforced server-side too.
      for (const s of t.sections) {
        if (!Array.isArray(s.questions) || s.questions.length === 0) {
          return json({ success: false, message: `القسم "${s.name}" يحتاج سؤالاً واحدًا على الأقل` }, 400);
        }
        for (const q of s.questions) {
          const answers = Array.isArray(q.answers) ? q.answers : [];
          if (answers.length < 2) {
            return json({ success: false, message: `السؤال "${q.question_text}" يحتاج إجابتين على الأقل` }, 400);
          }
          const correctCount = answers.filter((a: any) => a.is_correct).length;
          if (correctCount !== 1) {
            return json({ success: false, message: `السؤال "${q.question_text}" يجب أن تكون له إجابة صحيحة واحدة بالضبط` }, 400);
          }
        }
      }

      const totalQuestions = t.sections.reduce((sum: number, s: any) => sum + s.questions.length, 0);

      const { data: savedTest, error: upsertErr } = await admin
        .from('tests')
        .upsert(
          {
            id: t.id || undefined,
            title: t.title,
            description: t.description || null,
            test_type: t.test_type,
            level: t.level || 'B1',
            duration_minutes: t.duration_minutes || 30,
            total_questions: totalQuestions,
            passing_score: t.passing_score || 60,
            is_active: t.is_active !== false,
            is_skill_practice: !!t.is_skill_practice,
            skill: t.skill || null
          },
          { onConflict: t.id ? 'id' : 'test_type' }
        )
        .select()
        .single();
      if (upsertErr) throw upsertErr;

      const testId = savedTest.id;

      // Wipe and rebuild sections (cascades to questions/answers) --
      // same approach the seed script uses for content updates.
      await admin.from('test_sections').delete().eq('test_id', testId);

      for (let i = 0; i < t.sections.length; i++) {
        const s = t.sections[i];
        const { data: sectionRow, error: secErr } = await admin
          .from('test_sections')
          .insert({
            test_id: testId,
            key: s.key || `section${i + 1}`,
            name: s.name,
            type: s.type,
            official_duration_minutes: s.official_duration_minutes || null,
            instructions: s.instructions || null,
            passage: s.passage || null,
            audio_url: s.audio_url || null,
            order_index: i
          })
          .select()
          .single();
        if (secErr) throw secErr;

        for (let qi = 0; qi < s.questions.length; qi++) {
          const q = s.questions[qi];
          const { data: questionRow, error: qErr } = await admin
            .from('test_questions')
            .insert({
              test_id: testId,
              section_id: sectionRow.id,
              question_text: q.question_text,
              question_type: q.question_type || 'multiple_choice',
              points: q.points || 1,
              explanation: q.explanation || null,
              order_index: qi
            })
            .select()
            .single();
          if (qErr) throw qErr;

          const answerRows = q.answers.map((a: any, ai: number) => ({
            question_id: questionRow.id,
            answer_text: a.answer_text,
            is_correct: !!a.is_correct,
            order_index: ai
          }));
          const { error: aErr } = await admin.from('test_answers').insert(answerRows);
          if (aErr) throw aErr;
        }
      }

      // Writing prompt is optional and single (one per test).
      await admin.from('test_writing_prompts').delete().eq('test_id', testId);
      if (t.writing && t.writing.enabled && t.writing.prompt) {
        await admin.from('test_writing_prompts').insert({
          test_id: testId,
          name: t.writing.name || 'Schreiben',
          official_duration_minutes: t.writing.official_duration_minutes || null,
          instructions: t.writing.instructions || null,
          prompt: t.writing.prompt,
          sample_answer: t.writing.sample_answer || ''
        });
      }

      return json({ success: true, test_id: testId });
    }

    return json({ success: false, message: 'action غير معروف' }, 400);
  } catch (err) {
    console.error(err);
    return json({ success: false, message: 'حدث خطأ في الخادم' }, 500);
  }
});
