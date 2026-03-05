

## Plan: Public API Gateway Edge Function

### Overview
Create a single `public-api` edge function that authenticates requests via organization API keys (`oak_...`) and exposes REST-style endpoints for projects, proposals (sections), and knowledge base entries. Access is scoped to the organization that owns the API key, and further restricted by the key's `permissions` JSONB field.

### Architecture

```text
Client Request
  │  Authorization: Bearer oak_xxxxx
  │  GET /projects
  ▼
┌─────────────────────────────────┐
│  public-api edge function       │
│                                 │
│  1. Extract API key from header │
│  2. Fetch all active keys for   │
│     all orgs (service role)     │
│  3. bcrypt.compare() each hash  │
│     until match found           │
│  4. Check key permissions       │
│  5. Check org subscription tier │
│  6. Route to handler            │
│  7. Update last_used_at         │
│  8. Return JSON response        │
└─────────────────────────────────┘
```

### File: `supabase/functions/public-api/index.ts`

**Authentication flow:**
1. Extract `Authorization: Bearer oak_...` header
2. Validate format (`oak_` prefix, 68 chars)
3. Use service role client to fetch all active, non-expired keys from `organization_api_keys`
4. Iterate and `bcrypt.compare()` the provided key against each hash until a match is found
5. On match: extract `organization_id`, `permissions`, and `id` from the matched row
6. Verify the organization has an active subscription with `plan_type` that grants API access (enterprise/pro)
7. Update `last_used_at` on the matched key row

**Rate limiting:**
- Track request counts per API key in memory (per-isolate) with a sliding window
- Return `429 Too Many Requests` with `Retry-After` header when exceeded (default: 100 req/min)

**Routing** (path-based via URL pathname suffix):

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/projects` | `projects:read` | List org projects |
| GET | `/projects/:id` | `projects:read` | Get single project |
| GET | `/projects/:id/sections` | `proposals:read` | Get proposal sections for project |
| GET | `/knowledge-base` | `knowledge_base:read` | List KB entries |
| GET | `/knowledge-base/:id` | `knowledge_base:read` | Get single KB entry |
| POST | `/projects` | `projects:create` | Create a project |
| POST | `/knowledge-base` | `knowledge_base:create` | Create a KB entry |

**Response format:**
```json
{
  "data": [...],
  "meta": { "total": 25, "page": 1, "per_page": 50 }
}
```

Error responses:
```json
{ "error": { "code": "UNAUTHORIZED", "message": "..." } }
```

**Input validation:** Use Zod-style manual validation for POST bodies (title required, content length limits).

**Data scoping:** All queries filter by `organization_id` from the matched API key. No cross-org data leakage possible.

### Database Migration

Add a `rate_limit_rpm` column to `organization_api_keys` if not already present (to allow per-key rate limit overrides):

```sql
ALTER TABLE public.organization_api_keys
  ADD COLUMN IF NOT EXISTS rate_limit_rpm INTEGER DEFAULT 100;
```

### Config Changes

**`supabase/config.toml`** -- add entry:
```toml
[[functions]]
name = "public-api"
verify_jwt = false
```

`verify_jwt = false` because this function authenticates via API keys, not JWT.

### Security Considerations

- **Service role** used only for key lookup and `last_used_at` update; all data queries scoped by `organization_id`
- **bcrypt comparison** is intentionally slow (~100ms per key); for orgs with many keys this could be slow. Mitigation: limit active keys per org to 10 and fetch only active, non-expired keys
- **No sensitive fields** returned (e.g., `api_key_hash`, `user_id` omitted from project responses)
- **Subscription check** ensures only enterprise/pro orgs can use the API
- **Pagination** enforced (max 100 per page) to prevent data dumping

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/public-api/index.ts` | Create -- the API gateway |
| `supabase/config.toml` | Modify -- add function entry |
| Database migration | Add `rate_limit_rpm` column |

