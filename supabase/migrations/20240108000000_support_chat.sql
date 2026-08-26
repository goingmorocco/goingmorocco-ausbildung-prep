-- Supabase Migration: quick support chat between admin and each student.
--
-- One thread per student (student_id groups all messages belonging to
-- that conversation); sender_id/sender_role record who actually wrote
-- each message, since either the student or an admin can post into the
-- same thread. Realtime is enabled on this table so both sides see new
-- messages live, not via polling.

CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_role VARCHAR(10) NOT NULL,
    body TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT support_messages_sender_role_check CHECK (sender_role IN ('student', 'admin'))
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own thread"
    ON public.support_messages FOR SELECT
    USING (student_id = auth.uid());

CREATE POLICY "Admins can view all threads"
    ON public.support_messages FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Students can send messages in their own thread"
    ON public.support_messages FOR INSERT
    WITH CHECK (student_id = auth.uid() AND sender_id = auth.uid() AND sender_role = 'student');

CREATE POLICY "Admins can send messages in any thread"
    ON public.support_messages FOR INSERT
    WITH CHECK (public.is_admin() AND sender_id = auth.uid() AND sender_role = 'admin');

CREATE POLICY "Students can mark their own thread as read"
    ON public.support_messages FOR UPDATE
    USING (student_id = auth.uid());

CREATE POLICY "Admins can mark any thread as read"
    ON public.support_messages FOR UPDATE
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_support_messages_student_id ON public.support_messages(student_id, created_at);

-- Enables the frontend to subscribe to new messages live via
-- sb.channel(...).on('postgres_changes', ...) instead of polling.
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- ---------------------------------------------------------------------
-- Admin inbox view: one row per student thread, with the last message
-- and an unread count, so the admin support tab doesn't need N+1
-- queries or an Edge Function to build its thread list.
--
-- security_invoker = true is deliberate: without it, a view created
-- during a migration runs with the *creator's* privileges and would
-- silently bypass the RLS policies above, letting a student query it
-- and see every other student's thread. With it, the view instead
-- respects the RLS of whoever is actually running the query -- so an
-- admin (whose users-table access covers everyone) sees every thread,
-- while a student (whose users-table access is only their own row)
-- transparently sees only their own thread, with no separate policy
-- needed on the view itself.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.support_threads
WITH (security_invoker = true) AS
SELECT
    u.id AS student_id,
    u.full_name,
    u.email,
    (SELECT body FROM public.support_messages m WHERE m.student_id = u.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
    (SELECT created_at FROM public.support_messages m WHERE m.student_id = u.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
    (SELECT COUNT(*) FROM public.support_messages m WHERE m.student_id = u.id AND m.sender_role = 'student' AND m.read_at IS NULL) AS unread_count
FROM public.users u
WHERE EXISTS (SELECT 1 FROM public.support_messages m WHERE m.student_id = u.id);
