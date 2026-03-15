

## Plan: Configure Three Sender Addresses by Email Type

### Overview
Update the email system to use three distinct sender addresses on your verified `updates.optirfp.ai` domain:

| Category | Address | Used For |
|----------|---------|----------|
| Account | `team@updates.optirfp.ai` | Welcome, password reset, password changed |
| Support | `support@updates.optirfp.ai` | Support tickets, confirmations, feedback |
| Marketing | `marketing@updates.optirfp.ai` | Beta invites, beta announcements |

No DNS changes needed — all addresses share the same verified domain.

### Changes Required

**Three files need updating:**

1. **`supabase/functions/send-email/index.ts`** — Add address constants for each category and map `templateType` to the correct sender in the email options logic (instead of always using `DEFAULT_FROM_EMAIL`).

2. **`src/services/email/base-email-service.ts`** — Remove the single `defaultFromEmail` and instead accept/pass a `from` address per call, or keep the default and let each sub-service override it.

3. **`src/services/email/support-emails.ts`** — Set `from` to `OptiRFP Support <support@updates.optirfp.ai>` on all support/feedback payloads.

4. **`src/services/email/account-emails.ts`** — Explicitly set `from` to `OptiRFP <team@updates.optirfp.ai>` (current default, no functional change).

5. **`src/services/EmailService.ts`** (legacy) — Mirror the same from-address logic for support vs account methods.

6. **Redeploy** the `send-email` Edge Function after updating it.

### Sender Mapping in Edge Function

The Edge Function will map template types to senders:

```text
welcome, password_reset, password_changed  →  OptiRFP <team@updates.optirfp.ai>
support, support_response, support_confirmation  →  OptiRFP Support <support@updates.optirfp.ai>
beta_invite, beta_announcement  →  OptiRFP <marketing@updates.optirfp.ai>
```

The `payload.from` field still takes precedence if explicitly set by the caller.

