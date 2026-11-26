-- Per-language paid access.
--
-- A payment now unlocks ONE language track (de / en / fr / es) for the months paid.
-- Tests, classroom resources, resource files and live classes of a track are only
-- available to students who paid for that track. Students can still pick any
-- language on the dashboard and use the free tier (skill-practice quota) in it.
--
-- users.membership_status stays as the coarse flag: 'active' = at least one paid
-- track currently valid; 'pending' = free tier; 'rejected' = blocked.

-- ---------------------------------------------------------------------------
-- 1. track_access: one row per (student, language)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.track_access (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    track TEXT NOT NULL CHECK (track IN ('de', 'en', 'fr', 'es')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, track)
);
ALTER TABLE public.track_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students read own track access" ON public.track_access;
CREATE POLICY "Students read own track access"
    ON public.track_access FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage track access" ON public.track_access;
CREATE POLICY "Admins manage track access"
    ON public.track_access FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Payments are for one language.
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS track TEXT NOT NULL DEFAULT 'de'
    CHECK (track IN ('de', 'en', 'fr', 'es'));

-- ---------------------------------------------------------------------------
-- 2. Access helpers
-- ---------------------------------------------------------------------------
-- TRUE when the signed-in user may use paid content of `p_track`
-- (NULL = "any paid track", used for content that belongs to every track).
CREATE OR REPLACE FUNCTION public.has_track_access(p_track TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT public.is_admin() OR EXISTS (
        SELECT 1
          FROM public.track_access ta
          JOIN public.users u ON u.id = ta.user_id AND u.membership_status <> 'rejected'
         WHERE ta.user_id = auth.uid()
           AND (p_track IS NULL OR ta.track = p_track)
           AND ta.status = 'active'
           AND ta.current_period_end + make_interval(days => COALESCE(
                   (SELECT grace_days FROM public.payment_settings WHERE id = 1), 0)) >= NOW()
    );
$$;

CREATE OR REPLACE FUNCTION public.my_paid_tracks()
RETURNS TEXT[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT COALESCE(array_agg(ta.track ORDER BY ta.track), ARRAY[]::TEXT[])
      FROM public.track_access ta
      JOIN public.users u ON u.id = ta.user_id AND u.membership_status <> 'rejected'
     WHERE ta.user_id = auth.uid() AND ta.status = 'active'
       AND ta.current_period_end + make_interval(days => COALESCE(
               (SELECT grace_days FROM public.payment_settings WHERE id = 1), 0)) >= NOW();
$$;
GRANT EXECUTE ON FUNCTION public.has_track_access(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_paid_tracks() TO authenticated;

-- "Is a paying member" now means: paid for at least one language.
CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$ SELECT public.has_track_access(NULL); $$;

-- ---------------------------------------------------------------------------
-- 3. Tests: paid access only for the language that was paid
-- ---------------------------------------------------------------------------
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
  test_track TEXT;
  already_attempted BOOLEAN;
  distinct_tests_tried INTEGER;
BEGIN
  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;

  SELECT membership_status INTO user_status FROM public.users WHERE id = auth.uid();
  IF user_status IS NULL OR user_status = 'rejected' THEN
    RETURN FALSE;
  END IF;

  SELECT is_skill_practice, track INTO test_is_skill, test_track
    FROM public.tests WHERE id = target_test_id;
  IF test_track IS NULL THEN
    RETURN FALSE; -- unknown test
  END IF;

  IF public.has_track_access(test_track) THEN
    RETURN TRUE;
  END IF;

  -- Free tier (also for languages the student has not paid for)
  IF test_is_skill IS NOT TRUE THEN
    RETURN FALSE; -- free tier never gets the long realistic exams
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_test_attempts
    WHERE user_id = auth.uid() AND test_id = target_test_id AND completed_at IS NOT NULL
  ) INTO already_attempted;
  IF already_attempted THEN
    RETURN TRUE;
  END IF;

  SELECT COUNT(DISTINCT test_id) INTO distinct_tests_tried
  FROM public.user_test_attempts
  WHERE user_id = auth.uid() AND completed_at IS NOT NULL;

  RETURN distinct_tests_tried < 6;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Classroom resources + files: per track (NULL track = any paid track)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Active members and admins can view resources" ON public.resources;
DROP POLICY IF EXISTS "Paid members and admins can view resources" ON public.resources;
CREATE POLICY "Paid members and admins can view resources"
    ON public.resources FOR SELECT
    USING (public.is_admin() OR public.has_track_access(track));

DROP POLICY IF EXISTS "Active members and admins can read resource files" ON storage.objects;
DROP POLICY IF EXISTS "Paid members and admins can read resource files" ON storage.objects;
CREATE POLICY "Paid members and admins can read resource files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'resources' AND (
        public.is_admin()
        OR EXISTS (SELECT 1 FROM public.resources r
                    WHERE r.file_path = storage.objects.name AND public.has_track_access(r.track))
    ));

-- ---------------------------------------------------------------------------
-- 5. Live classes: only the language that was paid
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_class_sessions()
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
      AND public.has_track_access(g.track)
    ORDER BY s.starts_at;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_class_sessions() TO authenticated;

