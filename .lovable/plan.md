

## Plan: Enhanced Account Settings at `/account`

### Current State
A fully functional `AccountSettings` page already exists at `/account-settings` with ProfileCard, EmailCard, PasswordCard, SubscriptionCard, BillingHistory, BrandGuidelinesCard, and DeleteAccountSection. Most of what's requested is already built.

### What's Missing (gaps to fill)

| Feature | Status |
|---------|--------|
| `/account` route | Missing — currently `/account-settings` |
| Email preference toggles (product updates, marketing, digest) | Missing |
| Password strength indicator | Missing |
| Current password field | Missing |
| Trial countdown ("expires in X days") | Missing from SubscriptionCard |
| "Add Payment Method" button | Missing |
| Brand Guidelines collapsible wrapper | Missing |
| Logo drag-and-drop upload | Missing (only color/font config exists) |
| Branded output preview | Missing |
| Breadcrumb (Dashboard > Account) | Missing |
| Styling updates (max-w-4xl, section borders) | Needs update (currently max-w-2xl) |

### Changes

**1. Add `/account` route + redirect legacy path**
- Add `/account` to `App.tsx` inside the DashboardLayout group pointing to the same `AccountSettings` component
- Add redirect from `/account-settings` → `/account`
- Update Navbar "Account" link to point to `/account`

**2. Enhance `EmailCard.tsx`**
- Show current email as read-only with a "Change Email" button that reveals the edit input
- Add three Switch toggles: Product Updates, Marketing Emails, Weekly Digest
- Store preferences in the `profiles` table (add `email_preferences` JSONB column or use existing fields)

**3. Enhance `PasswordCard.tsx`**
- Add "Current Password" input field
- Add password strength indicator bar (weak/medium/strong) with color coding
- Add "Update Password" button scoped to just the password section

**4. Enhance `SubscriptionCard.tsx`**
- Add trial countdown badge: "Trial expires in X days" using `current_period_end` for trialing status
- Add "Add Payment Method" button that opens the Stripe billing portal

**5. Enhance `BrandGuidelinesCard.tsx`**
- Wrap in `Collapsible` component (collapsed by default)
- Add logo drag-and-drop upload using `react-dropzone` (upload to Supabase Storage)
- Add a small preview section showing logo + colors applied to a mini proposal header

**6. Update `AccountSettings.tsx` layout**
- Change `max-w-2xl` → `max-w-4xl`
- Add breadcrumb: Dashboard > Account
- Add section header borders (`text-xl font-semibold border-b`)

### Files to Modify

| File | Action |
|------|--------|
| `src/App.tsx` | Add `/account` route, redirect `/account-settings` |
| `src/pages/AccountSettings.tsx` | Update layout (max-w-4xl, breadcrumb, section styling) |
| `src/components/account/EmailCard.tsx` | Add read-only display, Change Email button, preference toggles |
| `src/components/account/PasswordCard.tsx` | Add current password, strength indicator, Update Password button |
| `src/components/account/SubscriptionCard.tsx` | Add trial countdown, Add Payment Method button |
| `src/components/account/BrandGuidelinesCard.tsx` | Wrap in Collapsible, add logo upload + preview |
| `src/components/navigation/Navbar.tsx` | Update Account link to `/account` |

