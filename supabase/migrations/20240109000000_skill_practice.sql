-- Supabase Migration: short (5-8 min) skill-focused practice tests,
-- separate from the long realistic exams, plus a `skill` tag on
-- resources so the Classroom library can be filtered by skill on each
-- practice page.

-- Distinguishes short skill-practice tests from the full 60-100 item
-- realistic exams, so the main dashboard's test list (which shows all
-- is_active tests) can exclude these, while the new skill-practice pages
-- can query specifically for them.
ALTER TABLE public.tests
    ADD COLUMN IF NOT EXISTS is_skill_practice BOOLEAN NOT NULL DEFAULT FALSE;

-- Lets the admin tag a resource as relevant to a specific skill (reading/
-- listening/writing/speaking), so each skill-practice page can show
-- genuinely relevant "practice more" materials at the bottom instead of
-- the whole library. NULL means "general", shown as a fallback wherever
-- no skill-specific resources exist yet.
ALTER TABLE public.resources
    ADD COLUMN IF NOT EXISTS skill VARCHAR(20);

ALTER TABLE public.resources
    ADD CONSTRAINT resources_skill_check CHECK (skill IS NULL OR skill IN ('reading', 'listening', 'writing', 'speaking'));

CREATE INDEX IF NOT EXISTS idx_resources_skill ON public.resources(skill);
