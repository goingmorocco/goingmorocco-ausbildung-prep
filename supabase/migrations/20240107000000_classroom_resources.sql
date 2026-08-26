-- Supabase Migration: Classroom -- downloadable resources (PDFs) and a
-- YouTube video collection, visible to active members and manageable by
-- admins only.

-- Same pattern as is_admin() (see the RLS-recursion-fix migration):
-- SECURITY DEFINER so the internal SELECT bypasses RLS, avoiding the
-- same self-referencing-policy trap.
CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND membership_status = 'active'
  );
$$;

CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL,       -- 'pdf' | 'youtube'
    category VARCHAR(100),           -- free-text grouping, e.g. 'Goethe B1', 'عام'
    file_path TEXT,                  -- Storage object path, for type = 'pdf'
    youtube_id VARCHAR(50),          -- extracted video ID, for type = 'youtube'
    order_index INTEGER NOT NULL DEFAULT 0,
    uploaded_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT resources_type_check CHECK (type IN ('pdf', 'youtube')),
    CONSTRAINT resources_type_data_check CHECK (
        (type = 'pdf' AND file_path IS NOT NULL) OR
        (type = 'youtube' AND youtube_id IS NOT NULL)
    )
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members and admins can view resources"
    ON public.resources FOR SELECT
    USING (public.is_active_member() OR public.is_admin());

CREATE POLICY "Admins can manage resources"
    ON public.resources FOR ALL
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);

-- ---------------------------------------------------------------------
-- Storage: a PRIVATE bucket for PDFs. Private (not public) because
-- membership approval is meant to gate access -- a public bucket would
-- let anyone with a guessed/shared URL download files regardless of
-- whether they're an approved student. Files are served to the frontend
-- via short-lived signed URLs (see public/classroom.html), generated
-- only for callers these policies actually allow through.
-- ---------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Active members and admins can read resource files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'resources' AND (public.is_active_member() OR public.is_admin()));

CREATE POLICY "Admins can upload resource files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'resources' AND public.is_admin());

CREATE POLICY "Admins can update resource files"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'resources' AND public.is_admin());

CREATE POLICY "Admins can delete resource files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'resources' AND public.is_admin());
