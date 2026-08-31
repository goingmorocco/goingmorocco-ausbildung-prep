-- Supabase Migration: an events page students can browse, like, and
-- share -- gated behind having any account (free tier is enough, same
-- rule as the skill-practice pages: only 'rejected' is blocked).
--
-- Paid events (e.g. a meeting with recruiters) show their price and
-- route interested students to the existing support chat to actually
-- register/pay -- deliberately not a full ticketing/payment system,
-- since automated payment collection isn't wired up yet. When it is,
-- this is the natural place to attach it later.

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_path TEXT,                 -- path in the public 'event-images' bucket
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    price NUMERIC(10, 2),            -- MAD, null when free
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT events_price_check CHECK (NOT is_paid OR price IS NOT NULL)
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Any account works here, not just active/paid -- only a rejected
-- application is blocked, same rule as the skill-practice pages.
CREATE POLICY "Non-rejected users can view active events"
    ON public.events FOR SELECT
    USING (
        is_active = TRUE
        AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND membership_status != 'rejected')
    );

CREATE POLICY "Admins can manage events"
    ON public.events FOR ALL
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date DESC);

-- ---------------------------------------------------------------------
-- Likes: one row per (event, user). Counts are public (to any
-- non-rejected user, same rule as events themselves) so the like count
-- shows correctly on every card; a user can only ever insert/delete
-- their own like.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-rejected users can view likes"
    ON public.event_likes FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND membership_status != 'rejected'));

CREATE POLICY "Users can like events themselves"
    ON public.event_likes FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike events themselves"
    ON public.event_likes FOR DELETE
    USING (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Storage: a PUBLIC bucket for event images. Unlike everything else in
-- this project (exam content, classroom PDFs, listening audio), event
-- flyer images aren't sensitive content worth signed-URL gating -- the
-- actual access control that matters here is the app-level "you need
-- an account" gate on the events page itself, not the image file.
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view event images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-images');

CREATE POLICY "Admins can upload event images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'event-images' AND public.is_admin());

CREATE POLICY "Admins can update event images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'event-images' AND public.is_admin());

CREATE POLICY "Admins can delete event images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'event-images' AND public.is_admin());
