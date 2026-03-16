

## Plan: Enhance API Key Management for Enterprise Tier

### Current State Assessment

The project already has extensive API infrastructure in place:

- **`organization_api_keys` table** — exists with all needed columns (id, organization_id, key_name, api_key_hash, permissions, is_active, expires_at, last_used_at, rate_limit_rpm, created_by)
- **`public-api` Edge Function** — fully functional REST gateway with bcrypt auth, rate limiting, permission checks, and CRUD for projects/knowledge base
- **`hash-api-key` Edge Function** — bcrypt hashing for secure key storage
- **`ApiManagement.tsx`** — Organization Dashboard component with key CRUD, usage stats, permissions, expiration, toggle/delete. Already functional.
- **`ApiKeyManagement.tsx`** — Simpler version used in White Label Dashboard
- **`ApiDocsContent.tsx`** — Complete 534-line API documentation page with endpoints, code examples, error codes, rate limiting docs
- **`ApiDocs.tsx`** — Feature-gated page at `/api-docs`

### What's Actually Missing

Most of what was requested **already exists**. The gaps are minor:

1. **`ApiManagement.tsx` generates keys with `sk_` prefix** instead of the `oak_` prefix expected by the `public-api` edge function — keys created here won't work
2. **`ApiManagement.tsx` copies the hash to clipboard** instead of the raw key — the eye/copy buttons operate on `api_key_hash` which is the bcrypt hash, not the actual key. Users can never use keys created here.
3. **No "show key once" dialog** in `ApiManagement.tsx` — unlike `ApiKeyManagement.tsx` which properly shows the key once, `ApiManagement` just auto-copies and never displays it
4. **API docs in `ApiManagement.tsx` show placeholder URLs** (`https://api.yourapp.com/v1/`) instead of the real Supabase function URL
5. **No link from Account Settings to API management** — the request asks for `/account/api` but API management only lives in the Organization Dashboard

### Changes

**1. Fix `ApiManagement.tsx` key generation** — Change prefix from `sk_` to `oak_` (68 chars total). Add a "created key" dialog that shows the raw key once with copy button and warning, matching the pattern in `ApiKeyManagement.tsx`. Remove the eye/copy buttons that operate on the hash (hashes are not usable keys).

**2. Fix `ApiManagement.tsx` API docs section** — Replace the placeholder base URL with the real Supabase edge function URL and link to the full `/api-docs` page.

**3. Add API Access link in Account Settings** — Add a card in `AccountSettings.tsx` (for enterprise/business users) that links to the Organization Dashboard's API tab, keeping API management centralized rather than duplicating it.

### Files Modified

| File | Change |
|------|--------|
| `src/components/organization/ApiManagement.tsx` | Fix `sk_` → `oak_` prefix, add "show key once" dialog, remove hash display/copy, fix placeholder URL |
| `src/pages/AccountSettings.tsx` | Add API Access card linking to `/organization` API tab |

### No Database Changes Needed

The schema already has everything required.

