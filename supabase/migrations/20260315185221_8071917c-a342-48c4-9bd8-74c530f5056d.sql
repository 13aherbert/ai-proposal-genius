
-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  category text NOT NULL DEFAULT 'RFP Tips',
  content text NOT NULL DEFAULT '',
  image_url text,
  author_name text NOT NULL,
  author_role text,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read published posts
CREATE POLICY "Public can view published posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

-- System admins can read all posts (including drafts)
CREATE POLICY "System admins can read all posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (public.is_system_admin());

-- System admins can insert posts
CREATE POLICY "System admins can insert posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_system_admin());

-- System admins can update posts
CREATE POLICY "System admins can update posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (public.is_system_admin())
  WITH CHECK (public.is_system_admin());

-- System admins can delete posts
CREATE POLICY "System admins can delete posts"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (public.is_system_admin());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_posts_updated_at();
