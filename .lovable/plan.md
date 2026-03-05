

## Plan: Enterprise Features Implementation

Based on the codebase analysis, here is what needs to be built to make the five enterprise features functional rather than placeholder claims.

### Current State

| Feature | Status |
|---------|--------|
| **API access & webhooks** | API gateway works. Webhooks have a DB table (`organization_webhooks`) but the UI (`WebhookManager`) is client-only with simulated data -- never reads/writes the actual table. No outbound event dispatch exists. |
| **SSO/SAML** | Config UI + edge function (`manage-sso-config`) + DB table exist. Actual auth flow (SAML ACS, OIDC redirect) is not wired to Supabase Auth. |
| **SOC 2 & FedRAMP** | `ComplianceManager` UI exists. Report generation is a stub (`toast.success` only). No actual report content is generated. |
| **4-hour SLA support** | No support ticket system exists at all. |
| **Custom AI model training** | Nothing exists. |

### What to Build (scoped to what's achievable in this stack)

#### 1. Wire WebhookManager to the real `organization_webhooks` table
- Replace simulated `useState` CRUD in `WebhookManager.tsx` with actual Supabase queries against `organization_webhooks`
- Create a `dispatch-webhook` edge function that receives an event payload + org ID, looks up matching active webhooks, POSTs to each URL with HMAC signature, records success/failure
- Add a `webhook_deliveries` table to log each delivery attempt (webhook_id, event_type, status_code, response_body, created_at)
- Wire the "Test" button to invoke `dispatch-webhook` with a test event

#### 2. Generate real compliance reports
- Create a `generate-compliance-report` edge function that:
  - Queries org data (member count, active projects, security events, data export history, SSO status, API key usage)
  - Assembles a structured JSON report with compliance checklist items (encryption at rest, RLS enabled, audit logging active, etc.)
  - Stores result in `compliance_reports` table with `report_data` JSONB
- Update `ComplianceManager.tsx` to invoke this function and render the returned report data as a downloadable summary

#### 3. Build a support ticket system with SLA tracking
- Create `support_tickets` table: id, organization_id, user_id, subject, description, priority (low/medium/high/critical), status (open/in_progress/resolved/closed), sla_deadline_at, created_at, updated_at
- Create `support_ticket_messages` table for conversation thread
- Create a `SupportTickets` component accessible from the Organization dashboard
- For Enterprise orgs, auto-set `sla_deadline_at` to `created_at + 4 hours` for critical/high priority tickets
- Display SLA countdown badge on each ticket

#### 4. SSO -- add guided setup with provider-specific templates
- Enhance `SSOConfiguration.tsx` with pre-filled configuration templates for Okta, Azure AD, and Google Workspace (entity ID, ACS URL, metadata URL fields)
- Auto-generate the SP metadata URL and ACS callback URL for the org
- Note: Actual SAML assertion processing requires Supabase Auth SAML support which is configured in the Supabase dashboard -- the UI will guide users to complete that step

#### 5. Qualify marketing claims accurately
- Update `SubscriptionPlans.tsx` to change "Custom AI model training" to "Custom AI configuration" (since we use prompt-based customization via knowledge base, not model fine-tuning)
- Change "SOC 2 Type II & FedRAMP" to "SOC 2 Type II ready" with a tooltip explaining compliance report generation is available but certification is an organizational process

### Database Migration

```sql
-- Webhook delivery logs
CREATE TABLE public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.organization_webhooks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  sla_deadline_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support ticket messages
CREATE TABLE public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Plus RLS policies scoped by organization membership, and indexes.

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/dispatch-webhook/index.ts` | Create -- outbound webhook dispatcher |
| `supabase/functions/generate-compliance-report/index.ts` | Create -- compliance report generator |
| `src/components/organization/WebhookManager.tsx` | Modify -- wire to real DB table |
| `src/components/organization/ComplianceManager.tsx` | Modify -- invoke edge function for reports |
| `src/components/organization/SupportTickets.tsx` | Create -- ticket UI with SLA tracking |
| `src/components/organization/SSOConfiguration.tsx` | Modify -- add provider templates |
| `src/components/organization/OrganizationDashboard.tsx` | Modify -- add Support tab |
| `src/components/subscription/SubscriptionPlans.tsx` | Modify -- qualify claims |
| Database migration | Create tables + RLS |
| `supabase/config.toml` | Add new function entries |

