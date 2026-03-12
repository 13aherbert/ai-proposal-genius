

## Plan: Blog Section with List and Post Pages

### What to Build
A public blog section with a list page (`/blog`) and individual post pages (`/blog/:slug`), seeded with 3 articles. Public routes (no auth required), similar to `/docs`.

### Files to Create

**1. `src/data/blog-posts.ts`** — Seed data
- 3 articles with: slug, title, excerpt, category, author, date, image (placeholder), full markdown content
- Categories: "RFP Tips", "AI", "Sales"
- Export `blogPosts` array and a `getBlogPost(slug)` helper

**2. `src/pages/Blog.tsx`** — List page
- Hero section: "RFP Insights & Best Practices" heading
- Filter tabs: All | RFP Tips | AI | Sales
- Search bar filtering by title/excerpt
- 3-column grid (desktop), 1-column (mobile) of cards with image, category badge, title, excerpt, author, date
- Email capture section at bottom: "Subscribe for weekly tips" with input + button (toast on submit, no backend)
- Sets `document.title` for SEO

**3. `src/pages/BlogPost.tsx`** — Individual post
- Back button + breadcrumbs (Home > Blog > Post Title)
- Full-width hero image, title, meta (author, date, category)
- Content rendered via `react-markdown` + `remark-gfm` in a `max-w-[720px]` container with `text-lg leading-[1.8]`
- Share buttons (copy link, open Twitter/LinkedIn — using `window.open`)
- Author bio card
- Related articles grid (3 cards, same category or random)
- Sets `document.title` + meta description for SEO

### Files to Modify

**4. `src/App.tsx`** — Add routes
- Add `/blog` and `/blog/:slug` as public routes (outside `ProtectedRoute`, next to `/docs`)

**5. `src/components/navigation/Footer.tsx`** — Add Blog link
- Add `<Link to="/blog">Blog</Link>` to the footer links

### Technical Notes
- Uses existing `react-markdown` and `remark-gfm` (already installed)
- Uses existing UI components: `Badge`, `Button`, `Input`, `Tabs`, `Breadcrumb`, `Card`
- No database needed — static seed data in TypeScript
- OG meta tags set via `document.title` and dynamic meta tag insertion in `useEffect`

