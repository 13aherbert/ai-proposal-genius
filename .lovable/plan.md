

## Plan: 6-Step Progressive Onboarding Flow

### Overview
Replace the current `OnboardingRouter` (which shows a single static welcome card) with a multi-step wizard dialog that guides users through profile setup, knowledge base intro, and first RFP upload. Add a dashboard resume banner for users who skip.

### Architecture
- **New component**: `src/components/onboarding/ProgressiveOnboarding.tsx` — The 6-step wizard (Dialog-based, full-screen overlay)
- **New hook**: `src/hooks/use-onboarding-flow.ts` — State management for step tracking, localStorage persistence of progress, skip/complete status
- **Modified**: `src/pages/Dashboard.tsx` — Show the wizard for new users who haven't completed/skipped it; show resume banner if skipped
- **Modified**: `src/components/auth/onboarding/OnboardingRouter.tsx` — Instead of showing static welcome cards, redirect to `/dashboard` where the wizard triggers
- **New component**: `src/components/onboarding/OnboardingResumeBanner.tsx` — Dashboard banner for skipped users

### Step-by-Step Implementation

**Step 1 — Welcome Modal**
- Full-width dialog with heading, subtext, 6-dot progress indicator
- "Start Setup" (advances to step 2) / "Skip for now" (closes, sets `onboarding_skipped` in localStorage)

**Step 2 — Quick Profile**
- Industry dropdown (reuse existing `Industry` type from `IndustrySelector.tsx`)
- RFP frequency select (`1-5`, `6-10`, `11-20`, `20+`)
- On continue: save to profile via Supabase update

**Step 3 — Knowledge Base Tour**
- Static informational step showing 3 essential categories (Company Overview, Past Performance, Team Bios)
- Show completion indicator from `useKnowledgeReadiness` hook
- "0 of 3 essentials completed" badge

**Step 4 — First RFP Upload**
- Reuse `react-dropzone` pattern from `QuickUploadModal`
- Add 3 "Try sample RFP" buttons (sample names, no actual files — clicking triggers a toast explaining samples are coming soon, or creates a demo project)
- "Generate Proposal" button triggers upload via `useQuickUpload`

**Step 5 — AI Generating**
- Animated checklist with 3 items, each completing sequentially with delays
- Spinner on current item, checkmark on completed
- "This takes 2-3 minutes" note
- Auto-advances to step 6 when upload completes (or after simulated delay if using sample)

**Step 6 — Success Celebration**
- `canvas-confetti` trigger (already installed)
- Stats display with timer and hours-saved estimate
- Preview placeholder for first 3 proposal sections
- "Edit & Export" navigates to project; "Create Another" navigates to `/upload-rfp`

### Resume Banner (`OnboardingResumeBanner.tsx`)
- Shown on Dashboard when `onboarding_skipped === true` and `onboarding_completed !== true` in localStorage
- Shows progress dots for which steps were completed
- "Resume Setup" button reopens the wizard at the last incomplete step
- Dismissible (sets `onboarding_banner_dismissed`)

### Hook: `use-onboarding-flow.ts`
```text
State: currentStep (1-6), isOpen, isSkipped, isCompleted
Persistence: localStorage keys (onboarding_step, onboarding_skipped, onboarding_completed)
Methods: next(), back(), skip(), complete(), resume()
```

### Dashboard Integration
- In `Dashboard.tsx`, after the `DashboardHeader`, check: if new user (< 24h) and not completed/skipped → auto-open `ProgressiveOnboarding`
- If skipped and not dismissed → show `OnboardingResumeBanner` above quick actions

### Technical Details
- All 6 steps live in a single Dialog component with conditional rendering per step
- Steps 4-5 integrate with `useQuickUpload` hook for real file uploads
- Step 2 saves profile data via `supabase.from('profiles').update()`
- Confetti uses existing `canvas-confetti` package
- Progress dots: 6 circles, filled = completed, outlined = current/future
- No new routes needed — wizard is a Dialog overlay on `/dashboard`

### Files Summary
| File | Action |
|------|--------|
| `src/components/onboarding/ProgressiveOnboarding.tsx` | Create |
| `src/components/onboarding/OnboardingResumeBanner.tsx` | Create |
| `src/hooks/use-onboarding-flow.ts` | Create |
| `src/pages/Dashboard.tsx` | Modify — add wizard + banner |
| `src/components/auth/onboarding/OnboardingRouter.tsx` | Modify — redirect to dashboard |

