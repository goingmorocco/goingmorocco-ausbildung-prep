-- Live classes: groups, enrollments, scheduled sessions (teacher-pasted Zoom/Meet
-- links) and click-to-join attendance.
--
-- Security model: students have NO direct SELECT on class_sessions, so the
-- join_url can't be read or scraped. They go through SECURITY DEFINER RPCs that
-- check enrollment + active membership + time window, log attendance, and only
-- then return the link.

-- ---------------------------------------------------------------------------
-- 0. Close a privilege hole: the "Users can update their own profile" policy
--    lets any user UPDATE their own row, including role / membership_status.
--    Block that for non-admins. auth.uid() IS NULL (SQL editor, service role,
--    edge functions) is allowed through.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_user_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        IF NEW.role IS DISTINCT FROM OLD.role
           OR NEW.membership_status IS DISTINCT FROM OLD.membership_status THEN
            RAISE EXCEPTION 'Not allowed to change role or membership status';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_privileged_columns ON public.users;
CREATE TRIGGER trg_protect_user_privileged_columns
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.protect_user_privileged_columns();

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    level TEXT,
    description TEXT,
    teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.class_groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.class_groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 5 AND 480),
    join_url TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'zoom' CHECK (platform IN ('zoom', 'meet', 'other')),
    notes TEXT,
    recording_url TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_class_sessions_group_start ON public.class_sessions (group_id, starts_at);

CREATE TABLE IF NOT EXISTS public.class_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    join_count INT NOT NULL DEFAULT 1,
    source TEXT NOT NULL DEFAULT 'click' CHECK (source IN ('click', 'manual')),
    UNIQUE (session_id, student_id)
);

ALTER TABLE public.class_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Helper functions (SECURITY DEFINER to avoid RLS recursion)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher');
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'teacher'));
$$;

