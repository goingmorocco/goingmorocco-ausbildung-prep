#!/usr/bin/env node
/**
 * Loads all exam content (tests, sections, questions, answers, writing
 * prompts) from api/testsContent.js into a real Supabase Postgres
 * database, using the schema added in the test_sections_and_writing
 * migration.
 *
 * WHY THIS EXISTS
 * api/testsContent.js is the single source of truth for the 394-item
 * exam content built for this platform. Rather than hand-writing a giant
 * SQL dump (and risking it drifting out of sync), this script reads that
 * same JS module and inserts it via the Supabase client -- one source of
 * truth, two destinations (the old mock Express API, and now the real
 * database).
 *
 * SETUP (one-time)
 *   1. Run the migrations in supabase/migrations/ against your project
 *      (via the Supabase SQL editor, in order, or `supabase db push` if
 *      you're using the CLI).
 *   2. Set these environment variables (from Supabase dashboard ->
 *      Project Settings -> API):
 *        export SUPABASE_URL="https://xxxx.supabase.co"
 *        export SUPABASE_SERVICE_ROLE_KEY="..."
 *      The service role key bypasses RLS -- never expose it to the
 *      browser, only use it in scripts/servers you control.
 *   3. npm install @supabase/supabase-js   (one-time)
 *   4. node scripts/seed-supabase.js
 *
 * Safe to re-run: tests are upserted by test_type, sections by
 * (test_id, key), so running this again after editing testsContent.js
 * updates existing rows instead of duplicating them. Questions/answers/
 * writing prompts are replaced in full for each test on every run (they
 * don't have natural stable keys worth upserting on), so local edits to
 * a question always take effect.
 */

const { createClient } = require('@supabase/supabase-js');
const { mockTests, mockContent } = require('../api/testsContent');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('See the comment at the top of this file for setup steps.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function upsertTest(test) {
  const { data, error } = await supabase
    .from('tests')
    .upsert(
      {
        title: test.title,
        description: test.description,
        test_type: test.test_type,
        level: test.level,
        duration_minutes: test.duration_minutes,
        total_questions: test.total_questions,
        passing_score: test.passing_score,
        is_active: test.is_active,
        is_skill_practice: !!test.is_skill_practice
      },
      { onConflict: 'test_type' }
    )
    .select()
    .single();

  if (error) throw new Error(`upsert test ${test.test_type}: ${error.message}`);
  return data;
}

async function replaceSections(testId, sections) {
  // Delete existing sections for this test first -- cascades to their
  // questions/answers via ON DELETE CASCADE, then we insert fresh ones.
  const { error: delErr } = await supabase.from('test_sections').delete().eq('test_id', testId);
  if (delErr) throw new Error(`delete sections for ${testId}: ${delErr.message}`);

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];

    const { data: sectionRow, error: secErr } = await supabase
      .from('test_sections')
      .insert({
        test_id: testId,
        key: s.key,
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

    if (secErr) throw new Error(`insert section ${s.key}: ${secErr.message}`);

    for (const q of s.items) {
      const { data: questionRow, error: qErr } = await supabase
        .from('test_questions')
        .insert({
          test_id: testId,
          section_id: sectionRow.id,
          question_text: q.question_text,
          question_type: q.question_type,
          points: q.points,
          explanation: q.explanation,
          order_index: q.order_index
        })
        .select()
        .single();

      if (qErr) throw new Error(`insert question ${q.id}: ${qErr.message}`);

      const answerRows = q.answers.map((a, idx) => ({
        question_id: questionRow.id,
        answer_text: a.answer_text,
        is_correct: a.is_correct,
        order_index: idx
      }));

      const { error: aErr } = await supabase.from('test_answers').insert(answerRows);
      if (aErr) throw new Error(`insert answers for ${q.id}: ${aErr.message}`);
    }
  }
}

async function upsertWriting(testId, writing) {
  if (!writing) return;
  const { error } = await supabase
    .from('test_writing_prompts')
    .upsert(
      {
        test_id: testId,
        name: writing.name,
        official_duration_minutes: writing.official_duration_minutes || null,
        instructions: writing.instructions || null,
        prompt: writing.prompt,
        sample_answer: writing.sample_answer
      },
      { onConflict: 'test_id' }
    );
  if (error) throw new Error(`upsert writing prompt for ${testId}: ${error.message}`);
}

async function main() {
  console.log(`Seeding ${mockTests.length} tests into ${SUPABASE_URL} ...\n`);

  for (const test of mockTests) {
    process.stdout.write(`${test.test_type} ... `);
    const row = await upsertTest(test);

    const content = mockContent[test.id] || { sections: [], writing: null };
    await replaceSections(row.id, content.sections);
    await upsertWriting(row.id, content.writing);

    const itemCount = content.sections.reduce((sum, s) => sum + s.items.length, 0);
    console.log(`done (${content.sections.length} sections, ${itemCount} questions)`);
  }

  console.log('\nSeed complete.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
