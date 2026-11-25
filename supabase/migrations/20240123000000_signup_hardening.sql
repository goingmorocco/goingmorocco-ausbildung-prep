-- Signup hardening
--
-- 1. handle_new_user(): never let a profile-insert problem (over-long name or
--    phone, duplicate e-mail row, ...) block account creation. Values are trimmed
--    to the column sizes, and the course language chosen on the signup form
--    (raw_user_meta_data.track) becomes the student's first track.
-- 2. ensure_my_profile(): lets the site create the signed-in user's profile row
--    if it is missing (so a half-created account can still log in).
-- 3. One-off backfill of profile rows for auth users that have none.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_name  TEXT;
    v_track TEXT;
BEGIN
    v_name := left(COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
                            split_part(NEW.email, '@', 1)), 255);
    BEGIN
        INSERT INTO public.users (id, full_name, email, phone, role, membership_status)
        VALUES (NEW.id, v_name, NEW.email,
                left(NEW.raw_user_meta_data->>'phone', 50), 'student', 'pending')
        ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user: profile insert failed for %: %', NEW.id, SQLERRM;
    END;

    v_track := NEW.raw_user_meta_data->>'track';
    IF v_track IN ('de', 'en', 'fr', 'es') THEN
        BEGIN
            INSERT INTO public.user_tracks (user_id, track) VALUES (NEW.id, v_track)
            ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'handle_new_user: track insert failed for %: %', NEW.id, SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_my_profile()
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN;
    END IF;
    INSERT INTO public.users (id, full_name, email, phone, role, membership_status)
    SELECT u.id,
           left(COALESCE(NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1)), 255),
           u.email, left(u.raw_user_meta_data->>'phone', 50), 'student', 'pending'
    FROM auth.users u
    WHERE u.id = auth.uid()
    ON CONFLICT DO NOTHING;
    RETURN QUERY SELECT * FROM public.users WHERE id = auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile() TO authenticated;

-- Backfill: auth users with no profile row.
INSERT INTO public.users (id, full_name, email, phone, role, membership_status)
SELECT u.id,
       left(COALESCE(NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1)), 255),
       u.email, left(u.raw_user_meta_data->>'phone', 50), 'student', 'pending'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.users p WHERE p.id = u.id)
ON CONFLICT DO NOTHING;
