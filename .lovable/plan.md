## Goal
Give the `List-Unsubscribe` link in OptiRFP team-invite emails a real destination by adding a public `/unsubscribe` route plus a tiny edge function that records the opt-out, so Gmail/Yahoo's one-click unsubscribe requirement is satisfied end-to-end.

## Scope
- One new public page `/unsubscribe` (no auth required)
- One new edge function `email-unsubscribe` (no JWT, public)
- One new table `email_unsubscribes` to store opt-outs
- Wire `send-team-invite-email` to (a) skip sending if the recipient is unsubscribed and (b) point its `List-Unsubscribe` URL at `https://optirfp.ai/unsubscribe?email=…&token=…`

Out of scope: a full preference center, per-category opt-outs, resubscribe UI, or changes to other email flows beyond the suppression check.

## Plan

### 1. Database
New table `public.email_unsubscribes`:
- `email text primary key` (lowercased)
- `token text not null unique` (random, used to validate one-click POSTs)
- `unsubscribed_at timestamptz default now()`
- `source text` (e.g. `team-invite`, `manual`)
- `user_agent text`, `ip text` (best-effort metadata)

RLS: enabled, no public select/insert/update/delete policies. Only the edge function (service role) reads/writes. A `has_unsubscribed(_email text)` SECURITY DEFINER function returns boolean for use from other edge functions.

### 2. Edge function `email-unsubscribe` (public, `verify_jwt = false`)
Two methods:
- `GET /email-unsubscribe?email=…&token=…` → validates the token, upserts a row with `source='team-invite'`, returns `{ success: true, email }`. Used as the link target's API call.
- `POST /email-unsubscribe` with `{ email, token }` JSON or `email=…&token=…` form body → same behavior. This is what Gmail's "one-click" client hits via `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.

Token strategy: HMAC of the email using a new `UNSUBSCRIBE_SECRET` env var so we don't need to pre-issue tokens — anyone with a valid signed link can opt that address out, but random URLs can't. Idempotent: calling twice is a no-op.

### 3. Public page `src/pages/Unsubscribe.tsx`
- Reads `email` and `token` from query string
- On mount, calls the edge function (GET) and shows one of three states: success ("You've been unsubscribed from OptiRFP team invitations"), already-unsubscribed (same UI), or error (invalid/expired link with a `mailto:support@optirfp.ai` fallback)
- Branded with the existing public layout styling, dark-mode aware
- No auth required

Routing: add `<Route path="/unsubscribe" element={<Unsubscribe />} />` in `src/App.tsx` outside `ProtectedRoute` and outside `PublicLayout` (standalone, like `/reset-password` and `/accept-invitation`).

### 4. Update `send-team-invite-email`
- Compute `token = HMAC(UNSUBSCRIBE_SECRET, recipientEmail)`
- Build `unsubscribeUrl = https://optirfp.ai/unsubscribe?email=…&token=…`
- Replace the current header value with:
  - `List-Unsubscribe: <https://…/email-unsubscribe?email=…&token=…>, <mailto:unsubscribe@optirfp.ai?subject=Unsubscribe>`
  - Keep `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
- Replace the footer "Unsubscribe" link in the HTML/text with the same `unsubscribeUrl`
- Before sending, call `has_unsubscribed(recipientEmail)`; if true, short-circuit with `{ success: false, suppressed: true }` and log it

### 5. Secret
Add `UNSUBSCRIBE_SECRET` (random 32-byte string) via the secrets tool. Used by both edge functions.

### 6. Verification
- Send a test invite to a Gmail address, click the footer Unsubscribe link → page shows success, row appears in `email_unsubscribes`.
- Re-send the invite → function returns `suppressed: true`, no Resend call made.
- In Gmail "Show original", confirm the `List-Unsubscribe` header now contains an HTTPS URL and `List-Unsubscribe-Post: One-Click`.

## Technical notes (for build phase)
- Files touched:
  - new: `supabase/functions/email-unsubscribe/index.ts`
  - new: `src/pages/Unsubscribe.tsx`
  - edit: `src/App.tsx` (one route)
  - edit: `supabase/functions/send-team-invite-email/index.ts` (token + headers + suppression check)
  - new migration: `email_unsubscribes` table + `has_unsubscribed` function + RLS
- No changes to other email flows in this pass; suppression check is opt-in per function.
