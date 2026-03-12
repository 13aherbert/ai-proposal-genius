

## Plan: HubSpot CRM Integration

### Overview
Build a full HubSpot CRM integration with OAuth 2.0 authentication, bidirectional data sync (proposals → deals), and a field mapping UI. This leverages the existing `organization_integrations` table in the database.

### Prerequisites — Secrets & HubSpot App Setup
HubSpot is not available as a Lovable connector, so we need a custom HubSpot OAuth app:
1. User creates a HubSpot developer app at `https://developers.hubspot.com/`
2. Sets redirect URI to `https://bmopbbkfxkgzlbmhhgox.supabase.co/functions/v1/hubspot-oauth-callback`
3. We store `HUBSPOT_CLIENT_ID` and `HUBSPOT_CLIENT_SECRET` as Supabase Edge Function secrets

### Database Changes (1 migration)

**New table: `integration_field_mappings`**
- `id`, `integration_id` (FK → organization_integrations), `source_field`, `target_field`, `transform_type`, `is_active`, timestamps
- RLS: org members can view, org admins can manage

**New table: `integration_sync_logs`**
- `id`, `integration_id` (FK → organization_integrations), `sync_type` (full/incremental), `direction` (push/pull), `records_processed`, `records_failed`, `error_details`, `started_at`, `completed_at`
- RLS: org members can view

### Edge Functions (3 new)

**1. `hubspot-oauth-init`** — Generates the HubSpot OAuth authorization URL
- Accepts `organization_id`, builds state token (org_id + user_id encrypted), returns redirect URL
- Scopes: `crm.objects.contacts.read`, `crm.objects.deals.read`, `crm.objects.deals.write`

**2. `hubspot-oauth-callback`** — Handles OAuth redirect from HubSpot
- Exchanges authorization code for access/refresh tokens
- Stores encrypted tokens in `organization_integrations.credentials`
- Creates the integration record, redirects user back to settings page

**3. `hubspot-sync`** — Executes data sync operations
- **Push**: Maps won proposals → HubSpot deals (creates/updates)
- **Pull**: Fetches HubSpot deals/contacts into local cache for reference
- Uses refresh token flow if access token expired
- Logs sync results to `integration_sync_logs`

### Frontend Components (3 new, 1 modified)

**1. `src/components/organization/integrations/HubSpotIntegration.tsx`**
- Connect button → initiates OAuth via `hubspot-oauth-init`
- Connection status card (connected/disconnected, last sync, error state)
- Manual sync trigger button
- Disconnect button

**2. `src/components/organization/integrations/FieldMappingEditor.tsx`**
- Two-column mapping UI: OptiRFP fields (left) ↔ HubSpot fields (right)
- Default mappings: project title → deal name, client_name → company, deadline → close date, status → deal stage
- Add/remove mapping rows, save to `integration_field_mappings`

**3. `src/components/organization/integrations/SyncHistory.tsx`**
- Table showing recent syncs from `integration_sync_logs`
- Status badges, record counts, error details expandable

**4. Modified: `IntegrationManager.tsx`**
- Replace the generic HubSpot template placeholder with the actual `HubSpotIntegration` component
- Add "hubspot" to integration templates with proper OAuth flow instead of webhook URL

### Data Flow

```text
User clicks "Connect HubSpot"
  → hubspot-oauth-init returns auth URL
  → User authorizes on HubSpot
  → hubspot-oauth-callback exchanges code for tokens
  → Stores in organization_integrations
  → User sees "Connected" status

User clicks "Sync Now"
  → hubspot-sync reads field mappings
  → Fetches proposals with status = 'won'
  → Maps fields per integration_field_mappings
  → Creates/updates HubSpot deals via API
  → Logs results to integration_sync_logs
```

### Technical Notes
- Tokens stored AES-256 encrypted in `credentials` JSONB column (consistent with existing security standards)
- `verify_jwt = false` in config.toml; manual JWT validation in edge functions
- The `organization_integrations` table exists in DB but not in generated types — will use type assertions for Supabase client queries
- HubSpot API rate limit: 100 requests/10 seconds — sync function batches accordingly
- OAuth state parameter signed with HMAC to prevent CSRF

