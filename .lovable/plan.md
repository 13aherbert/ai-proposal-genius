## Admin Notification System — New Users & New Subscribers

Goal: send you an email whenever (a) a new user signs up, and (b) a user converts to a paid subscription. Reuse existing `send-email` edge function and `EmailService` patterns.

### Configuration
- New secret `ADMIN_NOTIFICATION_EMAILS` (comma-separated; defaults to `support@optirfp.ai`) so you can change recipients without code changes.
- New table `admin_notifications_log` to dedupe and provide an audit trail (event_type, subject, payload jsonb, sent_at, status). Useful so a Stripe retry doesn't double-send.

### 1. New User Signup Alert
- Add a DB trigger `on_auth_user_created_notify` (AFTER INSERT on `auth.users`) that calls a SECURITY DEFINER function `notify_admin_new_user()` which uses `pg_net.http_post` to invoke a new edge function `admin-notify` with `{ type: 'new_user', user_id, email, metadata }`.
- Alternative (simpler, no pg_net): extend the existing `handle_new_user` trigger to insert a row into a `pending_admin_notifications` queue; a lightweight cron (every 5 min) drains the queue via `admin-notify`. We'll go with the **pg_net direct-call** approach for immediacy since pg_net is already used elsewhere.

### 2. New Subscriber Alert
- In `supabase/functions/stripe-webhook/index.ts`, on `checkout.session.completed` (subscription mode, paid) and on `customer.subscription.created`, call a shared `notifyAdminNewSubscriber()` helper that posts to `admin-notify` with `{ type: 'new_subscriber', user_id, email, plan, amount, interval, stripe_customer_id }`.
- Dedupe per `stripe_subscription_id` via `admin_notifications_log` unique index so retries don't re-email.

### 3. `admin-notify` Edge Function
- New `supabase/functions/admin-notify/index.ts`:
  - Validates JWT or shared internal secret header (called from DB trigger and from stripe-webhook only).
  - Reads `ADMIN_NOTIFICATION_EMAILS`.
  - Renders a small branded HTML email per event type (welcome-style for new user, "💰 New paid subscriber" for subscriber including plan, MRR delta, dashboard link to `/admin/users`).
  - Sends via existing `send-email` function (`templateType: 'admin_notification'` — new template added to `send-email`) using `team@updates.optirfp.ai` sender.
  - Inserts into `admin_notifications_log`.
- Registered in `supabase/config.toml` with `verify_jwt = false` (called by DB + Stripe webhook).

### 4. Admin UI (light)
- Add a "Notifications" section in `/admin/settings` to:
  - View recipient list and edit it (writes the secret via existing admin secret-management flow, or stored in a new `admin_settings` row if simpler).
  - Toggle each event type on/off.
  - Show last 50 entries from `admin_notifications_log`.

### Technical notes
- Tables/migrations: `admin_notifications_log`, trigger + function on `auth.users`, enable `pg_net` if not already.
- Secrets: `ADMIN_NOTIFICATION_EMAILS`, plus reuse existing `RESEND`/email infra via `send-email`.
- Files to create: `supabase/functions/admin-notify/index.ts`, admin UI page section.
- Files to edit: `supabase/functions/stripe-webhook/index.ts` (add helper + 2 call sites), `supabase/functions/send-email/` (add `admin_notification` template), `supabase/config.toml`.

### Out of scope (can add later)
- Slack/Teams/Discord routing (infra already exists via `WebhookService` — easy follow-up).
- Daily digest mode instead of per-event.
- Cancellation / refund / failed-payment alerts.

Confirm and I'll implement, or tell me to also include cancellations/failed payments and Slack routing in v1.