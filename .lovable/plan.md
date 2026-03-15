

## Plan: Fix "Add New Entry" Button in Knowledge Base

### Investigation Summary

I reviewed the full flow: `KnowledgeBase.tsx` → `useKnowledgeBase` hook → `AddEntryDialog` → `DialogTrigger` → Radix `Dialog`. The dialog code is structurally correct, so the redirect is likely caused by one of two issues:

1. **Session loss during dialog interaction** — The `ProtectedRoute` wrapper redirects to `/` (which the user perceives as "dashboard") whenever `session` becomes null. If the Supabase session refreshes or briefly nullifies while the dialog is mounting, the redirect fires.

2. **Dialog pointer-events conflict** — The custom `dialog.tsx` has login-modal-specific code (`document.body.style.removeProperty('pointer-events')`, email input auto-focus, `data-testid="login-modal"`) that can conflict with Radix Dialog's own body pointer-events management, potentially preventing the dialog from rendering properly.

### Changes

**1. `src/components/knowledge-base/hooks/useKnowledgeBase.ts`** — Add URL parameter handling so `?action=add` auto-opens the dialog (used by `KnowledgeSetupWizard` but never read). Also read `?category=` param to pre-select category.

**2. `src/components/knowledge-base/AddEntryDialog.tsx`** — Add defensive guard: if dialog fails to render (e.g., session null), show a toast instead of silently failing. Reset form state when dialog opens so stale data doesn't persist.

**3. `src/components/knowledge-base/KnowledgeBase.tsx`** — Add a fallback: if `session` is null when clicking "Add New Entry", show an error toast instead of letting ProtectedRoute silently redirect. Also ensure the button uses `type="button"` explicitly (the DialogTrigger renders a Button which defaults to `type="submit"` inside any parent form context).

**4. `src/components/subscription/UsageProgressBanner.tsx`** — Side fix: update stale tier references on lines 77 ("Basic for 10" / "Pro for 30") to match current Growth/Business naming.

### Files Modified (4)
`useKnowledgeBase.ts`, `AddEntryDialog.tsx`, `KnowledgeBase.tsx`, `UsageProgressBanner.tsx`