CREATE OR REPLACE FUNCTION public.join_class_session(sid UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    s public.class_sessions%ROWTYPE;
    g_track TEXT;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

    SELECT * INTO s FROM public.class_sessions WHERE id = sid;
    IF NOT FOUND THEN RAISE EXCEPTION 'session_not_found'; END IF;

    SELECT track INTO g_track FROM public.class_groups WHERE id = s.group_id;
    IF NOT public.has_track_access(g_track) THEN
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

-- ---------------------------------------------------------------------------
-- 6. Granting / expiring access per language
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public._extend_membership(UUID, INT);
CREATE OR REPLACE FUNCTION public._extend_membership(p_user UUID, p_track TEXT, p_months INT,
                                                     OUT o_start TIMESTAMPTZ, OUT o_end TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cur_end TIMESTAMPTZ;
    v_cur_status TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user FOR UPDATE) THEN
        RAISE EXCEPTION 'Student not found';
    END IF;

    SELECT current_period_end, status INTO v_cur_end, v_cur_status
      FROM public.track_access WHERE user_id = p_user AND track = p_track;

    -- Renewing before the end extends from the end; otherwise start now.
    IF v_cur_status = 'active' AND v_cur_end IS NOT NULL AND v_cur_end > NOW() THEN
        o_start := v_cur_end;
    ELSE
        o_start := NOW();
    END IF;
    o_end := o_start + make_interval(months => p_months);

    INSERT INTO public.track_access (user_id, track, status, current_period_start, current_period_end)
    VALUES (p_user, p_track, 'active', o_start, o_end)
    ON CONFLICT (user_id, track) DO UPDATE
        SET status = 'active', current_period_start = EXCLUDED.current_period_start,
            current_period_end = EXCLUDED.current_period_end, updated_at = NOW();

    -- The student follows this language too.
    INSERT INTO public.user_tracks (user_id, track) VALUES (p_user, p_track) ON CONFLICT DO NOTHING;

    PERFORM set_config('app.allow_privileged', '1', true);
    UPDATE public.users SET membership_status = 'active' WHERE id = p_user;
    PERFORM set_config('app.allow_privileged', '', true);
END;
$$;
REVOKE ALL ON FUNCTION public._extend_membership(UUID, TEXT, INT) FROM PUBLIC, anon, authenticated;

-- Student declares a payment for one language.
DROP FUNCTION IF EXISTS public.submit_payment(TEXT, INT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.submit_payment(
    p_method TEXT, p_months INT DEFAULT 1, p_reference TEXT DEFAULT NULL,
    p_proof_path TEXT DEFAULT NULL, p_note TEXT DEFAULT NULL, p_track TEXT DEFAULT 'de')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_price NUMERIC;
    v_id UUID;
    v_status TEXT;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
    IF p_method NOT IN ('cash', 'cih', 'attijariwafa') THEN RAISE EXCEPTION 'Invalid payment method'; END IF;
    IF p_track NOT IN ('de', 'en', 'fr', 'es') THEN RAISE EXCEPTION 'Invalid language'; END IF;
    IF p_months IS NULL OR p_months < 1 OR p_months > 12 THEN RAISE EXCEPTION 'Invalid number of months'; END IF;

    SELECT membership_status INTO v_status FROM public.users WHERE id = v_uid;
    IF v_status IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
    IF v_status = 'rejected' THEN RAISE EXCEPTION 'Account not eligible'; END IF;

    IF (SELECT count(*) FROM public.payments WHERE user_id = v_uid AND status = 'pending') >= 4 THEN
        RAISE EXCEPTION 'Too many pending payments';
    END IF;
    IF p_proof_path IS NOT NULL AND p_proof_path NOT LIKE v_uid::text || '/%' THEN
        RAISE EXCEPTION 'Invalid proof file';
    END IF;

    SELECT price_mad INTO v_price FROM public.payment_settings WHERE id = 1;

    INSERT INTO public.payments (user_id, method, amount, months, reference, proof_path, student_note, track)
    VALUES (v_uid, p_method, v_price * p_months, p_months,
            left(NULLIF(btrim(p_reference), ''), 120), p_proof_path,
            left(NULLIF(btrim(p_note), ''), 500), p_track)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_confirm_payment(p_payment UUID, p_amount NUMERIC DEFAULT NULL,
                                                        p_note TEXT DEFAULT NULL)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pay public.payments;
    v_s TIMESTAMPTZ;
    v_e TIMESTAMPTZ;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admins only'; END IF;
    SELECT * INTO v_pay FROM public.payments WHERE id = p_payment FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
    IF v_pay.status = 'confirmed' THEN RAISE EXCEPTION 'Payment already confirmed'; END IF;

    SELECT o_start, o_end INTO v_s, v_e
      FROM public._extend_membership(v_pay.user_id, v_pay.track, v_pay.months);

    UPDATE public.payments
       SET status = 'confirmed', confirmed_at = NOW(), confirmed_by = auth.uid(),
           amount = COALESCE(p_amount, amount), admin_note = COALESCE(NULLIF(btrim(p_note), ''), admin_note),
           period_start = v_s, period_end = v_e
     WHERE id = p_payment
     RETURNING * INTO v_pay;
    RETURN v_pay;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_record_payment(UUID, TEXT, INT, NUMERIC, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.admin_record_payment(
    p_user UUID, p_method TEXT, p_months INT DEFAULT 1, p_amount NUMERIC DEFAULT NULL,
    p_reference TEXT DEFAULT NULL, p_note TEXT DEFAULT NULL, p_track TEXT DEFAULT 'de')
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_price NUMERIC;
    v_s TIMESTAMPTZ;
    v_e TIMESTAMPTZ;
    v_pay public.payments;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admins only'; END IF;
    IF p_method NOT IN ('cash', 'cih', 'attijariwafa') THEN RAISE EXCEPTION 'Invalid payment method'; END IF;
    IF p_track NOT IN ('de', 'en', 'fr', 'es') THEN RAISE EXCEPTION 'Invalid language'; END IF;
    IF p_months IS NULL OR p_months < 1 OR p_months > 12 THEN RAISE EXCEPTION 'Invalid number of months'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user AND role = 'student') THEN
        RAISE EXCEPTION 'Student not found';
    END IF;

    SELECT price_mad INTO v_price FROM public.payment_settings WHERE id = 1;
    SELECT o_start, o_end INTO v_s, v_e FROM public._extend_membership(p_user, p_track, p_months);

    INSERT INTO public.payments (user_id, method, amount, months, reference, status, track,
                                 admin_note, confirmed_at, confirmed_by, period_start, period_end)
    VALUES (p_user, p_method, COALESCE(p_amount, v_price * p_months), p_months,
            left(NULLIF(btrim(p_reference), ''), 120), 'confirmed', p_track,
            left(NULLIF(btrim(p_note), ''), 500), NOW(), auth.uid(), v_s, v_e)
    RETURNING * INTO v_pay;
    RETURN v_pay;
END;
$$;

-- Expiry, per language. The coarse flag drops to 'pending' once no language is left.
CREATE OR REPLACE FUNCTION public.expire_memberships()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_grace INT;
    v_n INT;
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admins only';
    END IF;
    SELECT grace_days INTO v_grace FROM public.payment_settings WHERE id = 1;

    UPDATE public.track_access SET status = 'expired', updated_at = NOW()
     WHERE status = 'active' AND current_period_end + make_interval(days => v_grace) < NOW();
    GET DIAGNOSTICS v_n = ROW_COUNT;

    PERFORM set_config('app.allow_privileged', '1', true);
    UPDATE public.users u SET membership_status = 'pending'
     WHERE u.role = 'student' AND u.membership_status = 'active'
       AND NOT EXISTS (SELECT 1 FROM public.track_access ta WHERE ta.user_id = u.id AND ta.status = 'active');
    PERFORM set_config('app.allow_privileged', '', true);
    RETURN v_n;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_my_membership()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_grace INT;
    v_status TEXT;
BEGIN
    IF v_uid IS NULL THEN RETURN NULL; END IF;
    SELECT membership_status INTO v_status FROM public.users WHERE id = v_uid AND role = 'student';
    IF v_status IS NULL THEN RETURN NULL; END IF;
    IF v_status <> 'active' THEN RETURN v_status; END IF;

    SELECT grace_days INTO v_grace FROM public.payment_settings WHERE id = 1;
    UPDATE public.track_access SET status = 'expired', updated_at = NOW()
     WHERE user_id = v_uid AND status = 'active'
       AND current_period_end + make_interval(days => v_grace) < NOW();

    IF NOT EXISTS (SELECT 1 FROM public.track_access WHERE user_id = v_uid AND status = 'active') THEN
        PERFORM set_config('app.allow_privileged', '1', true);
        UPDATE public.users SET membership_status = 'pending' WHERE id = v_uid;
        PERFORM set_config('app.allow_privileged', '', true);
        RETURN 'pending';
    END IF;
    RETURN 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.submit_payment(TEXT, INT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_record_payment(UUID, TEXT, INT, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_payment(TEXT, INT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_record_payment(UUID, TEXT, INT, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Backfill: every student who is active today keeps access to the languages
--    they already follow (German if none), for their current period or 30 days.
-- ---------------------------------------------------------------------------
INSERT INTO public.track_access (user_id, track, status, current_period_start, current_period_end)
SELECT u.id, t.track, 'active', NOW(),
       GREATEST(COALESCE((SELECT max(s.current_period_end) FROM public.subscriptions s WHERE s.user_id = u.id), NOW()),
                NOW() + INTERVAL '30 days')
  FROM public.users u
  CROSS JOIN LATERAL (
        SELECT track FROM public.user_tracks ut WHERE ut.user_id = u.id
        UNION SELECT 'de' WHERE NOT EXISTS (SELECT 1 FROM public.user_tracks ut WHERE ut.user_id = u.id)
  ) t
 WHERE u.role = 'student' AND u.membership_status = 'active'
ON CONFLICT DO NOTHING;
