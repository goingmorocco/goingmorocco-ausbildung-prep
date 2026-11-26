-- Manual payments: cash at the academy + bank transfers (CIH, Attijariwafa bank)
--
-- * payment_settings : single row, admin-editable (price, bank details, grace days)
-- * payments         : one row per payment (student declaration or admin entry)
-- * RPCs             : submit_payment, admin_confirm_payment, admin_reject_payment,
--                      admin_record_payment, refresh_my_membership, expire_memberships
-- * Students can no longer write to `subscriptions` (closes the free self-renewal hole)
-- * Paid access ends automatically after period end + grace days.

-- ---------------------------------------------------------------------------
-- 0. Let trusted SECURITY DEFINER functions change membership_status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_user_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF COALESCE(current_setting('app.allow_privileged', true), '') = '1' THEN
        RETURN NEW;
    END IF;
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        IF NEW.role IS DISTINCT FROM OLD.role
           OR NEW.membership_status IS DISTINCT FROM OLD.membership_status THEN
            RAISE EXCEPTION 'Not allowed to change role or membership status';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 1. Settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    price_mad NUMERIC(10,2) NOT NULL DEFAULT 200 CHECK (price_mad > 0),
    grace_days INT NOT NULL DEFAULT 3 CHECK (grace_days BETWEEN 0 AND 60),
    cih_holder TEXT NOT NULL DEFAULT '',
    cih_rib TEXT NOT NULL DEFAULT '',
    awb_holder TEXT NOT NULL DEFAULT '',
    awb_rib TEXT NOT NULL DEFAULT '',
    cash_info TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.payment_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Signed-in users read payment settings" ON public.payment_settings;
CREATE POLICY "Signed-in users read payment settings"
    ON public.payment_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage payment settings" ON public.payment_settings;
CREATE POLICY "Admins manage payment settings"
    ON public.payment_settings FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('cash', 'cih', 'attijariwafa')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    months INT NOT NULL DEFAULT 1 CHECK (months BETWEEN 1 AND 12),
    reference TEXT,
    proof_path TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    student_note TEXT,
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status, created_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students read own payments" ON public.payments;
CREATE POLICY "Students read own payments"
    ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
CREATE POLICY "Admins manage payments"
    ON public.payments FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
-- No INSERT/UPDATE policy for students: they go through submit_payment().

-- ---------------------------------------------------------------------------
-- 3. Lock down subscriptions (read-only for students)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins manage subscriptions"
    ON public.subscriptions FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Proof-of-transfer bucket (private; files live under <user_id>/...)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-proofs', 'payment-proofs', false, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Students upload own payment proofs" ON storage.objects;
CREATE POLICY "Students upload own payment proofs"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'payment-proofs'
                AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Students read own payment proofs" ON storage.objects;
CREATE POLICY "Students read own payment proofs"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'payment-proofs'
           AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
