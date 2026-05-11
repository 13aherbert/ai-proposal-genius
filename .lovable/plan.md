## Restore Admin entry in global Navbar user menu

### Problem
`DashboardHeader` (which hosted the "Admin Dashboard" button via `ActionButtons`) is no longer rendered anywhere — `Dashboard.tsx` was rewritten with a custom greeting layout. Result: admins and system admins have no UI affordance to reach `/admin` and must type the URL.

### Fix
Add an "Admin" item to the avatar dropdown in `src/components/navigation/Navbar.tsx`, visible on every authenticated page (not just Dashboard).

### Changes

**`src/components/navigation/Navbar.tsx`**
- Import `useUserRoles` and the `Shield` icon from `lucide-react`.
- Read `showAdminButton` (`= isAdmin || isSystemAdmin`) from the hook.
- In the user dropdown, after the Organization/API items and before the `DropdownMenuSeparator` on line 172, conditionally render:
  ```tsx
  {showAdminButton && (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/admin" className="w-full cursor-pointer">
          <Shield className="mr-2 h-4 w-4" />
          Admin
        </Link>
      </DropdownMenuItem>
    </>
  )}
  ```

### Out of scope
- Not removing the now-orphaned `DashboardHeader.tsx` / `ActionButtons.tsx` — leave them in place in case they're reused later.
- No changes to role-check logic, `AdminLayout` access guard, or routing.
- No changes to the mobile menu beyond what already exists (the user dropdown is desktop-only `md:inline-flex`; mobile admins can still type `/admin` — happy to add a mobile entry too if you want, just say the word).
