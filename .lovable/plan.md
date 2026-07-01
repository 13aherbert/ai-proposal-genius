## Plan: Update sitemap.xml and robots.txt (merged)

### 1. Overwrite `public/sitemap.xml`
Replace with the exact 28 URLs you provided, all with `lastmod=2026-07-01` and the priorities specified. No `changefreq`. Drops ~40 previously-listed URLs (blog posts, resources/*, rfp-template-library/* sub-templates, faq/security/docs/contact/integrations/about/demo/help).

### 2. Update `public/robots.txt` (merged, not literal replace)
Base on your pasted block, but preserve the existing auth-route disallows so those pages stay out of the index:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/
Disallow: /dashboard
Disallow: /projects
Disallow: /upload-rfp
Disallow: /subscription

Sitemap: https://optirfp.ai/sitemap.xml
```

### 3. Accessibility
Both files live in `public/` — Vite/Netlify already serve them at `/sitemap.xml` and `/robots.txt` as raw XML/text (static files take precedence over the SPA rewrite). No config change needed.
