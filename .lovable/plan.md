
# Beta Program Removal Plan

## Overview

This plan removes the dedicated Beta program infrastructure while preserving and enhancing the universal feedback system that already works for all users. The Beta program has only 2 active testers and most features use mock data, making it a good candidate for removal to reduce complexity.

---

## Current Beta Infrastructure to Remove

### Database Tables
| Table | Records | Action |
|-------|---------|--------|
| `beta_invitations` | 7 pending invitations | Archive and delete |
| `beta_requests` | Unknown count | Archive and delete |

### Database Functions
| Function | Purpose | Action |
|----------|---------|--------|
| `check_beta_tester_role()` | Check beta role | Delete |
| `verify_invitation_code()` | Verify invite codes | Delete |
| `verify_invitation_code_secure()` | Secure verification | Delete |
| `invite_beta_tester()` | Create invitations | Delete |
| `update_beta_invitation_status()` | Update invitation status | Delete |
| `update_beta_invitation_email_sent()` | Email sent flag | Delete |
| `check_pending_invitation()` | Check pending invites | Delete |
| `get_beta_invitation_direct()` | Get invitation details | Delete |
| `get_invitation_for_email()` | Get invitation by email | Delete |
| `log_invitation_verification()` | Security logging | Delete |

### User Role Changes
| Role | Current Users | Action |
|------|---------------|--------|
| `beta_tester` | 2 | Remove role from users, keep users active |

---

## Files to Delete

### Pages (4 files)
- `src/pages/BetaProgram.tsx`
- `src/pages/BetaRoadmap.tsx`
- `src/pages/admin/BetaInvitationsPage.tsx`
- `src/pages/admin/BetaRequests.tsx`

### Components (8 files)
- `src/components/beta/BetaAccessDenied.tsx`
- `src/components/beta/BetaInvitationCard.tsx`
- `src/components/beta/BetaLoadingState.tsx`
- `src/components/beta/BetaMetricsPanel.tsx`
- `src/components/beta/BetaRequestDialog.tsx`
- `src/components/beta/BetaSignupDialog.tsx`
- `src/components/beta/BetaTesterDashboard.tsx`
- `src/components/beta/BetaTesterOnboarding.tsx`
- `src/components/dashboard/BetaProgramCard.tsx`

### Services (5 files)
- `src/services/beta/betaFeedbackService.ts`
- `src/services/beta/betaMetricsService.ts`
- `src/services/beta/betaOnboardingService.ts`
- `src/services/beta/betaTasksService.ts`
- `src/services/BetaTestingService.ts`

### Admin Services
- `src/services/admin/betaService.ts`

### Hooks (1 file)
- `src/hooks/useBetaProgram.ts`

### Mock Data
- `src/services/mocks/betaTestingMockData.ts`

### Scripts
- `src/scripts/add-beta-tester.ts`

### Edge Functions (6 directories)
- `supabase/functions/create-beta-invitation/`
- `supabase/functions/get-beta-invitations/`
- `supabase/functions/get-beta-requests/`
- `supabase/functions/get-pending-invitation/`
- `supabase/functions/resend-beta-invitation/`
- `supabase/functions/verify-beta-invitation/`

---

## Files to Modify

### App.tsx - Remove Beta Routes

Remove these routes:
- `/beta`
- `/beta/dashboard`
- `/beta/roadmap`
- `/beta-invite`
- `/admin/beta-invitations`
- `/admin/beta-requests`

Remove imports for beta pages and components.

### AdminDashboard.tsx - Remove Beta Section

Remove the "Beta Program" card that links to beta invitations and requests.

### User Roles System

**src/hooks/user-roles/index.ts:**
- Remove `isBetaTester` state variable
- Remove `setIsBetaTester` calls
- Remove `showBetaBadge` derived value
- Remove beta role checking in `forceRoleCheck`

**src/hooks/user-roles/types.ts:**
- Remove `isBetaTester` from `UserRoleState`
- Remove `showBetaBadge` from `UserRoleState`
- Remove `betaTesterStatus` from `UserRoleRefs`

**src/hooks/user-roles/role-check-utils.ts:**
- Remove `checkBetaTesterRole` function
- Remove `updateBetaTesterState` function

**src/hooks/user-roles/use-role-check-effect.ts:**
- Remove beta role checking logic
- Remove `setIsBetaTester` parameter

### Admin Services

**src/services/admin/index.ts:**
- Remove all beta-related exports:
  - `getBetaInvitations`
  - `createBetaInvitation`
  - `cancelBetaInvitation`
  - `verifyBetaInvitation`
  - `acceptBetaInvitation`
  - `resendInvitationEmail`
  - `getBetaRequests`
  - `processBetaRequest`
- Remove `isBetaTester` export

**src/services/admin/userService.ts:**
- Remove `isBetaTester` function

