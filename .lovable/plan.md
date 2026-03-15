

## Plan: Blog CMS for System Admins

### Overview
Replace the hardcoded `blog-posts.ts` data with a Supabase `blog_posts` table. System admins get a CMS page to create, edit, and publish blog posts. Public readers see only published posts.

### 1. Create `blog_posts` Database Table

```sql
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
  status text NOT NULL DEFAULT 'draft',  -- 'draft' | 'published'
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Public can view published posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

-- System admins can do everything
CREATE POLICY "System admins can manage all posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (is_system_admin())
  WITH CHECK (is_system_admin());
```

### 2. Seed Existing Hardcoded Posts
Migrate the 3 existing posts from `blog-posts.ts` into the new table via an INSERT migration so no content is lost.

### 3. Update Blog Data Layer
- Create `src/hooks/use-blog-posts.ts` — fetches published posts from Supabase (replaces the static import)
- Update `src/pages/Blog.tsx` to use the hook instead of the static `blogPosts` array
- Update `src/pages/BlogPost.tsx` to fetch a single post by slug from Supabase
- Keep `src/data/blog-posts.ts` as a fallback/type reference

### 4. Build Admin Blog CMS Page
- Create `src/pages/admin/BlogManagement.tsx` — a protected page for system admins with:
  - Table listing all posts (drafts + published) with status badges
  - "New Post" button
  - Edit/delete actions per row
- Create `src/components/blog/BlogPostEditor.tsx` — form with:
  - Title, slug (auto-generated from title), excerpt, category dropdown, image URL, content (markdown textarea with preview)
  - Author name/role fields
  - Save as Draft / Publish buttons
  - Input validation (title required, slug unique, content required)

### 5. Add Route and Navigation
- Add `/admin/blog` route in `App.tsx` (protected, system_admin only)
- Add "Blog Management" link in the Admin Dashboard card grid

### 6. Files Changed/Created

| File | Action |
|------|--------|
| Supabase migration (blog_posts table + RLS + seed) | Create |
| `src/hooks/use-blog-posts.ts` | Create |
| `src/pages/admin/BlogManagement.tsx` | Create |
| `src/components/blog/BlogPostEditor.tsx` | Create |
| `src/pages/Blog.tsx` | Update (use hook) |
| `src/pages/BlogPost.tsx` | Update (use hook) |
| `src/pages/AdminDashboard.tsx` | Update (add blog link) |
| `src/App.tsx` | Update (add route) |

