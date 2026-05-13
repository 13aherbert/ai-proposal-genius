## Seed lifetime deal code `LTD26`

Insert one row into `public.lifetime_deal_codes` via the insert tool:

| Field | Value |
|---|---|
| code | `LTD26` |
| stripe_price_id | `price_1TVIwDCcQ0GhLgJoncasG3F2` (from earlier setup) |
| plan_slug | `growth` (default) |
| max_redemptions | `100` |
| expires_at | `NULL` (no expiry) |
| is_active | `true` |

After insert, verify it appears at `/admin/lifetime`.

### Confirm before I run
- Plan to grant: **Growth** — correct, or should it be Business/Enterprise?
- Expiry: **none** — or should I set a date (e.g., end of 2026)?
- Stripe price ID: reuse `price_1TVIwDCcQ0GhLgJoncasG3F2` — confirm.
