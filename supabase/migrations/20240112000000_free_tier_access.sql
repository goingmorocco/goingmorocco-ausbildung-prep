-- Supabase Migration: real free tier, replacing the old "everything is
-- blocked until an admin approves you" model.
--
-- New model:
--   - 'pending' (free tier, no admin wait) can access skill-practice
--     tests only, and only up to 6 DISTINCT tests -- retaking a test
--     they've already tried never counts against the quota, only trying
--     genuinely new content does.
--   - 'active' (paid) can access everything: long exams, skill
--     practice, no quota.
--   - 'rejected' gets nothing.
--   - Admins always pass.
--
-- can_access_test() is the single source of truth for this, called from
-- the test-detail and test-attempt Edge Functions (which use the
-- service role internally and therefore bypass table-level RLS, so this
-- check has to live in application logic, not just a table policy).

CREATE OR REPLACE FUNCTION public.can_access_test(target_test_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_status TEXT;
  test_is_skill BOOLEAN;
  already_attempted BOOLEAN;
  distinct_tests_tried INTEGER;
BEGIN
  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;

  SELECT membership_status INTO user_status FROM public.users WHERE id = auth.uid();

  IF user_status = 'active' THEN
    RETURN TRUE;
  END IF;

  IF user_status IS NULL OR user_status = 'rejected' THEN
    RETURN FALSE;
  END IF;

  -- From here: user_status = 'pending' (free tier)
  SELECT is_skill_practice INTO test_is_skill FROM public.tests WHERE id = target_test_id;

  IF test_is_skill IS NOT TRUE THEN
    RETURN FALSE; -- free tier never gets the long realistic exams
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_test_attempts
    WHERE user_id = auth.uid() AND test_id = target_test_id AND completed_at IS NOT NULL
  ) INTO already_attempted;

  IF already_attempted THEN
    RETURN TRUE; -- retaking something already unlocked never costs quota
  END IF;

  SELECT COUNT(DISTINCT test_id) INTO distinct_tests_tried
  FROM public.user_test_attempts
  WHERE user_id = auth.uid() AND completed_at IS NOT NULL;

  RETURN distinct_tests_tried < 6;
END;
$$;

-- Lets the frontend show "X of 6 free tests remaining" without needing
-- its own Edge Function round trip -- students can safely read their
-- own usage directly.
CREATE OR REPLACE FUNCTION public.free_tests_used()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(DISTINCT test_id)::INTEGER
  FROM public.user_test_attempts
  WHERE user_id = auth.uid() AND completed_at IS NOT NULL;
$$;
