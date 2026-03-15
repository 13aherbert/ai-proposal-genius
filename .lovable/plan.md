

## Plan: Replace All Hardcoded Old Domain References

### Summary
44 references to `ai-proposal-genius.lovable.app` remain across 7 files. All must be replaced with `optirfp.ai`.

### Changes

**Client-side (4 files):**

1. **`src/pages/Index.tsx`** (lines 28, 32) — Structured data URLs
2. **`src/pages/BlogPost.tsx`** (line 36) — Blog post structured data URL
3. **`src/pages/Referral.tsx`** (line 12) — Referral base URL constant
4. **`src/components/account/ReferralCard.tsx`** (line 11) — Referral base URL constant

**Edge functions (3 files):**

5. **`supabase/functions/stripe-webhook/index.ts`** (lines 106, 124) — Email CTA links
6. **`supabase/functions/annual-renewal-reminder/index.ts`** (line 90) — Email CTA link
7. **`supabase/functions/hubspot-oauth-callback/index.ts`** (line 133) — OAuth redirect fallback URL

All instances: simple string replacement of `ai-proposal-genius.lovable.app` → `optirfp.ai`. Edge functions will need redeployment.

### Files Modified (7)
- `src/pages/Index.tsx`
- `src/pages/BlogPost.tsx`
- `src/pages/Referral.tsx`
- `src/components/account/ReferralCard.tsx`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/annual-renewal-reminder/index.ts`
- `supabase/functions/hubspot-oauth-callback/index.ts`

