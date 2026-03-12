

## Plan: Add SEO Metadata to All Pages

### Approach
1. **Create a reusable `useSEO` hook** (`src/hooks/use-seo.ts`) that sets `document.title`, meta description, OG tags, canonical URL, and injects JSON-LD structured data via `useEffect`. This replaces scattered inline `useEffect` blocks.

2. **Update all pages** to use the hook:

| Page | Title | Description |
|------|-------|-------------|
| Index | "OptiRFP — AI RFP Response Software \| Win More Contracts" | "AI-powered RFP response platform. Reduce proposal time by 93%. Free plan with 3 projects." |
| Blog | "RFP Tips & Best Practices \| OptiRFP Blog" | "Expert advice on writing winning RFPs, AI tools, and proposal best practices." |
| BlogPost | `{post.title} \| OptiRFP Blog` | post.excerpt |
| CompareLoopio | keep current | keep current |
| CompareAutoRFP | keep current | keep current |
| Referral | keep current | keep current |
| Documentation | keep current | keep current |
| Dashboard | "Dashboard \| OptiRFP" | generic |
| AccountSettings | "Account Settings \| OptiRFP" | generic |
| Subscription | "OptiRFP Pricing — Free to $449/mo \| Start Free" | "Start free with 3 projects. Upgrade to Basic ($49), Pro ($99), or Enterprise ($449)." |

3. **OG tags** managed by the hook: `og:title`, `og:description`, `og:url`, `og:image`, `og:type`.

4. **Canonical URLs** set dynamically based on `window.location.pathname` using the published domain.

5. **Structured data** (JSON-LD): `WebSite` schema on Index, `BlogPosting` on BlogPost, `FAQPage` on Index (FAQ section).

### Files to Create
- `src/hooks/use-seo.ts` — reusable hook accepting title, description, canonical, OG image, structured data

### Files to Modify
- `src/pages/Index.tsx` — add `useSEO` with home metadata + WebSite structured data
- `src/pages/Blog.tsx` — replace `useEffect` with `useSEO`
- `src/pages/BlogPost.tsx` — replace `useEffect` with `useSEO` + BlogPosting schema
- `src/pages/CompareLoopio.tsx` — replace inline SEO with `useSEO` + add OG/canonical
- `src/pages/CompareAutoRFP.tsx` — same
- `src/pages/Referral.tsx` — same
- `src/pages/Documentation.tsx` — same
- `src/pages/Subscription.tsx` — add `useSEO` with pricing metadata
- `src/pages/Dashboard.tsx` — add `useSEO` (basic title)
- `src/pages/AccountSettings.tsx` — add `useSEO` (basic title)
- `index.html` — add default OG tags as fallbacks

### Technical Notes
- Hook creates/updates meta tags on mount, cleans up on unmount
- Canonical base: `https://ai-proposal-genius.lovable.app`
- OG image: existing `/og-image.png`
- Structured data injected as `<script type="application/ld+json">` in `<head>`

