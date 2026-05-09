## What's broken today

The team invitation flow only writes a row to `organization_member_invitations` — no email is ever sent, and there is no page to accept an invitation.

- `supabase/functions/team-invite/index.ts` creates the invitation token, validates limits, and inserts the row, then returns "Invitation sent to {email}". It never calls any email API.
- A repo-wide search for `invitation_token` outside `types.ts` returns nothing — no `/accept-invitation` route, no edge function to consume the token.
- The success toast in `MemberInvitation.tsx` is therefore misleading.

A workspace Resend connection (`TLC Resend`) is available but **not yet linked to this project**. Once linked, we can send through it via the Lovable connector gateway with no manual API key handling.

## Plan

### Step 1 — Link the Resend connector to this project

Use the existing `TLC Resend` workspace connection (`std_01kqz7my51fcc93vgxe5r7q9f1`). Linking exposes `RESEND_API_KEY` and `LOVABLE_API_KEY` to edge functions automatically, and the gateway handles auth refresh.

### Step 2 — Decide the From address

Resend requires the `from` address to be on a verified Resend domain. Two options:

1. Use `onboarding@resend.dev` (Resend's shared sandbox sender) to ship now and test deliverability today. Good for verification and dev, but lower trust in inboxes long-term.
2. Verify the project's own domain (e.g., `optirfp.ai`) inside the Resend dashboard, then send from `noreply@optirfp.ai`. Best for production.

The plan ships with option 1 wired in by default; switching to a verified domain is a one-line change in the edge function once the user verifies it in Resend.

### Step 3 — Add a `send-team-invite-email` edge function

New file `supabase/functions/send-team-invite-email/index.ts`:

- Validates the caller's JWT (matches the rest of the project's edge-function pattern).
- Accepts `{ recipientEmail, inviterName, organizationName, role, personalMessage, acceptUrl, expiresAt }`.
- POSTs to `https://connector-gateway.lovable.dev/resend/emails` with:
  - `Authorization: Bearer ${LOVABLE_API_KEY}`
  - `X-Connection-Api-Key: ${RESEND_API_KEY}`
  - Body: `from`, `to: [recipientEmail]`, `subject`, `html`, `reply_to: inviterEmail`.
- Branded HTML template inlined in the function (HSL brand tokens converted to hex, white body background, "Accept invitation" CTA, expiry note, optional personal message). React Email is not required for a single inline template.
- Returns `{ success: true, messageId }` on Resend success or `{ success: false, error }` otherwise — never throws so `team-invite` can react.

### Step 4 — Wire `team-invite` to send the email

After successfully inserting the invitation row in `team-invite/index.ts`:

- Look up the inviter's display name (from `profiles`) and the organization name (from `organizations`) using the same service-role client.
- Build `acceptUrl = ${SITE_URL}/accept-invitation?token=${invitation.invitation_token}` where `SITE_URL` is read from a new edge-function env (defaults to `https://optirfp.ai`).
- Invoke `send-team-invite-email` (service-role client) with the data above.
- Return `{ success, invitation, message, email_status: 'sent' | 'failed' }`. The invitation row stays valid even if email fails — admin can copy the link manually.
- Redeploy `team-invite` and `send-team-invite-email`.

### Step 5 — Build the `/accept-invitation` flow

- New page `src/pages/AcceptInvitation.tsx` registered under `PublicLayout` in `src/App.tsx` (recipient may be signed out).
- The page reads `?token=` from the URL:
  1. If unauthenticated → redirect to `/auth?redirect=/accept-invitation?token=...`.
  2. Once authenticated → call new `accept-invitation` edge function.
- New `supabase/functions/accept-invitation/index.ts`:
  - Validates JWT, fetches invitation by token, checks `status='pending'`, `expires_at > now()`, and `lower(email) = lower(user.email)`.
  - Inserts an `organization_members` row with the invitation's `role`, `department`, `status='active'`.
  - Updates the invitation to `status='accepted'`, `accepted_at=now()`.
  - Optionally sets the user's `profiles.current_organization_id` so they land in the new org.
  - Returns `{ organizationId, organizationName }`.
- Page UI states: loading, success (auto-redirect to `/dashboard` after 1.5s), expired, wrong email, already accepted, generic error.

### Step 6 — UI polish

In `src/components/organization/MemberInvitation.tsx`:

- Use `email_status` from the response: success toast on `sent`, warning toast with "Copy invite link" on `failed`.
- Add a "Copy invite link" button on the pending-invitations list (where invitations are displayed in the org members view) so admins always have a manual fallback.

### Step 7 — Verify

- Send an invite to a real inbox; confirm:
  - Row appears in `organization_member_invitations` with `status='pending'`.
  - Edge function logs show `Resend 200` with a message id.
  - The branded email arrives with a working accept link.
  - Clicking the link signs the user in (if needed), inserts an `organization_members` row, and lands them on the dashboard.
- Re-invite the same email → API returns 409 (already covered).
- Manually expire an invitation → accept page shows "expired".

## Files to touch

- **Connector**: link `TLC Resend` to this project (one-time tool action).
- `supabase/functions/send-team-invite-email/index.ts` — new, calls Resend via gateway.
- `supabase/functions/team-invite/index.ts` — invoke the sender after insert; return `email_status`.
- `supabase/functions/accept-invitation/index.ts` — new, validates token + creates membership.
- `src/pages/AcceptInvitation.tsx` — new page.
- `src/App.tsx` — add `/accept-invitation` route under `PublicLayout`.
- `src/components/organization/MemberInvitation.tsx` — toast based on `email_status`.
- (Optional) pending-invites list — add "Copy invite link" action.

## Out of scope

- Reminder emails for unaccepted invitations.
- Bulk CSV invitations.
- Unsubscribe handling (transactional invites are 1:1 and triggered by an admin action, but if you want a Resend-side audience/suppression workflow we can add it later).
- Verifying `optirfp.ai` in Resend (you can do this in the Resend dashboard at any point; the function will pick up the new From address with a one-line change).