# Enterprise & White-Label Signup + Setup Automation

Goal: Replace today's manual, sales-assisted flow with a real lead-capture pipeline, an admin "Convert to Enterprise/White-Label" action, and a guided setup wizard for newly provisioned orgs.

## 1. Lead capture (public)

**`EnterpriseSalesModal.tsx`** — replace the `mailto:` fallback with a real submission.

- New table `enterprise_leads` (public insert via RLS, admin select):
  - `id`, `company_name`, `email`, `team_size`, `message`, `source` (`pricing` | `contact` | `csm`), `requested_tier` (`enterprise` | `white_label`), `status` (`new` | `contacted` | `converted` | `rejected`), `created_at`, `converted_org_id`.
- Edge function `submit-enterprise-lead`:
  - Zod-validate payload, insert row, send notification email to `sales@optirfp.ai` via Resend, send auto-reply to requester.
  - Optionally push to HubSpot (existing `hubspot-sync` function) when connector is connected — create Contact + Deal in "Enterprise Pipeline".
- Add a "Request White-Label Demo" CTA on `WhiteLabelDashboard` upsell state and on `/pricing` Enterprise card so both tiers funnel to the same modal with `requested_tier` preset.

## 2. Admin provisioning

New page `src/pages/admin/AdminLeads.tsx` (linked from `AdminDashboard`):

- List `enterprise_leads` with filters by status/tier.
- Row action **"Convert to Enterprise"** / **"Convert to White-Label"** opens a dialog:
  - Pick existing org (search) OR create new org on behalf of lead email.
  - Choose tier, seat limit, project limit, billing model (`flat_rate` | `per_user` | `usage_based`), custom price, trial end date, CSM (name/email/calendly/phone).
  - Submit calls new edge function `admin-provision-enterprise` (service role) which:
    1. Creates/updates `organizations` row (`subscription_tier`, `is_white_label`).
    2. Upserts `organization_subscriptions` with chosen limits/features.
    3. Writes CSM fields onto org (used by `useCSMContact`).
    4. For white-label: seeds default `organization_branding` row + enables `white_label`, `custom_domain`, `sso`, `api_access` flags in `organization_features`.
    5. Marks lead `status='converted'`, sets `converted_org_id`.
    6. Sends welcome email to lead with magic-link to `/onboarding/enterprise`.

All admin checks via existing `is_system_admin()` RPC.

## 3. Guided setup wizard for the customer

New route `/onboarding/enterprise` (gated to org owners of enterprise/white-label tiers, uses `DashboardLayout`).

Component `EnterpriseSetupWizard.tsx` — stepper with persistence in `organizations.settings.setup_progress`:

1. **Welcome** — confirms tier, CSM contact card, schedule kickoff (Calendly embed).
2. **Company profile** — legal name, support email, terms/privacy URLs → writes `organization_branding`.
3. **Branding** (white-label only) — reuses `BrandingEditor` + `AssetUploader` (logo, favicon, colors, font).
4. **Custom domain** (white-label only) — reuses `DomainManager`; shows DNS records, polls verification.
5. **Team invites** — bulk invite via existing `team-invite` function, role templates (Admin/Manager/Editor/Viewer).
6. **SSO** (optional, enterprise/white-label) — reuses `manage-sso-config` to drop in SAML/OIDC metadata.
7. **API keys** (white-label) — reuses `ApiKeyManagement`.
8. **Done** — checklist summary, link to dashboard.

Each step marks complete in `setup_progress` JSON so the wizard is resumable. A persistent "Finish setup" banner appears in `DashboardLayout` until all required steps are done.

## 4. Self-serve "Talk to sales" polish

- `Pricing.tsx` Enterprise card → opens `EnterpriseSalesModal` (already present).
- `EnterpriseSupport.tsx` for non-enterprise users → CTA to same modal.
- Add `/contact` form to also write to `enterprise_leads` with `source='contact'`.

## Technical notes

- **DB migration**: `enterprise_leads` table + RLS (anon insert, system_admin select/update); add `csm_name/email/calendly_url/phone` columns to `organizations` if not already present; ensure `organization_branding`/`organization_features` exist (per project knowledge they're planned — create if missing).
- **Edge functions** (new): `submit-enterprise-lead`, `admin-provision-enterprise`. Both use Zod validation, manual JWT validation where applicable, service-role client for admin op.
- **Secrets needed**: `RESEND_API_KEY` (via Resend connector). HubSpot push uses existing connector if linked — skipped silently otherwise.
- **Reuses**: `BrandingEditor`, `AssetUploader`, `DomainManager`, `ApiKeyManagement`, `EmailTemplateEditor`, `team-invite`, `manage-sso-config`, `useCSMContact`, `is_system_admin`.

## Out of scope (call out, don't build)

- Stripe checkout for enterprise (contract-billed).
- Automatic SSL provisioning (DomainManager already shows DNS instructions).
- Building new SSO providers beyond what `manage-sso-config` supports.

## Files to add

- `supabase/migrations/<ts>_enterprise_leads.sql`
- `supabase/functions/submit-enterprise-lead/index.ts`
- `supabase/functions/admin-provision-enterprise/index.ts`
- `src/pages/admin/AdminLeads.tsx`
- `src/components/admin/ConvertLeadDialog.tsx`
- `src/pages/onboarding/EnterpriseOnboarding.tsx`
- `src/components/onboarding/EnterpriseSetupWizard.tsx` (+ step components)
- `src/components/layout/EnterpriseSetupBanner.tsx`

## Files to edit

- `src/components/blocks/pricing/EnterpriseSalesModal.tsx` — submit to edge function instead of mailto.
- `src/pages/AdminDashboard.tsx` — nav entry for Leads.
- `src/layouts/DashboardLayout.tsx` — mount setup banner.
- `src/App.tsx` — register new routes.
