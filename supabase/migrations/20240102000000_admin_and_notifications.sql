-- Supabase Migration: Admin roles, membership approval workflow, notifications
-- Adds what api/admin.js currently mocks in-memory, so a real Supabase
-- integration can replace the mock layer with the same shape.

-- Role + membership approval status on users
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'student', -- student, admin
    ADD COLUMN IF NOT EXISTS membership_status VARCHAR(20) NOT NULL DEFAULT 'pending'; -- pending, active, rejected

CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_check
            WHERE admin_check.id = auth.uid() AND admin_check.role = 'admin'
        )
    );

CREATE POLICY "Admins can update any user"
    ON public.users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_check
            WHERE admin_check.id = auth.uid() AND admin_check.role = 'admin'
        )
    );

-- Notifications sent by an admin to a segment of members
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    audience VARCHAR(20) NOT NULL, -- all, active, pending, rejected, or a specific user id
    sent_by UUID REFERENCES public.users(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notifications"
    ON public.notifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_check
            WHERE admin_check.id = auth.uid() AND admin_check.role = 'admin'
        )
    );

-- Which members received which notification (for read receipts / history)
CREATE TABLE IF NOT EXISTS public.notification_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notification_recipients FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage notification recipients"
    ON public.notification_recipients FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_check
            WHERE admin_check.id = auth.uid() AND admin_check.role = 'admin'
        )
    );
