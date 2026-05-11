## SSO Readiness Plan

Four work items to take SSO from "built" to "production-ready." Each can be done independently; recommended order is 1 → 3 → 2 → 4.

---

### 1. Secure OIDC client-secret storage (audit + fix)

**Finding from audit:** `sso-oidc-callback` currently reads `client_secret` directly from `organization_sso_config.configuration.client_secret` (a JSONB column in the DB). That violates our "never store secrets in the database" rule and means any future read of that table leaks IdP credentials.

**What to build:**
- Add a `sso_client_secrets` table keyed by `sso_config_id`, with an encrypted `secret_ciphertext` column. RLS denies all client access.
- Use `pgsodium` (already available in Supabase) or AES-GCM via an `SSO_SECRET_ENCRYPTION_KEY` env var to encrypt at rest.
- New edge function `sso-set-client-secret` (admin-only) that accepts the plaintext secret, encrypts, and stores it. The plaintext never round-trips back to the client.
- Update `sso-oidc-callback` to fetch + decrypt from `sso_client_secrets` instead of reading from `configuration`.
- Update `SSOConfigPanel` OIDC wizard: replace the `client_secret` text input with a "Set/Rotate Client Secret" button that calls the new function. Show "✓ Secret configured (last set: <date>)" instead of the value.
- Migration to strip any existing `client_secret` from `organization_sso_config.configuration`.

---

### 2. Admin-facing SSO runbook

**What to build:** A new doc page at `/docs/sso-setup` (rendered inside `DashboardLayout` for admins, also linkable from `SSOConfigPanel`).

Contents:
- **Overview** — when to choose SAML (Path A) vs OIDC (Path B).
- **Step 1: Verify your domain** — copy TXT record, paste into DNS, click Verify.
- **Step 2a: SAML setup** — IdP metadata URL/XML, ACS URL, Entity ID, attribute mapping (email, first_name, last_name).
- **Step 2b: OIDC setup** — discovery URL, client ID, redirect URI to register at IdP (`https://<project>.functions.supabase.co/functions/v1/sso-oidc-callback`), how to set the client secret.
- **Step 3: Enforcement** — toggling `sso_required` and `sso_auto_redirect`, JIT provisioning behavior, seat-limit interaction.
- **Troubleshooting** — common errors (domain not verified, IdP cert mismatch, redirect URI mismatch, rate-limit hit).
- **Per-IdP quickstarts** — Okta, Azure AD, Google Workspace, Auth0 (screenshots optional, link to vendor docs).

---

### 3. SSO health-check panel (admin diagnostics)

**What to build:** A new "Diagnostics" tab inside `SSOConfigPanel.tsx` backed by a single edge function `sso-health-check` that returns JSON like:

```text
{
  domains: [{ domain, verified, verified_at }],
  providers: [{ id, type, name, has_client_secret, last_used_at }],
  platform: {
    sb_mgmt_token_present: true,
    sso_encryption_key_present: true,
    saml_enabled_in_supabase: true|null   // best-effort via mgmt API
  },
  enforcement: { sso_required, sso_auto_redirect },
  recent_errors: [{ at, endpoint, code, message }]   // last 10 from sso_rate_limits / function logs
}
```

UI shows a checklist with green/red badges and one-line remediation hints linking to the runbook.

---

### 4. End-to-end smoke test of Path B (OIDC)

**What to build (no user-facing changes):**
- Pick a free IdP — recommend **Auth0 dev tenant** (fast signup, OIDC-compliant, free).
- Create a dedicated test org in the database with a verified test domain (e.g., `optirfp-sso-test.example`).
- Register Auth0 app, configure redirect URI, add a test user.
- Wire the org's `organization_sso_config` to point at Auth0's discovery URL + client ID; set client secret via the new function from item 1.
- Walk the full flow: enter test email → redirect to Auth0 → log in → land on `/sso-finish` → session minted → JIT user created and added to org.
- Capture each failure, fix in `sso-oidc-init` / `sso-oidc-callback` / `sso-auth-callback`, repeat until clean.
- Add a Deno test (`sso-oidc-callback/index_test.ts`) that mocks the IdP token endpoint + JWKS and asserts a handoff token is created.
- Document the test setup in the runbook (item 2) so QA can re-run it.

---

### Technical notes (non-PM)

- Encryption choice: prefer `pgsodium.crypto_aead_det_encrypt` (server-side, key in Vault) over app-layer AES so the key never sits in edge function env. Fallback: `SSO_SECRET_ENCRYPTION_KEY` secret + WebCrypto AES-GCM in the edge function.
- `sso-health-check` should be gated by `is_organization_admin` — never expose token presence to non-admins.
- Item 4's test org should be flagged `is_test = true` and excluded from billing/analytics queries.

### Out of scope

- Path A (SAML) end-to-end smoke test — requires Supabase Pro plan; revisit once that's confirmed.
- Branding the Supabase magic-link email used during handoff — separate task.
- Custom SCIM/user-provisioning beyond JIT.
