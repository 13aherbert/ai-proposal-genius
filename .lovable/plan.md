

## Plan: Fix Onboarding Modals Blocking Dashboard

### Problem
Two onboarding modals (`ProgressiveOnboarding` and `FirstRFPWizard`) use Radix Dialog which is modal by default -- it sets `pointer-events: none` on `<body>` and traps focus. Both can auto-open for new users, blocking all dashboard interaction.

### Changes

**1. Fix `ProgressiveOnboarding.tsx`**
- Dialog already has `onOpenChange` wired to `onSkip` -- ESC and X button should work. Verify the X button from `DialogContent` is visible and functional.
- Add explicit "Explore Dashboard First" text link below the skip button in `WelcomeStep`
- Ensure closing the dialog properly calls `onSkip` which sets localStorage flag

**2. Fix `FirstRFPWizard.tsx`**
- Already has `onOpenChange` and a "Skip for now" button in `WelcomeStep`. The Radix Dialog X button from `DialogContent` handles close.
- Add "Explore Dashboard First" link in `WelcomeStep`

**3. Fix `useOnboardingFlow.ts`**
- The `skip` function sets `onboarding_skipped` in localStorage and closes the modal. This already works.
- Add a `reopen` method that clears the skipped flag and opens the modal (for Help menu access)

**4. Add "Restart Onboarding" to Navbar user dropdown**
- Add a menu item in the user dropdown in `Navbar.tsx` that calls `onboarding.resume()` or dispatches a custom event
- Gate visibility: only show if onboarding was skipped and not completed

**5. Fix `dialog.tsx` -- prevent `pointer-events: none` persistence**
- Add `modal={false}` is NOT the right fix (breaks overlay). Instead, the real fix is ensuring dialogs close cleanly. The current `DialogContent` already has an X button.
- Add a cleanup `useEffect` in `ProgressiveOnboarding` and `FirstRFPWizard` that removes `pointer-events: none` from `document.body` on unmount, as a safety net against Radix cleanup race conditions.

**6. Prevent both modals opening simultaneously**
- In `Dashboard.tsx`, skip opening `FirstRFPWizard` if `ProgressiveOnboarding` is already open (`onboarding.isOpen`)
- This prevents stacked modals and double `pointer-events: none`

### Files

| File | Action |
|------|--------|
| `src/components/onboarding/ProgressiveOnboarding.tsx` | Add "Explore Dashboard First" link, body cleanup on unmount |
| `src/components/onboarding/FirstRFPWizard.tsx` | Add "Explore Dashboard First" link, body cleanup on unmount |
| `src/pages/Dashboard.tsx` | Prevent both modals opening simultaneously |
| `src/hooks/use-onboarding-flow.ts` | Add `reopen` method for Help menu |
| `src/components/navigation/Navbar.tsx` | Add "Restart Onboarding" menu item |

