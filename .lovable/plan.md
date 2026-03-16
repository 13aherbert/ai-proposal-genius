

## Plan: Enhance Admin Dashboard for Enterprise Tier

### Current State

The admin infrastructure **already exists and routes work** (they're behind `ProtectedRoute`, not 404):
- `/admin` — minimal card with links to Users and Blog
- `/admin/users` — full user management with roles, subscriptions, search, delete
- `/admin/blog` — blog management

Additionally, the **Organization Dashboard** (`/organization`) already contains rich components that can be reused:
- `SecurityDashboard` — 377-line security overview with charts, session info
- `AuditLogger` — audit event log with filtering
- `SubscriptionManager` — billing/plan management
- `OrganizationSettings` — org name, slug, settings
- `BillingHistory` — invoice history with retry/error states

### What Needs to Change

1. **Enhance `/admin` (AdminDashboard)** — Replace the current minimal card layout with a proper dashboard: stats cards (Total Users, Active Projects, Storage), recent activity feed, and sidebar navigation to all admin sub-pages.

2. **Create `/admin/projects` page** — New page showing all projects across the organization with archive/delete/transfer actions. Query the `projects` table filtered by organization.

3. **Create `/admin/security` page** — Wrap the existing `SecurityDashboard` and `AuditLogger` components in a standalone admin page.

4. **Create `/admin/billing` page** — Wrap the existing `SubscriptionManager` and `BillingHistory` components in a standalone admin page.

5. **Create `/admin/settings` page** — Wrap the existing `OrganizationSettings` component with a danger zone section (delete org).

6. **Add admin sidebar navigation** — Create an `AdminLayout` component with a sidebar (using existing Sidebar components) that wraps all `/admin/*` routes. Links: Dashboard, Users, Projects, Security, Billing, Settings.

7. **Add admin role gate** — The new `AdminLayout` checks admin status and shows access denied for non-admins, removing the need for each sub-page to check independently.

### Files

| File | Action |
|------|--------|
| `src/layouts/AdminLayout.tsx` | **Create** — layout with sidebar nav + admin role check |
| `src/pages/AdminDashboard.tsx` | **Rewrite** — stats cards, activity feed |
| `src/pages/admin/AdminProjects.tsx` | **Create** — project management table |
| `src/pages/admin/AdminSecurity.tsx` | **Create** — wraps SecurityDashboard + AuditLogger |
| `src/pages/admin/AdminBilling.tsx` | **Create** — wraps SubscriptionManager + BillingHistory |
| `src/pages/admin/AdminSettings.tsx` | **Create** — wraps OrganizationSettings + danger zone |
| `src/App.tsx` | **Modify** — replace admin route group to use AdminLayout, add new routes |

### No Database Changes

All required tables (`projects`, `activity_feed`, `security_audit_log`, `organizations`, `subscriptions`) and RLS policies already exist.

