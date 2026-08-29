-- Supabase Migration: AI-graded writing submissions.
--
-- Until now, the Schreiben prompts on the full exams were purely
-- self-compare-to-sample exercises -- nothing a student wrote was ever
-- stored or scored, because free-text grading isn't something a
-- multiple-choice-based scoring engine can do. This table stores real
-- submissions and the AI-generated grade/feedback for them (see the
-- grade-writing Edge Function).

CREATE TABLE IF NOT EXISTS public.writing_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    writing_prompt_id UUID NOT NULL REFERENCES public.test_writing_prompts(id) ON DELETE CASCADE,
    submission_text TEXT NOT NULL,
    overall_score INTEGER,             -- 0-100
    task_fulfillment_score INTEGER,    -- Aufgabenbewaeltigung, 0-100
    range_of_expression_score INTEGER, -- Ausdrucksfaehigkeit, 0-100
    grammar_score INTEGER,             -- Formale Richtigkeit, 0-100
    feedback TEXT,                     -- written feedback, in Arabic
    graded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.writing_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own writing submissions"
    ON public.writing_submissions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own writing submissions"
    ON public.writing_submissions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all writing submissions"
    ON public.writing_submissions FOR SELECT
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_writing_submissions_user_id ON public.writing_submissions(user_id, created_at);