DROP POLICY IF EXISTS "Admins delete payment proofs" ON storage.objects;
CREATE POLICY "Admins delete payment proofs"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'payment-proofs' AND public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Internal helper: grant `months` of access to a student
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._extend_membership(p_user UUID, p_months INT,
                                                     OUT o_start TIMESTAMPTZ, OUT o_end TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sub_id UUID;
    v_cur_end TIMESTAMPTZ;
    v_status TEXT;
BEGIN
    SELECT membership_status INTO v_status FROM public.users WHERE id = p_user FOR UPDATE;
    IF v_status IS NULL THEN RAISE EXCEPTION 'Student not found'; END IF;

    SELECT id, current_period_end INTO v_sub_id, v_cur_end
      FROM public.subscriptions WHERE user_id = p_user
      ORDER BY current_period_end DESC NULLS LAST LIMIT 1;

    -- Renew early => extend from the current end; otherwise start now.
    IF v_status = 'active' AND v_cur_end IS NOT NULL AND v_cur_end > NOW() THEN
        o_start := v_cur_end;
    ELSE
        o_start := NOW();
    END IF;
    o_end := o_start + make_interval(months => p_months);

    IF v_sub_id IS NULL THEN
        INSERT INTO public.subscriptions (user_id, status, current_period_start, current_period_end)
        VALUES (p_user, 'active', o_start, o_end);
    ELSE
        UPDATE public.subscriptions
           SET status = 'active', current_period_start = o_start, current_period_end = o_end,
               cancel_at_period_end = FALSE, updated_at = NOW()
         WHERE id = v_sub_id;
    END IF;

    PERFORM set_config('app.allow_privileged', '1', true);
    UPDATE public.users SET membership_status = 'active' WHERE id = p_user;
    PERFORM set_config('app.allow_privileged', '', true);
END;
$$;
REVOKE ALL ON FUNCTION public._extend_membership(UUID, INT) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Student: declare a payment (cash promise or bank transfer made)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_payment(
    p_method TEXT, p_months INT DEFAULT 1, p_reference TEXT DEFAULT NULL,
    p_proof_path TEXT DEFAULT NULL, p_note TEXT DEFAULT NULL)
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
    IF p_months IS NULL OR p_months < 1 OR p_months > 12 THEN RAISE EXCEPTION 'Invalid number of months'; END IF;

    SELECT membership_status INTO v_status FROM public.users WHERE id = v_uid;
    IF v_status IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
    IF v_status = 'rejected' THEN RAISE EXCEPTION 'Account not eligible'; END IF;

    IF (SELECT count(*) FROM public.payments WHERE user_id = v_uid AND status = 'pending') >= 3 THEN
        RAISE EXCEPTION 'Too many pending payments';
    END IF;

    -- A proof file must live in the student's own folder.
    IF p_proof_path IS NOT NULL AND p_proof_path NOT LIKE v_uid::text || '/%' THEN
        RAISE EXCEPTION 'Invalid proof file';
    END IF;

    SELECT price_mad INTO v_price FROM public.payment_settings WHERE id = 1;

    INSERT INTO public.payments (user_id, method, amount, months, reference, proof_path, student_note)
    VALUES (v_uid, p_method, v_price * p_months, p_months,
            left(NULLIF(btrim(p_reference), ''), 120), p_proof_path,
            left(NULLIF(btrim(p_note), ''), 500))
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Admin: confirm / reject / record
-- ---------------------------------------------------------------------------
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

    SELECT o_start, o_end INTO v_s, v_e FROM public._extend_membership(v_pay.user_id, v_pay.months);

    UPDATE public.payments
       SET status = 'confirmed', confirmed_at = NOW(), confirmed_by = auth.uid(),
           amount = COALESCE(p_amount, amount), admin_note = COALESCE(NULLIF(btrim(p_note), ''), admin_note),
           period_start = v_s, period_end = v_e
     WHERE id = p_payment
     RETURNING * INTO v_pay;
    RETURN v_pay;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_payment(p_payment UUID, p_note TEXT DEFAULT NULL)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_pay public.payments;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admins only'; END IF;
    UPDATE public.payments
       SET status = 'rejected', admin_note = left(NULLIF(btrim(p_note), ''), 500),
           confirmed_at = NOW(), confirmed_by = auth.uid()
     WHERE id = p_payment AND status = 'pending'
     RETURNING * INTO v_pay;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pending payment not found'; END IF;
    RETURN v_pay;
END;
$$;

-- Cash (or any payment) received directly by the academy: recorded as confirmed at once.
CREATE OR REPLACE FUNCTION public.admin_record_payment(
    p_user UUID, p_method TEXT, p_months INT DEFAULT 1, p_amount NUMERIC DEFAULT NULL,
    p_reference TEXT DEFAULT NULL, p_note TEXT DEFAULT NULL)
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
    IF p_months IS NULL OR p_months < 1 OR p_months > 12 THEN RAISE EXCEPTION 'Invalid number of months'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user AND role = 'student') THEN
        RAISE EXCEPTION 'Student not found';
    END IF;
    IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user AND membership_status = 'rejected') THEN
        -- Re-admitting a rejected student is deliberate: payment received means access.
        NULL;
    END IF;

    SELECT price_mad INTO v_price FROM public.payment_settings WHERE id = 1;
    SELECT o_start, o_end INTO v_s, v_e FROM public._extend_membership(p_user, p_months);

    INSERT INTO public.payments (user_id, method, amount, months, reference, status,
                                 admin_note, confirmed_at, confirmed_by, period_start, period_end)
    VALUES (p_user, p_method, COALESCE(p_amount, v_price * p_months), p_months,
            left(NULLIF(btrim(p_reference), ''), 120), 'confirmed',
            left(NULLIF(btrim(p_note), ''), 500), NOW(), auth.uid(), v_s, v_e)
    RETURNING * INTO v_pay;
    RETURN v_pay;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Expiry
