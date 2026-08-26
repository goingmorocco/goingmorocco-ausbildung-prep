-- Supabase Migration: fix "infinite recursion detected in policy" on users
--
-- The original admin policies on public.users checked admin status with:
--   EXISTS (SELECT 1 FROM public.users admin_check WHERE admin_check.id = auth.uid() AND admin_check.role = 'admin')
-- That subquery selects from public.users -- the very table the policy is
-- protecting. Postgres evaluates ALL permissive policies on a table for
-- every query (they aren't short-circuited), so even a completely
-- unrelated query like "fetch my own profile" ends up evaluating this
-- self-referencing policy too, and Postgres refuses to run it at all
-- (error 42P17: infinite recursion detected in policy for relation "users").
--
-- Fix: move the admin check into a SECURITY DEFINER function. Because it
-- runs with the privileges of the function's owner rather than the
-- calling user, its internal SELECT on public.users bypasses RLS
-- entirely -- breaking the cycle. This is the standard, documented
-- pattern for this exact situation.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;

CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update any user"
    ON public.users FOR UPDATE
    USING (public.is_admin());

-- The notifications / notification_recipients admin policies (from the
-- admin_and_notifications migration) use the same raw-subquery pattern,
-- but on a *different* table than the one being protected, so they don't
-- actually recurse. Switching them to is_admin() too anyway -- one
-- source of truth for "is this user an admin", not two.

DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications"
    ON public.notifications FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage notification recipients" ON public.notification_recipients;
CREATE POLICY "Admins can manage notification recipients"
    ON public.notification_recipients FOR ALL
    USING (public.is_admin());
