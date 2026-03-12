

## Plan: Project Creation Gate for Free Plan Limit

### Approach
Instead of just disabling the "New Project" button (current behavior), intercept the click and show an upgrade modal with plan comparison when at limit. Also gate the `/upload-rfp` route itself.

### New Component: `src/components/subscription/UpgradeGateModal.tsx`
- Dialog with `max-w-2xl` for side-by-side plan comparison
- **Left column** (Current — Starter): 3 projects, basic AI analysis, community support — greyed/muted styling
- **Right column** (Recommended — Basic): 10 projects, enhanced AI, email support, priority processing — highlighted with border
- Headline: "You've reached your free plan limit"
- Subheadline: "Your Free Plan includes 3 projects. Upgrade to unlock more."
- Social proof line: "Most users save 20+ hours/month"
- CTA: "Upgrade to Basic — $49/month" → navigates to `/subscription`
- Secondary: "See all plans" → navigates to `/subscription`
- Tertiary: "Maybe later" → dismisses
- Alternative: "Or archive an existing project to free up a slot" with link to `/projects`
- No countdown timers, no urgency language

### Modify: `src/components/projects/ProjectsToolbar.tsx`
- When `!canCreateProject`, clicking "New Project" opens `UpgradeGateModal` instead of navigating to `/upload-rfp`
- Add state for modal open/close

### Modify: `src/pages/UploadRFP.tsx`
- Add a limit check near the top: if user is at/over limit and no `projectId` yet, redirect back or show the upgrade modal inline
- Prevents direct URL navigation to `/upload-rfp` to bypass the gate

### Files

| File | Action |
|------|--------|
| `src/components/subscription/UpgradeGateModal.tsx` | Create — upgrade modal with plan comparison |
| `src/components/projects/ProjectsToolbar.tsx` | Modify — show modal instead of navigating when at limit |
| `src/pages/UploadRFP.tsx` | Modify — add limit guard at route level |

