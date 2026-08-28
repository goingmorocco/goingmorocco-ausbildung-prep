-- Supabase Migration: support a growing library of short tests per skill
-- (many reading drills, later many listening/writing drills), instead of
-- one fixed test per skill. Mirrors the `skill` tag already added to
-- resources -- same grouping concept, now on tests too.
--
-- Each individual short test keeps its own unique test_type (e.g.
-- 'skill_reading_cafe', 'skill_reading_market'), so uniqueness/upserting
-- still works per-test; `skill` is what lets a page query "every reading
-- drill, newest first" without caring how many there are.

ALTER TABLE public.tests
    ADD COLUMN IF NOT EXISTS skill VARCHAR(20);

ALTER TABLE public.tests
    ADD CONSTRAINT tests_skill_check CHECK (skill IS NULL OR skill IN ('reading', 'listening', 'writing', 'speaking'));

CREATE INDEX IF NOT EXISTS idx_tests_skill ON public.tests(skill, is_skill_practice, created_at);
