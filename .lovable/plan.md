

## Fix: Make "Find Opportunities" Accessible from the Dashboard

### Problem
The Dashboard page (`src/pages/Dashboard.tsx`) does not render the `<Navbar />` component. It only renders `<DashboardHeader />`, which is a welcome/action card -- not the navigation bar. Since the "Find Opportunities" link lives in the Navbar, Pro users on the Dashboard page cannot see or access the Opportunities page.

### Solution (Two Changes)

#### 1. Add `<Navbar />` to the Dashboard page
Import and render `<Navbar />` at the top of both the solo-user and regular dashboard return blocks so the navigation links (including "Find Opportunities") are visible.

**File:** `src/pages/Dashboard.tsx`
- Import `Navbar` from `@/components/navigation/Navbar`
- Add `<Navbar />` before `<DashboardHeader />` in both the solo-user return (line ~132) and the regular dashboard return (line ~205)

#### 2. Add a Quick Action card for Opportunities on the Dashboard
Add a "Find Opportunities" Quick Action card in the dashboard grid for Pro users, so the feature is discoverable without relying solely on the navbar.

**File:** `src/pages/Dashboard.tsx`
- Import `Search` icon from `lucide-react`
- In the Quick Actions grid (both solo and regular dashboards), add a conditional `QuickActionCard` for `/opportunities` when the user has a Pro subscription
- Use the existing subscription data (already available via `useSubscription` in `DashboardHeader`) or check `subscription?.plan_type` to gate visibility

### Technical Details

The Navbar is already fully functional with the "Find Opportunities" link for all logged-in users (lines 40-42 in Navbar.tsx). The only issue is that Dashboard.tsx never mounts it. No changes to routing, feature gating, or the Opportunities page itself are needed.

