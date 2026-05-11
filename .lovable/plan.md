# SSO Implementation Plan

Today's `sso-auth-callback` accepts an email in the request body and issues a magic link with no IdP signature verification — anyone could impersonate any user in an SSO-enabled org. We will replace that flow with a real, verifiable SSO pipeline. The plan ships **both** paths so the recommended path (A) is the default and (B) is available for orgs that need OIDC or can't use Supabase native SSO.

---

## Shared foundation (built once, used by both paths)

### 1. Domain verification
- Add `verification_token` (random) and `verified_at` to `organization_domains` (token column likely already exists per `get_organization_domain_verification_token`).
- New edge function `verify-organization-domain`:
  - Owner/admin only.
  - Looks up the domain's TXT record (`_optirfp-verification.<domain>` = `optirfp-verify=<token>`) via DNS-over-HTTPS (Cloudflare/Google).
  - On match, sets `is_verified = true`, `verified_at = now()`.
- UI in `SSOConfigPanel`: "Add domain → copy TXT record → Verify" with status badge.
- `check-sso-domain` already gates on `is_verified = true`; no change needed there.

### 2. Login-time enforcement
- New helper `lookupSSOForEmail(email)` (calls `check-sso-domain`) used by `AuthForm`.
- On email blur / submit:
  - If `sso_required` → hide password field, show "Continue with SSO" only.
  - If `sso_auto_redirect` → redirect immediately to IdP.
  - If `sso_allow_password_fallback = false` and user has no password set → block password path.
- Server-side: add a `before_sign_in` check (DB trigger on `auth.audit_log_entries` is not viable; instead use a Postgres function called from a custom RPC `assert_sso_policy(email)` invoked by the client before `signInWithPassword`, and re-check inside any privileged edge function).

### 3. JIT provisioning hardening
Replace current `sso-auth-callback` body. The new callback only runs **after** an assertion is verified by Path A or Path B and:
- Enforces `check_organization_seat_limit(org_id)` before creating a member.
- Sets `profiles.current_organization_id` on first login.
- Default role `viewer`, configurable via `organization_sso_config.configuration.default_role`.
- Optional group→role mapping from IdP claims (`configuration.role_mapping`).
- Logs `sso_login_success` / `sso_user_provisioned` (already wired).

### 4. Rate limiting & audit
- Per-IP + per-email rate limit on `check-sso-domain` and the new callback (reuse `admin_rate_limits` pattern or in-memory token bucket).
- All successes/failures → `security_audit_log` and `security_events_log` with `risk_level`.

---

## Path A — Supabase Native SSO (recommended, SAML 2.0)

Best for: enterprise customers using Okta, Azure AD, OneLogin, Google Workspace, Ping. Supabase handles SAML response validation, certificate rotation, and session issuance.

### Prerequisites
- Supabase project on **Pro plan or higher** (native SSO is a paid feature).
- Enable SSO in the Supabase project: `supabase sso list` works after enabling via dashboard.
- Generate a Supabase Management API token and add as secret `SUPABASE_MGMT_API_TOKEN`.

### Implementation
1. **New edge function `provision-sso-provider`** (org admin only):
   - Inputs: `organization_id`, `metadata_url` *or* `metadata_xml`, `domains[]`, optional attribute mapping.
   - Calls `POST https://api.supabase.com/v1/projects/{ref}/config/auth/sso/providers` with the SAML metadata and the verified domains.
   - Stores the returned `provider_id` in `organization_sso_config.configuration.supabase_provider_id`.
2. **Sign-in trigger** (client):
   ```ts
   await supabase.auth.signInWithSSO({ domain: emailDomain });
   ```
   Supabase redirects to IdP, validates the SAMLResponse against the registered cert, creates/updates the `auth.users` row, and returns a session — no custom callback needed.
3. **Post-login hook** (Supabase Auth Hook → edge function `sso-post-login`):
   - Triggered on every sign-in.
   - If user came from SAML and has no `organization_members` row, run JIT provisioning (seat-limit check, default role, attribute mapping).
4. **Admin UI updates** in `SSOConfigPanel`:
   - "Upload IdP metadata" (file or URL) instead of pasting raw cert/URL.
   - Display the **ACS URL** and **Entity ID** that the customer pastes into their IdP (Supabase provides these per provider).
   - "Test connection" button hits `provision-sso-provider` in dry-run mode.
5. **Remove** the unsafe direct-body path from `sso-auth-callback` (keep only the post-login JIT logic, or fold it into `sso-post-login`).

### Customer-side checklist (documented in-app)
- In their IdP: create SAML app → set ACS URL and Entity ID from our UI → map attributes `email`, `first_name`, `last_name`, optional `groups` → download metadata XML.
- In OptiRFP: paste metadata → add email domain(s) → add TXT record → click Verify → toggle Active.

