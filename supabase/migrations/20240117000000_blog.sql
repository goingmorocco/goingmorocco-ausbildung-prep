-- Supabase Migration: a public blog, for SEO and written lessons.
--
-- This is a genuine first for this project: every other table so far
-- required at least a free account to read. Published posts and their
-- categories/comments are readable by literally anyone, including
-- fully anonymous visitors -- that's the whole point for SEO. Only
-- liking and commenting require an account (auth.uid() = user_id),
-- which keeps spam down without blocking search engines or first-time
-- visitors from reading.

CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
    ON public.blog_categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage categories"
    ON public.blog_categories FOR ALL
    USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,              -- rich HTML from the editor
    cover_image_path TEXT,              -- path in the public 'blog-images' bucket
    category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Deliberately no auth.uid() check at all -- anonymous visitors and
-- search engine crawlers alike can read published posts.
CREATE POLICY "Anyone can view published posts"
    ON public.blog_posts FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "Admins can manage all posts"
    ON public.blog_posts FOR ALL
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category_id);

CREATE TABLE IF NOT EXISTS public.blog_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view like counts"
    ON public.blog_likes FOR SELECT
    USING (true);

CREATE POLICY "Logged-in users can like posts themselves"
    ON public.blog_likes FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Logged-in users can unlike posts themselves"
    ON public.blog_likes FOR DELETE
    USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.blog_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Comments post immediately (no pre-approval queue -- that would kill
-- normal comment engagement); admin moderates after the fact by hiding
-- or deleting, visible via the "is_hidden = false" condition below plus
-- a separate admin-only policy that can see everything including
-- hidden comments for review.
CREATE POLICY "Anyone can view visible comments"
    ON public.blog_comments FOR SELECT
    USING (is_hidden = FALSE);

CREATE POLICY "Admins can view all comments including hidden"
    ON public.blog_comments FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Logged-in users can comment themselves"
    ON public.blog_comments FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can moderate comments"
    ON public.blog_comments FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete comments"
    ON public.blog_comments FOR DELETE
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON public.blog_comments(post_id, created_at);

-- ---------------------------------------------------------------------
-- Storage: a public bucket for cover images and in-editor uploaded
-- images, same reasoning as event-images -- this content isn't
-- sensitive, and the blog is public anyway.
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view blog images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can upload blog images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'blog-images' AND public.is_admin());

CREATE POLICY "Admins can update blog images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'blog-images' AND public.is_admin());

CREATE POLICY "Admins can delete blog images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'blog-images' AND public.is_admin());
