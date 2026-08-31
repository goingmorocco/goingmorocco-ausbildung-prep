-- Supabase Migration: fixes a silent bug where students never saw
-- notifications sent to them. The notification_recipients table
-- correctly let a student see their own recipient row, but the
-- notifications table itself only had an admin-only policy -- and
-- Supabase enforces RLS on BOTH tables in an embedded/joined query,
-- not just the outer one. So the embed silently returned null for
-- the notification content, and the dashboard's own `.filter(r =>
-- r.notifications)` quietly dropped every row -- no error, just an
-- empty list.

CREATE POLICY "Users can view notifications addressed to them"
    ON public.notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.notification_recipients nr
            WHERE nr.notification_id = notifications.id AND nr.user_id = auth.uid()
        )
    );
