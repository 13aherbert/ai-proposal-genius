

## Plan: Team Invitation Flow with User Limit Checking

### Overview
Add user limit checking to the existing `MemberInvitation` component and update `UpgradeGateModal` to support a "user_limit" reason with messaging about unlimited team members on paid plans.

### Changes

**1. Update `MemberInvitation.tsx` — Add user limit gate**
- Import `usePricingTier` and `useSubscription` to get `canAddUser`, `getUserLimitDisplay`
- Import `useOrganizationMembers` to get current `members.length` as team size
- Before opening the invite dialog, check `canAddUser(members.length)`
- If limit reached, show `UpgradeGateModal` with `reason="user_limit"` instead
- Update button text: show `Invite (1/1)` on Starter, just `Invite Team Member` on paid tiers
- Add amber warning text below button when on Starter: "Free plan: 1 user only. Upgrade for unlimited team members."

**2. Update `UpgradeGateModal.tsx` — Support user limit reason**
- Add optional `reason` prop: `'project_limit' | 'user_limit'`
- When `reason === 'user_limit'`:
  - Title: "Add Your Team"
  - Description: "Upgrade to invite unlimited team members"
  - Right column highlights: "Unlimited team members" as first feature, show cost breakdown "$199/month for unlimited users"
  - Update feature lists to reflect new tier names (Growth instead of Basic)
- Update feature lists to current pricing: Starter (12 projects, 1 user) vs Growth (36 projects, unlimited users)
- Update CTA: "Upgrade to Growth — $199/month"

**3. Update `TeamManagement.tsx` — Pass team size context**
- Pass `members.length` to `MemberInvitation` so it can check limits without re-fetching

### Files touched
- **Modified**: `src/components/organization/MemberInvitation.tsx`, `src/components/subscription/UpgradeGateModal.tsx`, `src/components/organization/TeamManagement.tsx`

