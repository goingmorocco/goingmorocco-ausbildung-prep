-- Supabase Migration: lets admins manage tests directly from the
-- dashboard instead of going through the code-based seed pipeline.
--
-- No new content tables needed -- tests/test_sections/test_questions/
-- test_answers/test_writing_prompts already support everything a test
-- needs. What's missing: (1) admins need to see ALL tests including
-- inactive ones (the existing policy only shows is_active=true), and
-- (2) a private Storage bucket for admin-uploaded audio files.

CREATE POLICY "Admins can view all tests"
    ON public.tests FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage tests"
    ON public.tests FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins can manage sections"
    ON public.test_sections FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins can manage questions"
    ON public.test_questions FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins can manage answers"
    ON public.test_answers FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins can manage writing prompts"
    ON public.test_writing_prompts FOR ALL
    USING (public.is_admin());

-- ---------------------------------------------------------------------
-- Storage: a PRIVATE bucket for admin-uploaded listening audio. Private
-- for the same reason the Classroom "resources" bucket is: access
-- should follow the same free-tier/paid gating as everything else, not
-- be a guessable public URL. There is deliberately NO read policy here
-- for regular users (same pattern as test_answers having no public
-- policy) -- audio is only ever served via a signed URL generated
-- inside test-detail, AFTER it has already confirmed the caller passes
-- can_access_test(). Admins can upload/manage directly since they
-- always pass that check anyway.
-- ---------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('test-audio', 'test-audio', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload test audio"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'test-audio' AND public.is_admin());

CREATE POLICY "Admins can update test audio"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'test-audio' AND public.is_admin());

CREATE POLICY "Admins can delete test audio"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'test-audio' AND public.is_admin());