---

## Path B — Custom OIDC / SAML Validator (fallback)

Best for: orgs on Supabase plans without native SSO, or providers we want to control end-to-end (e.g., custom OIDC). Implemented as an edge function that fully validates the IdP assertion before issuing a Supabase session via `auth.admin.generateLink`.

### OIDC implementation
- New edge function `sso-oidc-callback`:
  1. Receive `code` + `state` from IdP redirect.
  2. Look up `organization_sso_config` by `state` (signed nonce we set at start).
  3. Exchange code at the IdP `token_endpoint` using `client_id` / `client_secret` from config.
  4. Fetch JWKS from `jwks_uri`, verify `id_token` signature (use `jose` from `https://deno.land/x/jose`).
  5. Validate `iss`, `aud`, `exp`, `nbf`, `nonce`.
  6. Extract `email`, `email_verified=true`, name claims; run JIT provisioning; issue magic link.
- New edge function `sso-oidc-init` to build the authorize URL with PKCE and signed state.

### SAML implementation (only if a customer specifically requires SAML on Path B)
- Use `npm:@node-saml/node-saml` via Deno's npm interop (or `samlify`).
- Edge function `sso-saml-acs`:
  1. Receive `SAMLResponse` POST.
  2. Load IdP cert from `organization_sso_config.configuration.certificate`.
  3. Verify XML signature, decrypt if needed, validate `Audience`, `Destination`, `NotOnOrAfter`, `InResponseTo`.
  4. Extract NameID + attribute statements → JIT provisioning.
- Store SP private key/cert as secrets `SAML_SP_PRIVATE_KEY`, `SAML_SP_CERT`.

### Required secrets (Path B)
- `SAML_SP_PRIVATE_KEY`, `SAML_SP_CERT` (only if SAML enabled)
- Per-org OIDC `client_secret` stored encrypted in `organization_sso_config.configuration` (already masked by `manage-sso-config`).

### Customer-side checklist
- OIDC: register OptiRFP as an app in their IdP, set redirect URI to `https://<project>.supabase.co/functions/v1/sso-oidc-callback`, copy `client_id`/`client_secret` and discovery URL into our UI.
- SAML: download our SP metadata from a new endpoint `GET /functions/v1/sso-saml-metadata?org=<id>`, upload to their IdP, paste their IdP metadata into ours.

---

## Decision matrix surfaced to org admins

```text
                          Path A (Native)   Path B (Custom)
Setup time                ~15 min           ~45 min
Supabase plan required    Pro+              Free OK
Cert rotation             Automatic         Manual
OIDC support              No (SAML only)    Yes
Custom claim mapping      Limited           Full
```

UI presents Path A as default; Path B is a "Use custom OIDC/SAML" advanced toggle.

---

## Rollout phases

1. **Phase 1 — Foundation** (shared section 1–4): domain verification, login enforcement, hardened JIT, rate limits + audit. Removes the current security hole even before any IdP integration.
2. **Phase 2 — Path A**: Supabase native SAML provisioning + post-login hook + admin UI rework.
3. **Phase 3 — Path B (OIDC first)**: ship `sso-oidc-init` / `sso-oidc-callback`. SAML-on-Path-B only on demand.
4. **Phase 4 — Polish**: group → role mapping, SCIM (future), per-org "Test SSO" diagnostic.

---

## Files / surfaces touched

- DB migration: `organization_domains.verification_token`, `verified_at`; `organization_sso_config.configuration` keys (`supabase_provider_id`, `default_role`, `role_mapping`, `client_id`, `discovery_url`, `redirect_uri`).
- Edge functions: **new** `verify-organization-domain`, `provision-sso-provider`, `sso-post-login`, `sso-oidc-init`, `sso-oidc-callback`, (optional) `sso-saml-acs`, `sso-saml-metadata`. **Modified** `sso-auth-callback` (delete unsafe path), `check-sso-domain` (add rate limit), `manage-sso-config` (new fields).
- Frontend: `SSOConfigPanel` (metadata upload, domain verify flow, ACS/Entity ID display, OIDC fields), `AuthForm` / `useAuthRedirects` (enforcement of `sso_required` / `sso_auto_redirect`), keep `SSOLoginDialog` as manual entry point.
- Secrets: `SUPABASE_MGMT_API_TOKEN` (Path A); `SAML_SP_PRIVATE_KEY`, `SAML_SP_CERT` (Path B SAML).
- Docs: in-app setup wizards per IdP (Okta, Azure AD, Google Workspace, generic OIDC).

## Out of scope (future)
- SCIM user provisioning/deprovisioning.
- Just-in-time group sync from IdP directory.
- Multi-IdP per organization (current schema supports it; UI defers to one active config).