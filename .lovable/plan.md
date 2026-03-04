

## Plan: Embed Calendly in Enterprise Sales Modal

### Overview
Replace the current lead-capture form in `EnterpriseSalesModal` with a two-tab experience: a Calendly inline embed for instant demo booking (default view) and a fallback contact form tab for those who prefer email.

### Changes

#### 1. `src/components/blocks/pricing/EnterpriseSalesModal.tsx` — Rewrite modal content

**New layout:**
- Two-state view controlled by a `view` state: `"calendly"` (default) | `"form"`
- **Calendly view:**
  - Header: "Schedule Your OptiRFP Demo" + "30-minute call with our enterprise team"
  - Calendly inline widget via `<iframe>` pointing to a placeholder URL (`https://calendly.com/optirfp/enterprise-demo`) — easily swapped for the real URL later
  - iframe sized `w-full h-[500px]` with `border-0`
  - Small link below: "Prefer email? Contact us instead" toggles to form view
- **Form view:** Keep existing form (company, email, team size, message) as-is, with a "Back to scheduling" link to return to Calendly view
- **Booking confirmed state:** After Calendly `message` event fires with `calendly.event_scheduled`, show a confirmation UI with green checkmark, "Demo Scheduled!" heading, and a "Close" button
- Listen for Calendly postMessage events in a `useEffect` to detect booking completion
- Widen dialog to `sm:max-w-2xl` to accommodate Calendly embed
- Track `enterprise_demo_scheduled` event via the existing analytics service on booking confirmation

#### 2. `src/components/blocks/pricing/PricingCard.tsx` — Add Calendar icon to Schedule Demo button

- Import `Calendar` from lucide-react
- Add `<Calendar className="h-4 w-4" />` inside the "Schedule Demo" button (line 126)

### Files Summary

| File | Action |
|------|--------|
| `src/components/blocks/pricing/EnterpriseSalesModal.tsx` | Rewrite — Calendly embed + fallback form |
| `src/components/blocks/pricing/PricingCard.tsx` | Minor — add Calendar icon to button |