**src/services/admin/roleService.ts:**
- Remove `isBetaTester` function

### Email Services

**src/services/email/support-emails.ts:**
- Remove `isBetaFeedback` parameter from `sendFeedbackEmail`
- Remove beta-specific subject prefix logic

**src/services/email/beta-emails.ts:**
- Delete entire file (beta invite emails, announcements)

**src/services/email/index.ts:**
- Remove beta email exports
- Remove `isBetaFeedback` parameter from `sendFeedbackEmail`

**src/services/EmailService.ts:**
- Remove `isBetaFeedback` parameter from `sendFeedbackEmail`

### Feedback System (Keep but Simplify)

**src/components/feedback/UserFeedbackDialog.tsx:**
- Remove `isBetaFeedback` prop
- Simplify dialog title/description to always show "Send Feedback"

**src/components/feedback/FeedbackForm.tsx:**
- Remove `isBetaFeedback` prop
- Remove beta-specific contact permission toggle conditional

**src/hooks/use-feedback-form.tsx:**
- Remove `isBetaFeedback` parameter
- Remove beta-specific messaging and tracking

### Redirects

**src/components/routing/Redirects.tsx:**
- Remove `BetaInviteRedirect` function

**src/components/routing/BetaInviteRedirect.tsx:**
- Delete entire file

### Edge Function Config

**supabase/functions/config.toml:**
- Remove entries for deleted beta edge functions

### Check Subscription Edge Function

**supabase/functions/check-subscription/index.ts:**
- Remove beta tester role check
- Simplify default subscription logic (just use trial)

---

## Database Migration

SQL script to run for cleanup:

```sql
-- Archive existing beta data before deletion
CREATE TABLE IF NOT EXISTS archived_beta_invitations AS 
SELECT *, NOW() as archived_at FROM beta_invitations;

CREATE TABLE IF NOT EXISTS archived_beta_requests AS 
SELECT *, NOW() as archived_at FROM beta_requests;

-- Remove beta_tester role from all users
DELETE FROM user_roles WHERE role = 'beta_tester';

-- Drop beta tables
DROP TABLE IF EXISTS beta_invitations;
DROP TABLE IF EXISTS beta_requests;

-- Drop beta-related functions
DROP FUNCTION IF EXISTS check_beta_tester_role(uuid);
DROP FUNCTION IF EXISTS verify_invitation_code(text);
DROP FUNCTION IF EXISTS verify_invitation_code_secure(text);
DROP FUNCTION IF EXISTS invite_beta_tester(text, uuid);
DROP FUNCTION IF EXISTS update_beta_invitation_status(uuid, text, timestamptz);
DROP FUNCTION IF EXISTS update_beta_invitation_email_sent(uuid, boolean);
DROP FUNCTION IF EXISTS check_pending_invitation(text);
DROP FUNCTION IF EXISTS get_beta_invitation_direct(uuid);
DROP FUNCTION IF EXISTS get_invitation_for_email(text, text);
DROP FUNCTION IF EXISTS log_invitation_verification(text, boolean);
```

---

## Implementation Phases

### Phase 1: Frontend Cleanup
1. Remove all Beta routes from App.tsx
2. Delete Beta page components and their directories
3. Remove Beta section from AdminDashboard

### Phase 2: Hook & Service Cleanup
1. Simplify user roles hook (remove beta tracking)
2. Remove beta services and admin beta functions
3. Simplify feedback system (remove isBetaFeedback)

### Phase 3: Edge Functions
1. Delete beta-related edge functions
2. Update check-subscription to remove beta logic
3. Update config.toml

### Phase 4: Database Cleanup
1. Archive beta data
2. Remove beta_tester roles
3. Drop beta tables and functions

---

## What Gets Preserved

### Universal Feedback System
- `src/components/feedback/UserFeedbackDialog.tsx` - Simplified for all users
- `src/components/feedback/FeedbackForm.tsx` - Bug reports, feature requests, improvements
- `src/hooks/use-feedback-form.tsx` - Form handling logic
- Error tracking integration remains

### User Role System
- Admin role checking
- System admin role checking
- User role checking
- All RLS policies for these roles

### Email System
- Support emails for feedback
- Welcome emails
- Password reset emails
- All non-beta email templates

---

## Summary

| Category | Items Removed | Items Modified |
|----------|---------------|----------------|
| Pages | 4 | 0 |
| Components | 9 | 2 |
| Services | 6 | 5 |
| Hooks | 1 | 4 |
| Edge Functions | 6 | 2 |
| Database Tables | 2 | 0 |
| Database Functions | 10 | 0 |

**Total files deleted:** ~25
**Total files modified:** ~15
**Edge functions deleted:** 6

The universal feedback system remains fully functional for all users, providing bug reporting, feature requests, and general feedback capabilities without the overhead of the Beta program infrastructure.
