## Goal
Make it effortless for any signed-in user to submit feedback/ideas and open a support ticket, and make public visitor support submissions reliable (no broken `mailto:` flow). Today the infrastructure mostly exists but is hidden.

## Findings (current state)

- `UserFeedbackDialog` (bug / feature / improvement / general) exists and works — but it is only mounted inside `MonitoringDashboard` (admin-only). **Regular users cannot reach it.**
- The authenticated `Navbar` has no Help / Support / Feedback entry point. The `HelpCenter` route exists but is not linked.
- Public `Contact` form uses `window.open("mailto:…")` — fragile, no record kept, fails if the user has no native mail client.
- Feedback / support submissions are emailed only (via `send-email` edge function). Nothing is persisted, so admins can't triage in-app.
- The "We may contact you" toggle is opt-in for the user's own confirmation email — confusing; users expect a confirmation by default.

## Plan

### 1. Always-available entry point in the app
- Add a **floating Help & Feedback button** (bottom-right, semi-transparent, brand-aware) inside `DashboardLayout` for all authenticated users.
- Clicking opens a small popover with three actions:
  - **Send feedback / idea** → opens `UserFeedbackDialog` (type preselected = `general`, switchable).
  - **Report a bug** → same dialog with type = `bug` and severity prefilled.
  - **Contact support** → same dialog with type = `support` (new type), routed to support inbox.
- Add a "Help & Feedback" item in the Navbar user dropdown as a secondary entry point for discoverability.
- Add keyboard shortcut `?` (or `Shift+/`) to open the popover.

### 2. Promote the Help Center
- Link `/help-center` from the authenticated Navbar (under a new "Help" menu) and from the floating popover ("Browse help articles").
- On the Help Center page, add a prominent "Still need help? Contact support" CTA that opens the same dialog.

### 3. Improve the feedback dialog UX
- Add `support` as a fourth `FeedbackType`; route those to the support inbox with a `TICKET-` id and required email.
- Pre-fill name/email from the signed-in user's profile (read-only when known) so users only have to write the message.
- Make confirmation email **default ON** (still toggleable) so users always know their request was received when an email is on file.
- Add lightweight zod validation (min 10 chars, max 4000) and inline error messages.
- Show the assigned ticket id in the success toast.

### 4. Persist submissions (so admins can triage)
- New table `support_tickets` to store every submission (type, severity, message, user_id, email, ticket_id, status: `open`/`in_progress`/`resolved`, org_id, created_at).
- RLS: users can `SELECT`/`INSERT` their own rows; `system_admin` / `admin` can read all and update status.
- Update `useFeedbackForm` to insert a row first, then trigger the existing email (email becomes a notification, not the source of truth).
- Add a minimal admin view at `/admin/support` listing tickets with filter by status/type and a "Mark resolved" action. Reuse existing `AdminLayout`.

### 5. Fix the public Contact form
- Replace the `mailto:` submission with a call to a new public edge function `submit-contact-message` (no auth required, basic rate limit + honeypot + zod validation).
- Function inserts into `support_tickets` (type = `contact`, user_id null) and sends the existing support email.
- Show a real success state in-page; keep the email address visible as a fallback.

### 6. Small polish
- Move the existing "Send Feedback" button out of `MonitoringDashboard` (or keep it there too) so admins still have it, but it's no longer the only path.
- Add the floating button to `PublicLayout` as well, but only the "Contact support" action (uses the same edge function).

## Technical details

- Files to add: `src/components/feedback/HelpFeedbackLauncher.tsx`, `supabase/functions/submit-contact-message/index.ts`, `src/pages/admin/AdminSupport.tsx`.
- Files to edit: `src/layouts/DashboardLayout.tsx`, `src/layouts/PublicLayout.tsx`, `src/components/navigation/Navbar.tsx`, `src/components/feedback/UserFeedbackDialog.tsx`, `src/components/feedback/FeedbackForm.tsx`, `src/components/feedback/types.ts`, `src/hooks/use-feedback-form.tsx`, `src/pages/Contact.tsx`, `src/pages/HelpCenter.tsx`, `src/App.tsx` (register `/admin/support`).
- New table `support_tickets` with RLS (user-owned select/insert; admin select/update); validation trigger ensures `message` length ≥ 10.
- Reuse `emailService.sendFeedbackEmail` / `sendSupportEmail`; pass new `ticketId` from the inserted row.
- Keyboard shortcut handled via existing `useKeyboardShortcuts` hook.
- No changes to billing, AI, or proposal subsystems.

## Out of scope
- Two-way ticket replies inside the app (admins still respond by email for now).
- Knowledge-base search inside the launcher (future iteration).
- Slack/Teams routing of new tickets (already covered by existing webhook system if enabled).