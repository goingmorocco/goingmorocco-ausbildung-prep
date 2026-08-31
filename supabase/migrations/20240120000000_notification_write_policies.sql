-- Supabase Migration: two missing write policies on notification_recipients.
--
-- 1. UPDATE was never granted to students at all -- only SELECT and an
--    admin-only ALL policy existed. That meant markAllNotificationsRead()
--    was silently failing every single time: Supabase does not raise an
--    error for an update that RLS filters down to zero matching rows, it
--    just succeeds having changed nothing. The badge cleared in the
--    browser's local state for that session, but read_at was never
--    actually persisted -- so a fresh login re-fetched from the database,
--    saw everything still unread, and the badge came right back.
--
-- 2. DELETE, for the new "clear my notifications" feature -- a student
--    can remove their own recipient rows (dismissing the notification
--    from their own list) without touching the underlying notification
--    or any other student's copy of it.

CREATE POLICY "Users can mark their own notifications read"
    ON public.notification_recipients FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can clear their own notifications"
    ON public.notification_recipients FOR DELETE
    USING (auth.uid() = user_id);
