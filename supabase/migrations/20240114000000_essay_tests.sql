-- Supabase Migration: lets a skill-practice "test" be a graded essay
-- prompt instead of a multiple-choice quiz, so public/schreiben.html
-- can offer real AI-graded writing practice alongside the existing
-- grammar-mechanics quizzes -- not a separate system, the same `tests`
-- row shape, just a different content_kind.
--
-- An essay-type test has no test_sections/test_questions at all -- its
-- content lives entirely in test_writing_prompts (already existing,
-- already what the full exams' Schreiben section uses). can_access_test()
-- needs no changes: it already works purely off test_id/is_skill_practice/
-- skill/quota, regardless of what content the test actually contains.

ALTER TABLE public.tests
    ADD COLUMN IF NOT EXISTS content_kind VARCHAR(20) NOT NULL DEFAULT 'quiz';

ALTER TABLE public.tests
    ADD CONSTRAINT tests_content_kind_check CHECK (content_kind IN ('quiz', 'essay'));