-- ---------------------------------------------------------------------------
-- Downgrades students whose paid period ended more than grace_days ago.
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
    -- Callable by admins, by the scheduler (no auth.uid()) and internally.
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admins only';
    END IF;
    SELECT grace_days INTO v_grace FROM public.payment_settings WHERE id = 1;

    PERFORM set_config('app.allow_privileged', '1', true);
    WITH expired AS (
        UPDATE public.users u SET membership_status = 'pending'
         WHERE u.role = 'student' AND u.membership_status = 'active'
           AND EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id)
           AND (SELECT max(s.current_period_end) FROM public.subscriptions s WHERE s.user_id = u.id)
               + make_interval(days => v_grace) < NOW()
        RETURNING u.id
    )
    UPDATE public.subscriptions s SET status = 'expired', updated_at = NOW()
     WHERE s.user_id IN (SELECT id FROM expired);
    GET DIAGNOSTICS v_n = ROW_COUNT;
    PERFORM set_config('app.allow_privileged', '', true);
    RETURN v_n;
END;
$$;

-- Lazy per-user check, called by the site when a student signs in / opens the dashboard.
CREATE OR REPLACE FUNCTION public.refresh_my_membership()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_grace INT;
    v_end TIMESTAMPTZ;
    v_status TEXT;
BEGIN
    IF v_uid IS NULL THEN RETURN NULL; END IF;
    SELECT membership_status INTO v_status FROM public.users WHERE id = v_uid AND role = 'student';
    IF v_status IS NULL THEN RETURN NULL; END IF;
    IF v_status <> 'active' THEN RETURN v_status; END IF;

    SELECT grace_days INTO v_grace FROM public.payment_settings WHERE id = 1;
    SELECT max(current_period_end) INTO v_end FROM public.subscriptions WHERE user_id = v_uid;
    IF v_end IS NOT NULL AND v_end + make_interval(days => v_grace) < NOW() THEN
        PERFORM set_config('app.allow_privileged', '1', true);
        UPDATE public.users SET membership_status = 'pending' WHERE id = v_uid;
        PERFORM set_config('app.allow_privileged', '', true);
        UPDATE public.subscriptions SET status = 'expired', updated_at = NOW() WHERE user_id = v_uid;
        RETURN 'pending';
    END IF;
    RETURN 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.submit_payment(TEXT, INT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_confirm_payment(UUID, NUMERIC, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reject_payment(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_record_payment(UUID, TEXT, INT, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.expire_memberships() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.refresh_my_membership() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_payment(TEXT, INT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_confirm_payment(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_payment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_record_payment(UUID, TEXT, INT, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_memberships() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_my_membership() TO authenticated;

-- ---------------------------------------------------------------------------
-- 9. One-off: students who are already active get a 30-day period starting now
--    (so nobody is cut off the moment this migration runs).
-- ---------------------------------------------------------------------------
INSERT INTO public.subscriptions (user_id, status, current_period_start, current_period_end)
SELECT u.id, 'active', NOW(), NOW() + INTERVAL '30 days'
  FROM public.users u
 WHERE u.role = 'student' AND u.membership_status = 'active'
   AND NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id);

-- Active students whose old subscription row already lapsed (or has no end date): same 30 days.
UPDATE public.subscriptions s
   SET status = 'active', current_period_start = NOW(), current_period_end = NOW() + INTERVAL '30 days'
 WHERE s.user_id IN (SELECT id FROM public.users WHERE role = 'student' AND membership_status = 'active')
   AND (s.current_period_end IS NULL OR s.current_period_end < NOW());

-- ---------------------------------------------------------------------------
-- 10. Daily automatic expiry (only if pg_cron is enabled on the project)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'expire-memberships';
        PERFORM cron.schedule('expire-memberships', '10 3 * * *', 'SELECT public.expire_memberships()');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END $$;
