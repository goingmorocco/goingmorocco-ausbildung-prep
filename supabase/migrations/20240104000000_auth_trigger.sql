-- Supabase Migration: auto-create a profile row when someone signs up
--
-- Supabase Auth only creates a row in the built-in auth.users table on
-- signup -- it knows nothing about our public.users profile table (which
-- holds full_name, role, membership_status, etc.). This trigger bridges
-- the two automatically, so a real signup produces exactly the same shape
-- the old mock backend used to build by hand in api/auth.js.
--
-- The trigger runs as SECURITY DEFINER so it can write to public.users
-- even though the new user has no session/RLS access yet at the moment
-- their account is created.

-- The registration form collects an optional phone number, but the base
-- schema never included a column for it (the old mock backend just kept
-- it in memory). Add it here so the trigger below can save it.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, full_name, email, phone, role, membership_status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        'student',
        'pending'   -- every new signup waits for admin approval, same as before
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- One-time setup note (not something the app does automatically): after
-- your first real signup, promote that account to admin manually by
-- running, in the Supabase SQL editor:
--
--   UPDATE public.users
--   SET role = 'admin', membership_status = 'active'
--   WHERE email = 'your-email@example.com';
-- ---------------------------------------------------------------------
