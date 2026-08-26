-- Supabase Migration: exam sections, passages, audio, and writing prompts
--
-- The original schema only had a flat tests -> test_questions -> test_answers
-- structure. The real content built for this platform groups questions into
-- named sections matching the official exam format (Lesen Teil 1, Hoeren
-- Teil 2, Sprachbausteine, ...), each with its own instructions, a shared
-- reading/listening passage, and (for listening) a generated audio file.
-- There's also one ungraded writing-practice prompt per test. This
-- migration adds the tables needed to store that structure for real,
-- matching what api/testsContent.js currently hardcodes in JS.

-- Needed so the seed script (scripts/seed-supabase.js) can safely upsert
-- by test_type instead of creating duplicate rows on every run.
ALTER TABLE public.tests
    ADD CONSTRAINT tests_test_type_unique UNIQUE (test_type);

CREATE TABLE IF NOT EXISTS public.test_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
    key VARCHAR(50) NOT NULL,             -- e.g. 'lesen1', 'hoeren2', 'sprachbausteine'
    name VARCHAR(255) NOT NULL,           -- e.g. 'Lesen — Teil 1'
    type VARCHAR(20) NOT NULL,            -- reading, language, listening
    official_duration_minutes INTEGER,    -- real exam timing for this section, informational
    instructions TEXT,
    passage TEXT,                         -- shared reading/listening text, if any
    audio_url TEXT,                       -- set once scripts/generate-audio.js output is uploaded to Storage
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (test_id, key)
);

ALTER TABLE public.test_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sections for active tests"
    ON public.test_sections FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.tests WHERE tests.id = test_id AND tests.is_active = TRUE
    ));

-- Link questions to their section (a question still keeps test_id too, for
-- simpler queries that don't need to join through sections).
ALTER TABLE public.test_questions
    ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.test_sections(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_test_questions_section_id ON public.test_questions(section_id);

-- One ungraded writing-practice prompt per test (Schreiben / Schriftlicher
-- Ausdruck). Not scored automatically -- the student compares their own
-- draft against sample_answer.
CREATE TABLE IF NOT EXISTS public.test_writing_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID UNIQUE REFERENCES public.tests(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    official_duration_minutes INTEGER,
    instructions TEXT,
    prompt TEXT NOT NULL,
    sample_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.test_writing_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view writing prompts for active tests"
    ON public.test_writing_prompts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.tests WHERE tests.id = test_id AND tests.is_active = TRUE
    ));

CREATE INDEX IF NOT EXISTS idx_test_sections_test_id ON public.test_sections(test_id);
