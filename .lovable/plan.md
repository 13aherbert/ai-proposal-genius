

## Plan: Enhanced Enterprise Tier + Pro "Most Popular" Badge + Contact Sales Modal

### Overview
The Enterprise card already exists but needs updated features, styling, and a contact form modal. The "Popular" badge needs to move from Basic to Pro. A new `EnterpriseSalesModal` component handles the contact form.

### Changes

**1. `src/components/blocks/pricing-demo.tsx`** — Update plans array
- Move `isPopular: true` from Basic to Pro
- Update Enterprise features to the full list (Everything in Pro plus unlimited projects, unlimited team members, API access, SSO/SAML, custom AI model training, dedicated account manager, 4-hour support response, quarterly business reviews, custom integrations, SOC 2 compliance support)
- Update Enterprise yearlyPrice to `2988` ($249/mo * 12)
- Remove `href: "mailto:..."` — the modal handles contact now

**2. `src/components/blocks/pricing/PricingCard.tsx`** — Enterprise-specific rendering
- Add Enterprise badge: "For teams & government contractors" (blue-500 accent) at top-left
- Add Enterprise card styling: `shadow-lg border-l-4 border-l-blue-500`
- Enterprise CTA: instead of auth dialog or direct subscribe, open an `EnterpriseSalesModal`
- Enterprise button style: outline with blue border, blue text
- Import and use new `EnterpriseSalesModal` component

**3. `src/components/blocks/pricing/EnterpriseSalesModal.tsx`** — NEW file
- Dialog with form fields: Company name (required), Email (required), Team size (select: <5, 5-20, 20-50, 50+), Message (optional textarea)
- Zod validation for company name and email
- Submit constructs a `mailto:sales@optirfp.ai` with form data as body/subject
- Shows toast on submit, closes dialog
- Uses existing `Input`, `Label`, `Textarea`, `Select`, `Button`, `Dialog` components

**4. Grid is already 4-column (`lg:grid-cols-4`) — no change needed.**

### Technical Details
- The `PricingCard` animation logic uses index-based transforms (index 0/2 scale down, index 1 centered). With 4 cards this needs adjustment: remove the x-offset/scale logic for the 4-card layout to keep all cards equal size
- Enterprise card gets `mt-0` instead of `mt-5` (like popular cards) to align with the elevated style

