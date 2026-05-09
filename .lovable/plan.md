## Goal
Stop OptiRFP team-invitation emails (sent via Resend from `updates.optirfp.ai`) from landing in the spam folder.

## Why it's happening
Gmail flagged the test for a few well-known reasons that stack up:
1. **Brand-new sending subdomain** with zero reputation and a single one-off send.
2. **DMARC not enforced** on `optirfp.ai` (Resend verifies SPF + DKIM, but without a DMARC record Gmail/Yahoo's 2024 bulk-sender rules treat the message as suspicious).
3. **No List-Unsubscribe headers** — required by Gmail/Yahoo for any automated mail.
4. **Thin HTML** — the current test body is one short sentence with no plain-text alternative, which scores high on spam filters.
5. **From name / address** uses `noreply@` which trips engagement-based filters.

## Plan

### 1. DNS / domain authentication (highest impact)
- Verify in Resend dashboard that **SPF** and **DKIM** for `updates.optirfp.ai` show ✅ Verified.
- Add a **DMARC** TXT record on the root domain at the user's DNS provider:
  - Host: `_dmarc.optirfp.ai`
  - Value: `v=DMARC1; p=none; rua=mailto:dmarc@optirfp.ai; pct=100; adkim=s; aspf=s`
  - Start at `p=none` for monitoring, move to `quarantine` later.
- Confirm a sensible reverse-DNS / MX exists on `optirfp.ai` (Resend handles return-path).

### 2. Update the invitation email template (`send-team-invite-email`)
- Switch From to a person-style address: `OptiRFP Team <team@updates.optirfp.ai>` (or `invites@…`) instead of `noreply@`.
- Add a `Reply-To` of `support@optirfp.ai` so replies are routable (engagement signal).
- Add required headers in the Resend payload:
  - `List-Unsubscribe: <mailto:unsubscribe@optirfp.ai>, <https://optirfp.ai/unsubscribe?token=…>`
  - `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
- Send both `html` and `text` versions (Resend supports a `text` field). The text version mirrors the HTML.
- Improve the HTML body:
  - Real subject like `{Inviter} invited you to join {Org} on OptiRFP`
  - Balanced text/image ratio, no link shorteners, no all-caps, no excessive punctuation.
  - Clear single CTA button with the accept URL (already present).
  - Plain footer with company name, mailing address, and an unsubscribe line (legal + deliverability).

### 3. Warm up the subdomain
- Send a handful of low-volume real invitations over the next few days rather than a burst.
- Ask the first recipients (yourself, teammates) to mark the email **Not spam** and **Add to contacts** — this is the single biggest short-term lift.

### 4. Verification after changes
- Re-send the test invite and inspect Gmail's "Show original":
  - SPF: PASS, DKIM: PASS, DMARC: PASS
  - `List-Unsubscribe` header present
- Optionally run the message through `mail-tester.com` and aim for 9+/10.

## Technical details (for the agent during build)
- File: `supabase/functions/send-team-invite-email/index.ts`
  - Read `INVITE_FROM_ADDRESS` (already set), default to `OptiRFP Team <team@updates.optirfp.ai>`.
  - Add new env (optional): `INVITE_REPLY_TO` defaulting to `support@optirfp.ai`.
  - Extend the Resend POST body with `reply_to`, `text`, and a `headers` object for List-Unsubscribe.
- File: existing HTML template inside the function — restructure with proper heading, paragraph, CTA button, and footer (mailing address + unsubscribe link).
- No DB changes. No new edge functions.
- DMARC and any DNS records must be added by the user at their domain registrar — the agent cannot do this.

## Out of scope
- Building a real unsubscribe handler page (can be a follow-up). For now the List-Unsubscribe mailto satisfies Gmail's requirement.
- Switching off Resend or adding a second ESP.
