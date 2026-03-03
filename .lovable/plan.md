

## Plan: Exit-Intent Modal for OptiRFP Homepage

### New Files

**1. `src/hooks/use-exit-intent.ts`**
- State: `showModal`, `hasTriggered` (session-scoped)
- On mount, check suppression: `localStorage` keys `optirfp_signed_up`, `optirfp_exit_dismissed` (7-day TTL)
- After 30s timeout + cursor movement detected, attach listeners:
  - `document.addEventListener('mouseleave')` — trigger if `e.clientY < 10`
  - `window.addEventListener('scroll')` — track scroll velocity, trigger if upward scroll > 500px in < 200ms
- Expose: `showModal`, `dismiss()` (sets localStorage timestamp), `close()`, `signUp()` (sets `optirfp_signed_up`)
- No trigger if `session` exists (passed as param or checked internally)

**2. `src/components/blocks/ExitIntentModal.tsx`**
- Desktop: `Dialog` with `sm:max-w-md`, Gift icon, headline ("Wait! Don't miss out on 3 months free"), 3 value prop bullets with Check icons, "Start Free Trial" button (opens signup Dialog or navigates), "Maybe Later" ghost button
- Mobile: Use `Sheet` from vaul (bottom drawer) instead of centered Dialog
- Analytics: fire `exit_intent_shown` on open, `exit_intent_signup_clicked`, `exit_intent_dismissed`, `exit_intent_closed` via existing `useAnalytics().trackEvent()`
- "Start Free Trial" click: dismiss modal, open signup dialog (controlled state) or set a callback

### Modified Files

**3. `src/pages/Index.tsx`**
- Import `useExitIntent` and `ExitIntentModal`
- Import `useAuth` from `AuthProvider` — pass `session` to hook so it won't trigger for logged-in users
- Add state `signupOpen` for a controlled signup Dialog triggered by exit-intent CTA
- Render `<ExitIntentModal>` and a controlled `<Dialog open={signupOpen}>` with `AuthForm` for signup

### Technical Details
- Scroll velocity: store `lastScrollY` and `lastScrollTime`, compare delta on each scroll event
- Cursor movement: set a `hasMoved` flag on first `mousemove` event to filter bots
- Session check via `useAuth()` — if `session` exists, hook returns `showModal: false` and skips all listeners
- All localStorage keys prefixed with `optirfp_`

| File | Action |
|------|--------|
| `src/hooks/use-exit-intent.ts` | Create |
| `src/components/blocks/ExitIntentModal.tsx` | Create |
| `src/pages/Index.tsx` | Modify — add hook + modal |

