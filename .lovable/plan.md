

## Fix: Onboarding Modal Close/Skip Behavior

### Problem
The X button, ESC key, and backdrop click on the onboarding wizard may advance to Step 2 instead of closing. The root cause is in `ProgressiveOnboarding.tsx` — the `handleDialogChange` correctly calls `onSkip()`, but there may be timing issues with Radix Dialog's close animation and the `onSkip` flow. Additionally, `document.body` pointer-events cleanup needs hardening.

### Changes

**1. `src/components/onboarding/ProgressiveOnboarding.tsx`**
- Rewrite `handleDialogChange` to explicitly close the modal and persist skip state, preventing any step advancement
- Add `useEffect` cleanup that forcibly removes `pointer-events` and `overflow` styles from `document.body` whenever `isOpen` changes to `false` (not just on unmount)
- Ensure the Dialog does NOT set `modal={true}` behaviors that block body interaction — or override with explicit body style management
- Add an explicit "Skip onboarding" button in the footer area of every step (not just Step 1) for discoverability

**2. `src/components/ui/dialog.tsx`**
- Ensure `DialogOverlay` click propagation closes the dialog (already handled by Radix, but verify no `e.stopPropagation()` interference)
- Add body pointer-events cleanup in `DialogContent` unmount effect — set `document.body.style.pointerEvents = ''` to prevent stuck states

**3. `src/hooks/use-onboarding-flow.ts`**
- Harden the `skip` callback to also call `setIsOpen(false)` explicitly (currently only sets `isSkipped` and `isOpen`)
- No logic changes needed — just ensure `skip()` is idempotent

### Key behavioral guarantees after fix
- X button → closes modal, sets `onboarding_skipped=true` in localStorage
- ESC key → same as X
- Backdrop click → same as X  
- Skip button → same as X
- After any close: `document.body` has no `pointer-events` or `overflow` restrictions
- On refresh: modal stays closed if previously skipped

