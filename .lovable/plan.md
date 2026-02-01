

# User Management Enhancement Plan

## Overview

This plan enhances the User Management page with additional columns (account creation, last activity) and adds valuable administrative tools to improve oversight and management capabilities.

---

## Current State Analysis

### What Exists Today

| Column | Status |
|--------|--------|
| User (Name) | Yes |
| Email | Yes |
| Business | Yes |
| Roles | Yes |
| Subscription | Yes |
| Actions (Roles, Edit, Delete) | Yes |
| **Account Created** | **Missing** |
| **Last Activity** | **Missing** |

### Data Sources Available

- `profiles.created_at` - Account creation timestamp
- `profiles.updated_at` - Last profile update
- `organization_member_activity` - Tracks user activity events
- `projects` / `knowledge_entries` - User engagement metrics

---

## Implementation Plan

### Phase 1: Add Missing Columns

#### 1.1 Update Edge Function (`get-user-roles`)

Modify to include additional profile data:
- `created_at` - Account creation date
- `updated_at` - Last profile update (proxy for activity)

```text
Current response per user:
{
  user_id, role, email, first_name, last_name, business_name
}

Enhanced response:
{
  user_id, role, email, first_name, last_name, business_name,
  created_at,      // NEW: from profiles.created_at
  updated_at       // NEW: from profiles.updated_at (last activity proxy)
}
```

#### 1.2 Update Types

Update `UserProfile` interface in `src/services/admin/types.ts`:
- Change `createdAt` from hardcoded value to actual data
- Add `lastActivityAt` field

#### 1.3 Update User Service

Modify `getAllUsers()` in `src/services/admin/userService.ts`:
- Parse new fields from edge function response
- Map `created_at` → `createdAt`
- Map `updated_at` → `lastActivityAt`

#### 1.4 Update User Table Component

Add two new columns to `UserTable.tsx`:

| Column | Display Format | Notes |
|--------|---------------|-------|
| Created | "Jan 15, 2025" with relative time tooltip | formatDistanceToNow |
| Last Active | "2 days ago" with exact time tooltip | formatDistanceToNow |

---

### Phase 2: Additional Admin Tools (Recommended Additions)

#### 2.1 User Statistics Cards

Add summary cards above the user table showing:
- Total Users count
- Active Users (last 30 days)
- Beta Testers count
- Admins count

#### 2.2 Enhanced Filtering

Add filter dropdowns for:
- Role filter (Admin, Beta Tester, User, All)
- Status filter (Active, Inactive based on last activity)
- Subscription filter (Trial, Starter, Pro, None)

#### 2.3 User Details Modal

Click a user row to see expanded details:
- Full profile information
- Organization memberships
- Project count
- Knowledge entries count
- Activity timeline
- Subscription history

#### 2.4 Bulk Actions

Add capability to:
- Export users to CSV
- Bulk assign roles
- Bulk invite to beta program

#### 2.5 Quick Actions Enhancement

Expand action column with:
- "View Details" button (opens modal)
- "Impersonate" (for debugging, system_admin only)
- "Send Password Reset" link

---

## Technical Implementation Details

### File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/get-user-roles/index.ts` | Modify | Add created_at, updated_at to query |
| `src/services/admin/types.ts` | Modify | Add lastActivityAt to UserProfile |
| `src/services/admin/userService.ts` | Modify | Parse new date fields |
| `src/pages/admin/components/UserTable.tsx` | Modify | Add Created and Last Active columns |
| `src/pages/admin/components/UserStatsCards.tsx` | Create | Summary statistics component |
| `src/pages/admin/components/UserFilters.tsx` | Create | Filter controls component |
| `src/pages/admin/components/UserDetailsModal.tsx` | Create | Detailed user view modal |
| `src/pages/admin/UserManagement.tsx` | Modify | Integrate new components |

### Database Considerations

No schema changes required - all data exists in:
- `profiles` table (created_at, updated_at)
- `organization_member_activity` table (for detailed activity if needed later)

---

## UI/UX Design

### Updated Table Layout

```text
┌─────────────┬─────────────────────────┬────────────┬────────────────┬──────────────┬────────────────┬────────────┐
│    User     │          Email          │  Business  │     Roles      │ Subscription │    Created     │   Active   │    Actions    │
├─────────────┼─────────────────────────┼────────────┼────────────────┼──────────────┼────────────────┼────────────┤
│ John Smith  │ john@example.com        │ Acme Inc   │ [Admin][User]  │ Pro (active) │ Jan 15, 2025   │ 2 days ago │ [Actions ▼]   │
│ Jane Doe    │ jane@example.com        │ -          │ [Beta][User]   │ Trial        │ Feb 1, 2025    │ Today      │ [Actions ▼]   │
└─────────────┴─────────────────────────┴────────────┴────────────────┴──────────────┴────────────────┴────────────┴───────────────┘
```

### Stats Cards Layout

```text
┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  Total Users   │  │  Active (30d)  │  │  Beta Testers  │  │     Admins     │
│      127       │  │       89       │  │       34       │  │        3       │
│                │  │    70% ↑12%    │  │    27%         │  │                │
└────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘
```

---

## Implementation Priority

### Must Have (Phase 1)
1. Account Created column
2. Last Activity column
3. Update edge function for data

### Should Have (Phase 2)
4. User statistics cards
5. Enhanced filtering (role, status)
6. User details modal

### Nice to Have (Phase 3)
7. CSV export
8. Bulk actions
9. Activity timeline view
10. Impersonate feature

---

## Expected Outcome

After implementation:
- Admins can quickly see when users signed up
- Identify inactive users for engagement campaigns
- Filter users by role/status for targeted actions
- Access detailed user information without leaving the page
- Export data for reporting purposes

