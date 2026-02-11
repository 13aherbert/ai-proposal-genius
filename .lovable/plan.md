

## UX Friction Audit: Account Setup to Proposal to Subscription

### Friction Points Identified

---

### 1. New User Signup Redirects to Subscription Page (Major Friction)

**Problem**: In `AuthProvider.tsx` (line 307), new users are immediately redirected to `/subscription` after signing up. But the `OnboardingRouter` in `AuthForm.tsx` already shows a welcome/onboarding screen. These two flows conflict -- the subscription redirect wins because it fires first in the auth state change handler, meaning the onboarding welcome screen is never seen.

Worse, the Subscription page auto-redirects active users back to `/dashboard` (line 70 of `Subscription.tsx`), creating a confusing redirect loop for free Starter users.

**Fix**: Remove the new-user redirect to `/subscription`. Instead, send new users directly to `/dashboard` where the onboarding widgets (SegmentedWelcome, OnboardingProgress, KnowledgeSetupWizard) are already built to guide them. The free Starter plan should be auto-created during signup, not require visiting a subscription page.

---

### 2. Two Competing Upload Flows (Confusing)

**Problem**: The dashboard has a `QuickUploadZone` that opens a `QuickUploadModal`, and there is also a dedicated `/upload-rfp` page with a completely separate upload flow (`useRFPUpload` hook). The two use different storage buckets (`rfp_documents` vs `rfp-files`), different file naming strategies, and different post-upload behaviors.

- Quick Upload: uploads to `rfp_documents` bucket, navigates to project page if auto-generate is on
- Upload RFP page: uploads to `rfp-files` bucket, stays on page and shows AutomatedProposalCreation component

**Fix**: Consolidate to a single upload flow. The QuickUploadZone on the dashboard should use the same bucket and logic as the main upload. After upload, always navigate to the project details page. Remove the "New Project" button that goes to `/upload-rfp` and instead make the dashboard QuickUploadZone the primary entry point, or redirect the `/upload-rfp` page to use the same hook.

---

### 3. "Update Project" Button After Upload is Unnecessary (Extra Click)

**Problem**: On the `/upload-rfp` page, after an RFP is uploaded, the user sees a `ProjectForm` with a separate "Update Project" button to save metadata (title, client name, deadline). The RFP analysis already auto-extracts this metadata. Having a manual form with a separate save button is an extra step.

**Fix**: Auto-populate the project metadata from the RFP analysis (which already happens). Remove the manual "Update Project" button. If the user wants to change metadata, they can do so from the Project Overview page. The upload page should focus solely on upload and automation.

---

### 4. "Start Full Automation" Button is Redundant (Extra Click)

**Problem**: On the `/upload-rfp` page (line 254-262), after upload there is a "Start Full Automation" button even though the auto-generate toggle defaults to ON and the `useEffect` (line 84-113) already auto-starts automation. The button is redundant for the default flow and adds visual clutter.

**Fix**: Remove the separate "Start Full Automation" button. The auto-generate toggle already handles this. If a user toggles auto-generate off, they can start automation from the project details page.

---

### 5. Subscription Page Shows "Update Payment Method" for Free Users (Confusing)

**Problem**: The `DefaultView.tsx` for the subscription page always shows an "Update Payment Method" button at the top, even for free Starter users who have no payment method to update.

**Fix**: Only show the "Update Payment Method" button if the user has an active paid subscription (has a `stripe_customer_id`).

---

### 6. Landing Page Pricing Buttons Don't Work Properly (Dead End)

**Problem**: The `pricing-demo.tsx` has `href: "/signup"` for the Starter plan button, but there is no `/signup` route. The app uses `/` with a dialog for auth. The Basic and Pro buttons link to `/subscription` which requires authentication. Unauthenticated users clicking these will be redirected to login with no context about what they were trying to do.

**Fix**: Change all pricing buttons to open the signup dialog directly, passing context about which plan they selected. After signup, redirect them to the subscription page with the plan pre-selected.

---

### 7. Session Timeout at 3 Seconds is Too Aggressive (Friction)

**Problem**: In `ProtectedRoute.tsx` (line 44), a "timeout" message appears after just 3 seconds of loading. This is too aggressive for users on slower connections and creates unnecessary anxiety.

**Fix**: Increase the timeout threshold to 8 seconds before showing the timeout message.

---

### 8. Quick Upload Uses Different Storage Bucket (Bug)

**Problem**: The `useQuickUpload` hook uploads to `rfp_documents` bucket while `useRFPUpload` uploads to `rfp-files` bucket. Downstream functions (like `analyze-rfp`) likely expect files in one specific bucket, meaning one of these flows will fail when trying to analyze the RFP.

**Fix**: Standardize on a single storage bucket across all upload flows.

---

### 9. No "View Project" Navigation After Quick Upload Without Auto-Generate (Dead End)

**Problem**: In `QuickUploadModal.tsx`, when `autoGenerate` is ON, it auto-navigates to the project page. But when `autoGenerate` is OFF, the "View Project" button only appears in the `complete` step (line 211-215), and the modal might close before the user clicks it.

**Fix**: After upload completes with auto-generate off, always navigate to the project page automatically with a brief delay, or keep the modal open until the user explicitly navigates.

---

### 10. Dashboard Layout Overflow Issue

**Problem**: In `Dashboard.tsx` (lines 160, 247), the quick action cards container uses `w-screen` which causes horizontal overflow since it ignores container padding. This pushes content beyond the viewport.

**Fix**: Replace `w-screen` with `w-full` to respect the parent container bounds.

---

### Implementation Plan

**File changes:**

1. **`src/components/AuthProvider.tsx`** -- Remove new-user redirect to `/subscription`. Redirect all signed-in users to `/dashboard`.

2. **`src/hooks/use-quick-upload.ts`** -- Change storage bucket from `rfp_documents` to `rfp-files` to match the main upload flow.

3. **`src/pages/UploadRFP.tsx`** -- Remove the "Start Full Automation" button (redundant with auto-start). Simplify the page to upload + auto-start only.

4. **`src/components/subscription/DefaultView.tsx`** -- Conditionally show "Update Payment Method" only for paid subscribers.

5. **`src/components/blocks/pricing-demo.tsx`** -- Fix Starter plan href from `/signup` to open the auth dialog.

6. **`src/components/ProtectedRoute.tsx`** -- Increase timeout threshold from 3 to 8 seconds.

7. **`src/pages/Dashboard.tsx`** -- Fix `w-screen` to `w-full` on quick action containers (lines 160, 247).

8. **`src/components/rfp/QuickUploadModal.tsx`** -- Auto-navigate to project page after upload completes (regardless of auto-generate setting).

