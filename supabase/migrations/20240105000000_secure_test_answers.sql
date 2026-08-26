-- Supabase Migration: close an answer-key leak
--
-- The original policy "Anyone can view answers for active test questions"
-- (from 20240101000000_initial_schema.sql) grants SELECT on the entire
-- test_answers table -- including is_correct. RLS controls which ROWS a
-- query can see, not which COLUMNS; the old Express mock backend avoided
-- this by manually stripping is_correct out of the JSON response, but a
-- direct Supabase client call like
--   supabase.from('test_answers').select('*')
-- would return the answer key to any logged-in user, bypassing that
-- protection entirely.
--
-- Fix: remove direct table access to test_answers. All reads now go
-- through the test-detail Edge Function (service role, manually
-- sanitized -- see supabase/functions/test-detail), and scoring happens
-- through the test-attempt Edge Function (service role). With RLS enabled
-- and no permissive SELECT policy left, the table is unreachable via the
-- public REST API by design.

DROP POLICY IF EXISTS "Anyone can view answers for active test questions" ON public.test_answers;

-- test_questions (question text only, no correctness info) stays openly
-- readable -- there's nothing sensitive in it, and it's convenient for
-- any future direct-query use cases.
