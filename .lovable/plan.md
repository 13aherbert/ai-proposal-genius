

## Plan: Fix Manage Dropdown Navigation 404

### Root Cause
The `ListItem` component in `Navbar.tsx` (line 45-67) renders plain HTML `<a href="...">` tags instead of React Router `<Link to="...">` components. When items inside the Manage (or Create) dropdown are clicked, the browser does a full page reload rather than client-side navigation. This causes 404 errors because the server doesn't know about SPA routes.

This affects all `ListItem` usages: Manage dropdown items (`/projects`, `/knowledge-base`, `/organization`, `/api-docs`) and Create dropdown item (`/projects`).

### Fix — `src/components/navigation/Navbar.tsx`

**Refactor `ListItem` to use React Router `Link`:**
- Change the inner `<a>` element to `<Link>` from `react-router-dom`
- Rename `href` prop to `to` (or accept both)
- Update all `ListItem` usages from `href="/..."` to `to="/..."`
- This is a ~6 location change within the single file

### Files Touched
- **Modified**: `src/components/navigation/Navbar.tsx`

