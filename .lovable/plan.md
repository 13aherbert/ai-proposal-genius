

## Plan: Standalone API Documentation Page for Enterprise Users

### Context
An `ApiDocumentation` component already exists inside the Organization Dashboard's API tab, but it documents placeholder endpoints (`/api/v1/organizations/{org_id}/...`) that don't match the actual `public-api` edge function routes (`/projects`, `/projects/:id`, `/projects/:id/sections`, `/knowledge-base`, `/knowledge-base/:id`). The goal is to create a dedicated, routable documentation page that accurately reflects the real API gateway and is accessible from the dashboard sidebar.

### Changes

**1. Create `src/pages/ApiDocs.tsx`** -- New standalone page
- Wraps a new `ApiDocsContent` component inside a clean layout with back navigation
- Protected route -- redirects non-Enterprise/Pro users with an upgrade prompt
- Uses `useSubscription` to gate access

**2. Create `src/components/api-docs/ApiDocsContent.tsx`** -- Main documentation component
- **Authentication section**: Shows how to use `Authorization: Bearer oak_...` header, where to generate keys (link to Organization > API tab), key format details
- **Base URL section**: Dynamic display of the Supabase edge function URL (`{SUPABASE_URL}/functions/v1/public-api`)
- **Endpoints section**: Documents the 7 actual routes from the edge function:
  - `GET /projects` (list, with pagination params `page`, `per_page`)
  - `POST /projects` (create, with `title` required body field)
  - `GET /projects/:id` (single project)
  - `GET /projects/:id/sections` (proposal sections)
  - `GET /knowledge-base` (list KB entries)
  - `POST /knowledge-base` (create, with `title`+`content` body)
  - `GET /knowledge-base/:id` (single KB entry)
- **Response format section**: Standard `{ data, meta }` wrapper and error `{ error: { code, message } }` format
- **Error codes table**: `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR` with HTTP status codes and descriptions
- **Rate limiting section**: Explains 100 RPM default, `429` response, `Retry-After` header
- **cURL examples**: Copy-to-clipboard for each endpoint
- Reuses existing UI patterns: `Card`, `Badge`, `Tabs`, `Collapsible`, code blocks with copy buttons

**3. Add route to `src/App.tsx`**
- Add `/api-docs` route inside the `DashboardLayout` protected route group

**4. Add sidebar link in `src/layouts/DashboardLayout.tsx`** (or equivalent nav)
- Add "API Documentation" link visible to Enterprise/Pro users, gated by subscription tier

### Files

| File | Action |
|------|--------|
| `src/pages/ApiDocs.tsx` | Create -- route page with subscription gating |
| `src/components/api-docs/ApiDocsContent.tsx` | Create -- full documentation content |
| `src/App.tsx` | Modify -- add `/api-docs` route |
| `src/layouts/DashboardLayout.tsx` | Modify -- add nav link for API Docs |

