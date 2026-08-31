-- Supabase Migration: lets a notification optionally carry a link,
-- so clicking it can navigate somewhere (an event, a specific page)
-- instead of only ever showing text. Nullable -- text-only notifications
-- stay exactly as they were.

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS link_url TEXT;
