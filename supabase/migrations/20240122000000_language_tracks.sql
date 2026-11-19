-- Language tracks: German (de), English (en), French (fr), Spanish (es).
-- A student picks / is enrolled in one or more tracks; the dashboard, practice
-- tests, classroom resources and live classes follow the selected track.

-- Tests: every test belongs to one track. Existing tests are German.
ALTER TABLE public.tests
    ADD COLUMN IF NOT EXISTS track TEXT NOT NULL DEFAULT 'de'
    CHECK (track IN ('de', 'en', 'fr', 'es'));
CREATE INDEX IF NOT EXISTS idx_tests_track ON public.tests(track);

-- Resources: NULL track = shown in every track. Existing content is German.
ALTER TABLE public.resources
    ADD COLUMN IF NOT EXISTS track TEXT
    CHECK (track IS NULL OR track IN ('de', 'en', 'fr', 'es'));
UPDATE public.resources SET track = 'de' WHERE track IS NULL;

-- Class groups belong to a track.
ALTER TABLE public.class_groups
    ADD COLUMN IF NOT EXISTS track TEXT NOT NULL DEFAULT 'de'
    CHECK (track IN ('de', 'en', 'fr', 'es'));

-- Which tracks a student follows.
CREATE TABLE IF NOT EXISTS public.user_tracks (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    track TEXT NOT NULL CHECK (track IN ('de', 'en', 'fr', 'es')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, track)
);
ALTER TABLE public.user_tracks ENABLE ROW LEVEL SECURITY;

-- Tracks unlock nothing by themselves (paid access is membership_status), so
-- students may add / remove their own. Admins manage anyone's.
CREATE POLICY "Users read own tracks" ON public.user_tracks
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users add own tracks" ON public.user_tracks
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove own tracks" ON public.user_tracks
    FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins manage tracks" ON public.user_tracks
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Existing students were all German learners.
INSERT INTO public.user_tracks (user_id, track)
SELECT id, 'de' FROM public.users WHERE role = 'student'
ON CONFLICT DO NOTHING;

-- Enrolling a student in a class group adds that group's track to them.
CREATE OR REPLACE FUNCTION public.add_track_on_enrollment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.user_tracks (user_id, track)
    SELECT NEW.student_id, g.track FROM public.class_groups g WHERE g.id = NEW.group_id
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_add_track_on_enrollment ON public.class_enrollments;
CREATE TRIGGER trg_add_track_on_enrollment
    AFTER INSERT ON public.class_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.add_track_on_enrollment();

-- Student session list now also returns the group's track.
DROP FUNCTION IF EXISTS public.get_my_class_sessions();
CREATE FUNCTION public.get_my_class_sessions()
RETURNS TABLE (
    session_id UUID, group_id UUID, group_name TEXT, level TEXT, track TEXT, title TEXT,
    starts_at TIMESTAMPTZ, duration_minutes INT, platform TEXT, notes TEXT,
    recording_url TEXT, joinable BOOLEAN, attended BOOLEAN
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT s.id, g.id, g.name, g.level, g.track, s.title, s.starts_at, s.duration_minutes,
           s.platform, s.notes, s.recording_url,
           (NOW() BETWEEN s.starts_at - INTERVAL '15 minutes'
                      AND s.starts_at + make_interval(mins => s.duration_minutes) + INTERVAL '30 minutes') AS joinable,
           EXISTS (SELECT 1 FROM public.class_attendance a
                   WHERE a.session_id = s.id AND a.student_id = auth.uid()) AS attended
    FROM public.class_sessions s
    JOIN public.class_groups g ON g.id = s.group_id AND g.is_active
    JOIN public.class_enrollments e ON e.group_id = g.id AND e.student_id = auth.uid()
    WHERE s.starts_at > NOW() - INTERVAL '30 days'
      AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.membership_status = 'active')
    ORDER BY s.starts_at;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_class_sessions() TO authenticated;
