

## Plan: Team Management Routes and Standalone Team Page

### Current State

The team management system **already exists** and is fully functional inside the Organization Dashboard (`/organization`):
- `TeamManagement.tsx` — 235-line component with member list, role updates, remove member
- `MemberInvitation.tsx` — invite flow with role selection, department, email
- `PermissionEditor.tsx` — granular permission editing
- `team-invite` edge function — server-side invite with tier limit enforcement
- `useOrganizationMembers` hook — CRUD for members
- `OrganizationSettings` component — org name, settings

The `/organization` route exists in `App.tsx` (line 84) and renders `OrganizationDashboard`. If it's showing 404, the user likely isn't authenticated (it's behind `ProtectedRoute`).

### What's Actually Missing

1. **No `/team` route** — needs to be added
2. **No `/team/invite` route** — needs a direct invite page
3. **No standalone team page** — currently team management is buried inside the Organization Dashboard's "Team" tab

### Changes

#### 1. Create `/team` page — `src/pages/Team.tsx`
A standalone page that renders the existing `TeamManagement` component directly (not inside the org dashboard tabs). Adds a header showing "Team Management — [Company Name]" with stats cards (total members, active members) above the member table.

#### 2. Create `/team/invite` page — `src/pages/TeamInvite.tsx`
A standalone page that renders the existing `MemberInvitation` component with a back link to `/team`.

#### 3. Add routes to `App.tsx`
Add `/team` and `/team/invite` inside the authenticated route group, pointing to the new pages.

#### 4. No database or edge function changes needed
All backend infrastructure (members table, team-invite function, RLS, permissions) is already in place and working.

### Files

| File | Action |
|------|--------|
| `src/pages/Team.tsx` | Create — standalone team dashboard |
| `src/pages/TeamInvite.tsx` | Create — standalone invite page |
| `src/App.tsx` | Add `/team` and `/team/invite` routes |

