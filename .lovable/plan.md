

## Plan: Add Server-Side User Limit Enforcement for Team Invitations

### Problem
User limit enforcement for team invitations is entirely client-side (`canAddUser` in `MemberInvitation.tsx`). There is no server-side check — a determined user could bypass the UI and insert invitations directly via the Supabase API.

### Solution
Create a Supabase edge function `team-invite` that:
1. Authenticates the caller
2. Looks up their organization and pricing tier
3. Enforces the `users_limit` from `pricing_tiers` (only Starter has a limit of 1; paid tiers have `-1` = unlimited)
4. Creates the invitation record if allowed
5. Returns appropriate error messaging for Starter users hitting the limit, and "unlimited" confirmation for paid tiers

### Changes

**1. New edge function: `supabase/functions/team-invite/index.ts`**
- Authenticate via `supabase.auth.getUser()`
- Accept `{ organizationId, email, role, department?, message? }`
- Query `organization_members` to get org membership + count current team size (members + pending invitations)
- Query user's subscription → join to `pricing_tiers` to get `users_limit`
- If `users_limit !== -1 && teamSize >= users_limit`: return 403 with structured error:
  ```json
  {
    "error": "User limit reached",
    "message": "Free plan allows 1 user. Upgrade for unlimited team members.",
    "upgradeUrl": "/pricing",
    "tier": "Starter",
    "currentUsers": 1,
    "limit": 1
  }
  ```
- Otherwise, insert into `organization_member_invitations` and return success
- For paid tiers (`users_limit === -1`), include in response: `"message": "Team member invited. You can invite unlimited users on your plan."`

**2. Update `src/components/organization/MemberInvitation.tsx`**
- Replace the direct Supabase insert with a call to the `team-invite` edge function
- Keep the client-side `canAddUser` check as a fast UI gate (prevents unnecessary network calls)
- Handle the 403 response by showing the `UpgradeGateModal` with `reason="user_limit"`
- Display the "unlimited users" confirmation message in the success toast for paid tiers

### Files touched
- **New**: `supabase/functions/team-invite/index.ts`
- **Modified**: `src/components/organization/MemberInvitation.tsx`

