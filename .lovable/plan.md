

## Plan: Create robots.txt and sitemap.xml

### Problem
Both `/robots.txt` and `/sitemap.xml` return SPA HTML due to the Netlify catch-all redirect. Need actual static files in the `public/` directory.

### Changes

**1. `public/robots.txt`** (new file)
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://optirfp.ai/sitemap.xml
```

**2. `public/sitemap.xml`** (new file)
Include all public routes found in the app:
- `/` (priority 1.0)
- `/pricing` (0.9)
- `/blog` (0.8)
- `/compare/loopio` (0.8)
- `/compare/autorfp` (0.8)
- `/compare/responsive` (0.8)
- `/compare/proposify` (0.8)
- `/compare/qvidian` (0.8)
- `/compare/pandadoc` (0.8)

All URLs use `https://optirfp.ai` as the base domain.

**3. `netlify.toml`** — No changes needed. Netlify serves files from `public/` before applying the catch-all redirect, so these will be served correctly as static files.

### Files Modified (2)
- `public/robots.txt` (new)
- `public/sitemap.xml` (new)

