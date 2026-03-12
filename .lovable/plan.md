

## Plan: Referral Program Interface

### What to Build
A referral dashboard page (`/referral`) and a reusable referral card component for embedding in Account Settings and other placements.

### Files to Create

**1. `src/pages/Referral.tsx`** — Full referral dashboard
- Hero: "Give $50, Get 1 Month Free" with gradient background
- Unique referral link (generated from user ID) with copy button
- Stats cards: Total Referrals, Converted, Credits Earned
- Progress tracker toward next reward milestone
- Share buttons: Email, Twitter/X, LinkedIn, Copy Link
- How It Works section (3 steps)
- SEO title via `useEffect`
- All data is mock/local for now (no DB table)

**2. `src/components/account/ReferralCard.tsx`** — Compact card for Account Settings
- Shows referral link + copy button
- Quick stats inline
- "View Full Dashboard" link to `/referral`
- Prominent "Share & Earn" CTA

### Files to Modify

**3. `src/App.tsx`** — Add `/referral` as authenticated route inside DashboardLayout

**4. `src/pages/AccountSettings.tsx`** — Add `<ReferralCard />` between BillingHistory and Organization Management sections

### Technical Notes
- No database tables needed yet — stats are placeholder/mock
- Referral link format: `https://ai-proposal-genius.lovable.app/?ref={userId}`
- Share buttons use `window.open` for social and `navigator.clipboard` for copy
- Progress tracker uses existing `Progress` component
- Reuses `Card`, `Button`, `Badge`, `Progress` UI components

