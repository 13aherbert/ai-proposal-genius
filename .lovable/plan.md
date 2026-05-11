## Bulk user management for Admins

Add filtering, multi-select, and bulk actions to `/admin/users`.

### Scope

**Filtering** (in addition to existing free-text search)
- Role: All / System Admin / Admin / User
- Plan: All / Starter / Growth / Business / Enterprise / No subscription
- Status: All / Active / Inactive / Cancelled
- "Clear filters" button when any filter is active
- Filters compose with the existing search input; result count shown ("Showing X of Y")

**Multi-select**
- New leading checkbox column in `UserTable`.
- Header checkbox: select-all / none for the currently filtered view (indeterminate when partial).
- Row checkbox highlights the row.
- Selection state lives in `UserTable` (local `Set<string>`); cleared after a successful bulk action or when filters change.

**Bulk action toolbar** (sticky bar above the table, visible only when selection > 0)
- "N selected" + "Clear"
- **Assign role** → role select (system_admin / admin / user) → confirm
- **Remove role** → role select → confirm
- **Update subscription** → plan select (starter/growth/business/enterprise) + status select (active/inactive/cancelled) → confirm
- **Delete users** → AlertDialog confirm, lists count and warns it's irreversible
- Each action runs sequentially via existing single-user service methods (`adminService.assignRole`, `removeRole`, `updateSubscriptionPlan`, `deleteUserAccount`) with `Promise.allSettled`. Toast summarizes successes/failures, then `loadUsers()` refreshes.

**Tier consistency cleanup** (small, in scope because this view is being touched)
- Replace the legacy `trial / starter / pro` plan options in the inline single-row subscription editor with the canonical `starter / growth / business / enterprise`. Matches the standardization done in earlier turns and the Pricing Model memory.

### Files

- `src/pages/admin/components/UserTable.tsx` — add checkbox column, selection state, bulk toolbar, bulk action handlers; fix plan options.
- `src/pages/admin/components/UserList.tsx` — add filter controls (3 selects + clear button + result count) above the table; pass filtered users to `UserTable`.
- `src/pages/admin/components/UserFilters.tsx` *(new, small)* — extracted filter row to keep `UserList` readable.
- No service or DB changes; reuses existing `adminService` methods and existing RLS-protected operations.

### Out of scope

- Server-side pagination / virtualization (current list loads all users client-side; fine at current scale).
- Bulk CSV export, bulk invitation, bulk org assignment.
- New backend endpoints — bulk runs N parallel calls client-side, which is acceptable for admin-only tooling.
