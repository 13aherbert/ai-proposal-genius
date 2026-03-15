

## Plan: Add Security Headers via Netlify

Add a `[[headers]]` block to `netlify.toml` with all 5 security headers. The CSP directive must include all domains the app actually uses.

### Changes

**`netlify.toml`** — Add a `[[headers]]` section for `/*`:

| Header | Value |
|--------|-------|
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` |
| X-XSS-Protection | `1; mode=block` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Content-Security-Policy | See below |

**CSP directive** (built from actual app usage):
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline' https://cdn.gpteng.co https://www.googletagmanager.com`
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
- `font-src 'self' https://fonts.gstatic.com`
- `img-src 'self' data: https: https://images.pexels.com` (per project knowledge: Pexels in CSP allowlist)
- `connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://ai.gateway.lovable.dev https://api.pexels.com`
- `frame-ancestors 'none'`

### Files Modified (1)
- `netlify.toml`

