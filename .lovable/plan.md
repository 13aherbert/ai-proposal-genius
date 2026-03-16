

## Plan: SSO/SAML Authentication for Enterprise Tier

### Current State
- `organization_sso_config` table exists with basic fields (provider_type, provider_name, configuration JSON, is_active)
- `manage-sso-config` edge function exists with CRUD operations
- `SSOConfiguration.tsx` component exists with basic list/create/toggle/delete UI and provider templates (Okta, Azure AD, Google Workspace)
- `organizations` table has `sso_enabled` field (always false)
- `organization_domains` table exists with verified domain tracking
- No SSO login flow on the auth page
- No SAML callback handling
- No JIT user provisioning

### What Needs to Be Built

#### 1. Database: Add SSO Settings Columns to Organizations
Add `sso_required`, `sso_allow_password_fallback`, and `sso_auto_redirect` boolean columns to the `organizations` table for org-level SSO policy enforcement.

#### 2. Rewrite `SSOConfiguration.tsx` as a Setup Wizard
Replace the current flat form with a 4-step wizard:
- **Step 1 — Choose Provider**: Cards for SAML 2.0 (Generic), Okta, Azure AD, Google Workspace, OneLogin
- **Step 2 — Configure**: Labeled fields for SSO URL, IdP Issuer/Entity ID, X.509 Certificate (paste textarea), and attribute mappings (email, firstName, lastName) — pre-filled from template
- **Step 3 — Test**: "Test SSO Configuration" button that validates the config via the edge function (new `test` action) and shows success/error feedback
- **Step 4 — Enable**: Toggles for "Require SSO for all users", "Allow password login as backup", and a Save button that updates both the SSO config and org-level settings

#### 3. Add "Sign in with SSO" to Login Page
Update `AuthForm.tsx`:
- Add a "Sign in with SSO" button below the password form
- On click, show an email input dialog
- Extract domain from email, call a new `check-sso-domain` edge function
- If org has active SSO config → redirect user to the IdP SSO URL (stored in config)
- If no SSO → show message "No SSO configured for this domain"

#### 4. Create `sso-auth-callback` Edge Function
Handles the SAML/SSO callback flow:
- Receives the callback from the IdP (SAML assertion or OAuth code)
- Validates the assertion/token
- Looks up the organization by domain
- **JIT Provisioning**: If user doesn't exist, creates account via Supabase Auth admin API, creates profile, adds to organization
- If user exists, signs them in
- Returns a session redirect URL to the frontend

#### 5. Create `check-sso-domain` Edge Function
- Accepts an email address
- Extracts domain
- Checks `organization_domains` for a verified domain match
- Checks if that org has an active SSO config
- Returns `{ ssoEnabled: boolean, ssoUrl?: string, providerName?: string }`

#### 6. Add `test` Action to `manage-sso-config` Edge Function
- Validates the configuration fields (SSO URL is reachable, certificate is valid X.509 format)
- Returns validation results with specific error messages

#### 7. SSO Settings Panel in Organization Dashboard
Create `SSOSettings.tsx` component (rendered below the SSO config list):
- Toggle: Enable SSO (`sso_enabled` on org)
- Toggle: Require SSO (block password login)
- Toggle: Allow password fallback
- Toggle: Auto-redirect to SSO
- Updates `organizations` table via the existing edge function (new `update-settings` action)

#### 8. Login Flow Enforcement
Update `AuthForm.tsx` login handler:
- After email is entered, check if user's org requires SSO
- If `sso_required` is true and `sso_allow_password_fallback` is false → block password login, show "Your organization requires SSO login" message
- If fallback allowed → let them choose

#### 9. Audit Logging
Add SSO-specific events to `security_events_log` via the edge functions:
- `sso_config_created`, `sso_config_updated`, `sso_config_deleted`, `sso_config_toggled`
- `sso_login_success`, `sso_login_failure`
- `sso_user_provisioned` (JIT)

### Files Changed/Created

| File | Action |
|------|--------|
| Supabase migration (add sso_required, sso_allow_password_fallback, sso_auto_redirect to organizations) | Create |
| `src/components/organization/SSOConfiguration.tsx` | Rewrite as wizard |
| `src/components/organization/SSOSettings.tsx` | Create |
| `src/components/auth/AuthForm.tsx` | Update (add SSO button + domain check) |
| `src/components/auth/SSOLoginDialog.tsx` | Create |
| `supabase/functions/check-sso-domain/index.ts` | Create |
| `supabase/functions/sso-auth-callback/index.ts` | Create |
| `supabase/functions/manage-sso-config/index.ts` | Update (add test + update-settings actions) |
| `src/components/organization/OrganizationDashboard.tsx` | Update (add SSOSettings) |

### Important Limitations
- True SAML assertion validation requires XML signature verification libraries; the edge function will validate config structure and perform basic connectivity checks. Full IdP-initiated SAML flow requires Supabase Auth's native SAML support to be configured in the dashboard.
- The SSO callback handler will work with Supabase's built-in SAML provider — the wizard stores config metadata and the actual SAML provider must also be registered in Supabase Auth settings.