CREATE OR REPLACE FUNCTION public.teaches_group(gid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT public.is_admin()
        OR EXISTS (SELECT 1 FROM public.class_groups WHERE id = gid AND teacher_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_enrolled(gid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT EXISTS (SELECT 1 FROM public.class_enrollments WHERE group_id = gid AND student_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- 3. RLS policies
-- ---------------------------------------------------------------------------
-- Groups: admin all; teacher reads/updates own; enrolled students read.
CREATE POLICY "Admins manage groups" ON public.class_groups
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teachers read own groups" ON public.class_groups
    FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Students read enrolled groups" ON public.class_groups
    FOR SELECT USING (public.is_enrolled(id));

-- Enrollments: admin all; teacher manages for own groups; student sees own.
CREATE POLICY "Admins manage enrollments" ON public.class_enrollments
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teachers manage own group enrollments" ON public.class_enrollments
    FOR ALL USING (public.teaches_group(group_id)) WITH CHECK (public.teaches_group(group_id));
CREATE POLICY "Students read own enrollments" ON public.class_enrollments
    FOR SELECT USING (student_id = auth.uid());

-- Sessions: staff only. Students deliberately get NO policy (link stays hidden).
CREATE POLICY "Admins manage sessions" ON public.class_sessions
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teachers manage own sessions" ON public.class_sessions
    FOR ALL USING (public.teaches_group(group_id)) WITH CHECK (public.teaches_group(group_id));

-- Attendance: staff read/manage for their groups; student reads own. Writes by
-- students only via join_class_session().
CREATE POLICY "Admins manage attendance" ON public.class_attendance
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teachers manage own attendance" ON public.class_attendance
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.class_sessions s
                WHERE s.id = session_id AND public.teaches_group(s.group_id))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.class_sessions s
                WHERE s.id = session_id AND public.teaches_group(s.group_id))
    );
CREATE POLICY "Students read own attendance" ON public.class_attendance
    FOR SELECT USING (student_id = auth.uid());

-- Teachers need to see basic profile info of their students (names for rosters).
-- Done through get_group_roster() below instead of widening users RLS.

-- ---------------------------------------------------------------------------
-- 4. RPCs
-- ---------------------------------------------------------------------------
-- Student: upcoming + recent sessions for my groups. NO join_url here.
CREATE OR REPLACE FUNCTION public.get_my_class_sessions()
RETURNS TABLE (
    session_id UUID, group_id UUID, group_name TEXT, level TEXT, title TEXT,
    starts_at TIMESTAMPTZ, duration_minutes INT, platform TEXT, notes TEXT,
    recording_url TEXT, joinable BOOLEAN, attended BOOLEAN
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT s.id, g.id, g.name, g.level, s.title, s.starts_at, s.duration_minutes,
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

-- Student: click Join. Checks everything, logs attendance, returns the link.
CREATE OR REPLACE FUNCTION public.join_class_session(sid UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    s public.class_sessions%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

    SELECT * INTO s FROM public.class_sessions WHERE id = sid;
    IF NOT FOUND THEN RAISE EXCEPTION 'session_not_found'; END IF;

    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND membership_status = 'active') THEN
        RAISE EXCEPTION 'membership_required';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.class_groups WHERE id = s.group_id AND is_active)
       OR NOT public.is_enrolled(s.group_id) THEN
        RAISE EXCEPTION 'not_enrolled';
    END IF;
    IF NOW() < s.starts_at - INTERVAL '15 minutes' THEN RAISE EXCEPTION 'too_early'; END IF;
    IF NOW() > s.starts_at + make_interval(mins => s.duration_minutes) + INTERVAL '30 minutes' THEN
        RAISE EXCEPTION 'session_ended';
    END IF;

    INSERT INTO public.class_attendance (session_id, student_id)
    VALUES (sid, auth.uid())
    ON CONFLICT (session_id, student_id)
    DO UPDATE SET last_joined_at = NOW(), join_count = public.class_attendance.join_count + 1;

    RETURN s.join_url;
END;
$$;

-- Staff: roster of a group (names/emails of enrolled students).
CREATE OR REPLACE FUNCTION public.get_group_roster(gid UUID)
RETURNS TABLE (student_id UUID, full_name TEXT, email TEXT, membership_status TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
BEGIN
    IF NOT public.teaches_group(gid) THEN RAISE EXCEPTION 'forbidden'; END IF;
    RETURN QUERY
        SELECT u.id, u.full_name::TEXT, u.email::TEXT, u.membership_status::TEXT
        FROM public.class_enrollments e JOIN public.users u ON u.id = e.student_id
        WHERE e.group_id = gid ORDER BY u.full_name;
END;
$$;

-- Staff: attendance sheet for one session (every enrolled student, present or not).
CREATE OR REPLACE FUNCTION public.get_session_attendance(sid UUID)
RETURNS TABLE (student_id UUID, full_name TEXT, present BOOLEAN, joined_at TIMESTAMPTZ,
               join_count INT, source TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE gid UUID;
BEGIN
    SELECT group_id INTO gid FROM public.class_sessions WHERE id = sid;
    IF gid IS NULL OR NOT public.teaches_group(gid) THEN RAISE EXCEPTION 'forbidden'; END IF;
    RETURN QUERY
        SELECT u.id, u.full_name::TEXT, (a.id IS NOT NULL), a.joined_at, a.join_count, a.source
        FROM public.class_enrollments e
        JOIN public.users u ON u.id = e.student_id
        LEFT JOIN public.class_attendance a ON a.session_id = sid AND a.student_id = u.id
        WHERE e.group_id = gid ORDER BY u.full_name;
END;
$$;

-- Staff: manually mark present/absent (e.g. student joined from another device).
CREATE OR REPLACE FUNCTION public.set_attendance(sid UUID, student UUID, present BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE gid UUID;
BEGIN
    SELECT group_id INTO gid FROM public.class_sessions WHERE id = sid;
    IF gid IS NULL OR NOT public.teaches_group(gid) THEN RAISE EXCEPTION 'forbidden'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.class_enrollments WHERE group_id = gid AND student_id = student) THEN
        RAISE EXCEPTION 'not_enrolled';
    END IF;
    IF present THEN
        INSERT INTO public.class_attendance (session_id, student_id, source, join_count)
        VALUES (sid, student, 'manual', 0)
        ON CONFLICT (session_id, student_id) DO NOTHING;
    ELSE
        DELETE FROM public.class_attendance WHERE session_id = sid AND student_id = student;
    END IF;
END;
$$;

-- Admin: find a user by email (to enroll / promote to teacher).
CREATE OR REPLACE FUNCTION public.find_user_by_email(q TEXT)
RETURNS TABLE (id UUID, full_name TEXT, email TEXT, role TEXT, membership_status TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
BEGIN
    IF NOT public.is_staff() THEN RAISE EXCEPTION 'forbidden'; END IF;
    RETURN QUERY
        SELECT u.id, u.full_name::TEXT, u.email::TEXT, u.role::TEXT, u.membership_status::TEXT
        FROM public.users u WHERE lower(u.email) = lower(trim(q)) LIMIT 1;
END;
$$;

-- Admin: promote/demote teacher.
CREATE OR REPLACE FUNCTION public.set_user_teacher(uid UUID, make_teacher BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
    UPDATE public.users
       SET role = CASE WHEN make_teacher THEN 'teacher' ELSE 'student' END
     WHERE id = uid AND role <> 'admin';
END;
$$;

GRANT EXECUTE ON FUNCTION
    public.get_my_class_sessions(), public.join_class_session(UUID),
    public.get_group_roster(UUID), public.get_session_attendance(UUID),
    public.set_attendance(UUID, UUID, BOOLEAN), public.find_user_by_email(TEXT),
    public.set_user_teacher(UUID, BOOLEAN)
TO authenticated;
