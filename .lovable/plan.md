

## Plan: Enterprise CSM Contact System

### Overview
Add dedicated CSM contact options for Enterprise users across the app: a navbar badge with dropdown, a dedicated `/enterprise-support` page, a dashboard widget, and database support for per-organization CSM assignment.

### 1. Database Migration
Add `csm_name`, `csm_email`, `csm_calendly_url`, and `csm_phone` columns to the `organizations` table. These default to generic values (`csm@optirfp.ai`, etc.) and can be personalized per org by system admins.

```sql
ALTER TABLE public.organizations
  ADD COLUMN csm_name text DEFAULT 'Your OptiRFP CSM',
  ADD COLUMN csm_email text DEFAULT 'csm@optirfp.ai',
  ADD COLUMN csm_calendly_url text DEFAULT 'https://calendly.com/optirfp-enterprise',
  ADD COLUMN csm_phone text DEFAULT NULL;
```

### 2. CSM Data Hook
Create `src/hooks/use-csm-contact.ts` — reads CSM fields from the current organization (via `useCurrentOrganization`), returns contact info with defaults. Also exposes `isEnterprise` boolean derived from `subscription_tier` or subscription plan type.

### 3. Navbar Enterprise Badge (Desktop + Mobile)
Update `src/components/navigation/Navbar.tsx`:
- Next to the avatar (desktop), render a gold "Enterprise" badge when `isEnterprise` is true
- Badge click opens a popover/dropdown showing:
  - Your CSM: [name]
  - Email: [csm_email] (mailto link)
  - Book a call: [calendly link]
  - Priority support badge
  - Link to `/enterprise-support`
- Mobile: add a "Priority Support" link in the mobile sheet nav

### 4. Enterprise Support Page
Create `src/pages/EnterpriseSupport.tsx` with:
- Header: "Enterprise Priority Support"
- CSM contact card (name, email, phone, Calendly embed/link)
- SLA response times table (Email: 4hr, Phone: 1hr, Urgent: 30min)
- Resources section (onboarding guide, best practices, QBR scheduling)
- Non-enterprise users see an upgrade prompt
- Register route `/enterprise-support` in `App.tsx`

### 5. Dashboard CSM Widget
Create `src/components/dashboard/CSMContactWidget.tsx`:
- Compact card: "Your CSM: [Name] — [Email] [Schedule Call]"
- Shown on the Dashboard sidebar for enterprise users (replaces/supplements the existing static CSM badge)
- Update `Dashboard.tsx` to render this widget in the sidebar when enterprise

### 6. Update Enterprise Getting Started
Update `src/components/organization/EnterpriseGettingStarted.tsx` support tab:
- Replace the static "Contact Support" button with actual mailto/Calendly links using org CSM data

### Files Changed/Created

| File | Action |
|------|--------|
| Supabase migration (add CSM columns to organizations) | Create |
| `src/hooks/use-csm-contact.ts` | Create |
| `src/pages/EnterpriseSupport.tsx` | Create |
| `src/components/dashboard/CSMContactWidget.tsx` | Create |
| `src/components/navigation/Navbar.tsx` | Update (add enterprise badge + dropdown) |
| `src/pages/Dashboard.tsx` | Update (replace static CSM banner with widget) |
| `src/components/organization/EnterpriseGettingStarted.tsx` | Update (wire real CSM links) |
| `src/App.tsx` | Update (add `/enterprise-support` route) |

### Not in Scope (Requires External Setup)
- Welcome email with CSM intro (requires updating the `send-email` Edge Function templates — can be done as a follow-up)
- In-app chat / "Message your CSM" (requires a third-party chat integration like Intercom)
- Automated email footer with CSM info (follow-up after core UI is built)

