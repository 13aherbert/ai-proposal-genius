

## Diagnosis: Infinite Toast Notifications and Subscription Fetch Storm

### Root Causes

**1. NetworkStatusProvider context value not memoized**

`checkConnection` (line 40) is a plain function recreated every render. The context value `{ status: networkStatus, checkConnection }` is a new object every render, causing ALL consumers of `useNetwork()` to re-render — including `SubscriptionProvider`. Each re-render recreates `fetchSubscriptionData`, triggering the useEffect.

**2. SubscriptionProvider error path shows toast on every failure**

Line 259: `toast.error('Failed to fetch subscription data...')` fires inside the catch block with no deduplication. If the fetch fails repeatedly (e.g., network flakiness from the favicon flood), each failure produces a toast.

**3. `useSubscriptionNotifications` has no guard for failed payment toasts**

The `hasFailedPayment()` check (line 19) fires a `toast.error("Payment failed")` every time the useEffect runs, with no `hasShownFailedPaymentNotice` state guard. The effect depends on `subscription.hasFailedPayment` (line 91), which is a new callback reference whenever subscription changes, causing the effect to re-run and fire the toast again.

**4. `refreshSubscription` calls `withNetworkCheck` which floods favicon requests**

`withNetworkCheck` calls `checkConnection()` which fetches `/favicon.ico`. When called repeatedly (due to re-renders), this creates the favicon request flood visible in the network logs.

### Fix Plan

**Step 1: Memoize NetworkStatusProvider context value**

In `src/hooks/network/NetworkStatusProvider.tsx`:
- Wrap `checkConnection` in `useCallback`
- Memoize the context value with `useMemo` so consumers don't re-render unless `networkStatus` actually changes
- Use a ref for `networkStatus` inside `checkConnection` to avoid stale closure issues

**Step 2: Remove toast from SubscriptionProvider error path**

In `src/hooks/subscription/providers/SubscriptionProvider.tsx`:
- Remove `toast.error('Failed to fetch subscription data...')` from line 259 — errors are already handled by setting the `error` state, and consumers can react to it. This eliminates toast spam on repeated fetch failures.

**Step 3: Add guard for failed payment toast in useSubscriptionNotifications**

In `src/hooks/use-subscription-notifications.tsx`:
- Add `hasShownFailedPaymentNotice` state (like the existing grace period and renewal guards)
- Gate the `toast.error("Payment failed")` call behind this guard
- Remove `subscription.hasFailedPayment` and `subscription.isInGracePeriod` from the useEffect dependency array — these are functions that change reference on every subscription change and should be called inside the effect, not used as dependencies

**Step 4: Prevent refreshSubscription from being called during initialization**

In `src/hooks/subscription/providers/SubscriptionProvider.tsx`:
- Make `refreshSubscription` skip the `withNetworkCheck` wrapper and call `fetchSubscriptionData` directly (the function already handles offline checking internally)
- This eliminates the duplicate favicon fetch on every refresh

### Files Changed

1. `src/hooks/network/NetworkStatusProvider.tsx` — memoize context value and checkConnection
2. `src/hooks/subscription/providers/SubscriptionProvider.tsx` — remove toast.error from catch, simplify refreshSubscription
3. `src/hooks/use-subscription-notifications.tsx` — add failed payment guard, fix useEffect dependencies

