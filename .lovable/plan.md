## Problem

Two separate "welcome" surfaces auto-open on the dashboard:

1. **`FirstRFPWizard`** (`src/components/onboarding/FirstRFPWizard.tsx`) — opened from `Dashboard.tsx` (line 86–94) whenever the user has no projects and `localStorage` flags `optirfp_first_rfp_complete` / `optirfp_wizard_skipped` are missing.
2. **`ProgressiveOnboarding`** — driven by `useOnboardingFlow()` which already persists `onboarding_completed` / `onboarding_skipped_at` to the `profiles` table.

The bug is in **#1**:
- `Dialog`'s `onOpenChange` is wired directly to `setShowFirstRFPWizard`, so closing via the X button, ESC, or outside-click sets the dialog closed but **never writes the skip flag**.
- The skip flag is only written when the user explicitly clicks the "Skip for now" button (`handleSkip`).
- The flag is also localStorage-only, so logging in from another browser/device replays the wizard.

Result: every login re-opens the welcome wizard.

## Fix

### 1. Persist dismissal on every close path (`FirstRFPWizard.tsx`)

Wrap the `Dialog`'s `onOpenChange` so any close — X, ESC, outside click, or programmatic — writes the skip flag (unless the wizard was completed):

```tsx
const handleDialogOpenChange = useCallback((nextOpen: boolean) => {
  if (!nextOpen && !isComplete) {
    localStorage.setItem("optirfp_wizard_skipped", "true");
    trackEvent("first_rfp_wizard_skipped", { reason: "dismissed" });
  }
  onOpenChange(nextOpen);
}, [isComplete, onOpenChange, trackEvent]);

<Dialog open={open} onOpenChange={handleDialogOpenChange}>
```

### 2. Persist dismissal server-side (cross-device)

Reuse the existing `profiles.onboarding_skipped_at` column (already used by `useOnboardingFlow`) so a single skip survives across browsers/devices.

In `Dashboard.tsx`'s auto-open effect, also gate on `onboarding.isSkipped` / `onboarding.isCompleted` from `useOnboardingFlow()`:

```ts
useEffect(() => {
  if (dashboardStats.hasProjects) return;
  if (onboarding.isOpen || onboarding.isSkipped || onboarding.isCompleted) return;
  const completed = localStorage.getItem('optirfp_first_rfp_complete');
  const skipped = localStorage.getItem('optirfp_wizard_skipped');
  if (!completed && !skipped && session?.user) {
    setShowFirstRFPWizard(true);
  }
}, [dashboardStats.hasProjects, session, onboarding.isOpen, onboarding.isSkipped, onboarding.isCompleted]);
```

And in `FirstRFPWizard`'s `handleSkip` + new `handleDialogOpenChange`, call a small helper that also updates the profile row:

```ts
await supabase
  .from('profiles')
  .update({ onboarding_skipped_at: new Date().toISOString() })
  .eq('profile_id', userId);
```

(Use the already-imported `supabase` client and the user id from `useAuth()`.)

### 3. Keep "Show welcome again" escape hatch

The Navbar already dispatches `reopen-onboarding`, which calls `onboarding.reopen()` and clears both the profile flags and `localStorage`. We'll extend that handler in `Dashboard.tsx` to also clear `optirfp_wizard_skipped` and `optirfp_first_rfp_complete` so users who explicitly request the tour again still see it.

## Files to change

- `src/components/onboarding/FirstRFPWizard.tsx` — wrap `onOpenChange`, write skip flag + profile update on any dismissal.
- `src/pages/Dashboard.tsx` — gate auto-open on `onboarding.isSkipped/isCompleted`; clear local flags inside the existing `reopen-onboarding` handler.

No database migration is needed — the `profiles.onboarding_skipped_at` column already exists.

## Verification

1. Fresh login → wizard appears.
2. Close via X / ESC / outside click → reload → wizard does **not** reappear.
3. Click "Skip for now" → reload → wizard does **not** reappear.
4. Log in from a different browser (same user) → wizard does **not** reappear (server-side flag).
5. Open Navbar → "Show welcome again" → wizard reappears as expected.
