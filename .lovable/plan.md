

## Plan: Redesign BillingHistory with 3 Distinct UI States

**File:** `src/components/account/BillingHistory.tsx` — full rewrite of the component.

### Changes

**1. Data fetching with retry logic**
- Replace manual `useState`/`useEffect` fetching with `withRetry` from `src/utils/network/retry.ts` (already exists) — 3 retries with exponential backoff
- Keep `useState` pattern (project doesn't use React Query for this component currently) but wrap the supabase call in `withRetry`
- On retry exhaustion, set error state (currently errors are swallowed and show empty state — change to distinguish real errors from "no Stripe customer")
- Detect "no customer" responses (empty invoices array with 200 status) as empty state, not error

**2. Loading state — skeleton rows**
- Replace the spinner with 3 skeleton rows using the existing `Skeleton` component from `@/components/ui/skeleton`
- Each row: flex container (h-[60px], gap-4, p-4, border, rounded-lg) containing 3 skeletons for date, amount, and status badge

**3. Error state — friendly error card**
- Import `AlertOctagon` from lucide-react
- Red-tinted card (bg-red-50 border-red-200) with centered layout
- AlertOctagon icon (red-500, 48px)
- Heading: "Unable to load billing history"
- Subtext: "This is usually a temporary connection issue. Your billing is secure."
- Two buttons side-by-side: "Try Again" (primary, calls fetchBillingHistory) and "Contact Support" (secondary, mailto:support@optirfp.ai)
- No raw error messages or technical details shown to user

**4. Empty state — improved design**
- Receipt icon (64px, text-gray-400)
- Heading: "No billing history yet"
- Subtext: "Your invoices and payment history will appear here after your first charge."
- CTA: "View Plans" button linking to `/pricing`

**5. Error discrimination logic**
- API returns `{ invoices: [], hasMore: false }` with 200 for users without Stripe customer → empty state
- API throws or returns non-200 → error state (after retries exhausted)
- Console.error for debugging preserved, but never shown in UI

### Technical Details
- Single file change: `src/components/account/BillingHistory.tsx`
- Reuses existing: `Skeleton`, `withRetry`, `Card`, `Button`, `Badge` components
- New import: `AlertOctagon` from lucide-react, `Skeleton` from ui, `withRetry` from utils, `useNavigate` from react-router-dom

