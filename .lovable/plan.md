

## Plan: First-RFP Upload Wizard (3-Step)

### Overview
Create a `FirstRFPWizard` dialog component with 3 steps (Welcome → Upload → Processing/Success) that triggers for new users who haven't uploaded their first RFP. Integrates with the existing `useRFPUpload` hook for real file processing and navigates to the created project on completion.

### New File: `src/components/onboarding/FirstRFPWizard.tsx`

A dialog-based wizard with internal state machine (`step`: welcome → upload → processing, plus `isComplete` for success screen):

- **Step 1 — Welcome**: Hero illustration, "Let's create your first proposal" copy, "Get Started" primary CTA, "Skip for now" ghost link
- **Step 2 — Upload**: Drag-and-drop zone (reusing patterns from `UploadDropzone`), file input for PDF/DOCX/TXT, plus 3 sample RFP cards (IT Services, Construction, Consulting) as click-to-select alternatives. "Back" button returns to step 1
- **Step 3 — Processing**: Animated checklist (Analyzing → Matching KB → Drafting → Formatting) with a `Progress` bar. For real uploads, hooks into `useRFPUpload`'s `uploadProgress`. For sample selections, simulates progress over ~6 seconds
- **Success Screen**: Confetti burst, "Your first proposal is ready!" heading, stats cards (time generated, time saved), "Edit & Export" primary CTA navigating to `/project/:id`, "Create Another" secondary CTA

Key behaviors:
- Uses `useRFPUpload` hook for actual file upload and project creation
- Sample RFPs trigger navigation to `/upload-rfp?sample=true` (existing route) or create a project with a bundled sample — whichever is simpler given the existing infra
- `localStorage` keys: `optirfp_wizard_skipped`, `optirfp_first_rfp_complete`
- Analytics events via existing `useAnalytics` hook: wizard started/skipped/completed, upload method (file vs sample)

### Modified: `src/pages/Dashboard.tsx`

- Import `FirstRFPWizard`
- Add state `showFirstRFPWizard` initialized from: `!dashboardStats.hasProjects && !localStorage.getItem('optirfp_first_rfp_complete') && !localStorage.getItem('optirfp_wizard_skipped')`
- Render `<FirstRFPWizard open={showFirstRFPWizard} onOpenChange={setShowFirstRFPWizard} />` alongside the existing onboarding components
- Only show when user is not enterprise and has no projects (same condition as `DashboardEmptyState`)

### Modified: `src/components/dashboard/DashboardEmptyState.tsx`

- Wire the "Upload Your First RFP" hero button to open the wizard (via a new `onWizardOpen` prop) instead of the quick upload modal
- Keep the "Try with Sample RFP" link as-is for users who dismiss the wizard

### Files Summary

| File | Action |
|------|--------|
| `src/components/onboarding/FirstRFPWizard.tsx` | Create — 3-step wizard dialog |
| `src/pages/Dashboard.tsx` | Modify — add wizard trigger logic |
| `src/components/dashboard/DashboardEmptyState.tsx` | Modify — wire hero CTA to wizard |

