

## Full UX Audit: Findings and Fix Plan

### Critical Bugs

**1. Dashboard navigates to wrong project route (`/project/` instead of `/projects/`)**
In `Dashboard.tsx` line 140, `UploadRFP.tsx` line 155, `use-quick-upload.ts` lines 123/143, `use-draft-proposal.ts` line 71, `ProgressiveOnboarding.tsx` line 337, and `FirstRFPWizard.tsx` line 123 — all navigate to `/project/:id` (singular). The actual route is `/projects/:projectId`. There IS a redirect at `/project/:projectId`, but it causes an unnecessary extra navigation hop and briefly flashes the redirect. All these should navigate directly to `/projects/:id`.

**2. "Features" link (`/#features`) points to nonexistent anchor**
The PublicNavbar and Footer both link to `/#features`, but `Index.tsx` has no element with `id="features"`. The link scrolls nowhere.

### UX Issues

**3. Landing page theme clash with PublicNavbar**
The Index page uses a dark background (`bg-[#1a1a1a]`) but the PublicNavbar uses a light `bg-background` theme. The white navbar on a dark page creates a jarring visual mismatch.

**4. Contact form success state is misleading**
After the `mailto:` opens, the form shows "Our team will get back to you within 24 hours. Check your inbox for a confirmation." — but nothing was actually submitted. The user only opened their email client. If they close it without sending, they still see the success message.

**5. NotFound page assumes authenticated user**
The 404 page's primary CTA is "Return to Dashboard" — but unauthenticated users hitting a bad URL should be directed to `/` (homepage), not `/dashboard` which will redirect them through auth.

**6. `SetInitialAdmin.tsx` is orphaned**
The file exists in `/pages` but is not imported or routed anywhere in `App.tsx`. Dead code.

---

### Implementation Steps

**Step 1: Fix all `/project/` navigations to `/projects/`**
Update 6 files to use the canonical `/projects/:id` route:
- `src/pages/Dashboard.tsx` line 140
- `src/pages/UploadRFP.tsx` line 155
- `src/hooks/use-quick-upload.ts` lines 123, 143
- `src/hooks/use-draft-proposal.ts` line 71
- `src/components/onboarding/ProgressiveOnboarding.tsx` line 337
- `src/components/onboarding/FirstRFPWizard.tsx` line 123

**Step 2: Add `id="features"` to the landing page benefits section**
In `Index.tsx`, add `id="features"` to the benefits grid container (around line 100) so `/#features` links scroll correctly.

**Step 3: Fix landing page navbar theme**
Make the PublicNavbar transparent with white text on the landing page, OR give the Index page's hero a dark navbar override by adding a dark variant class to the PublicNavbar when on `/`.

Simpler approach: Add a transparent/dark mode to PublicNavbar when rendered on the homepage. Use `useLocation` to detect `/` and apply `bg-transparent text-white` instead of the default light theme. Alternatively, change the Index page background to match the rest of the site theme (simpler but loses the dark brand aesthetic).

Recommended: Keep the dark landing page but make the PublicNavbar respect it by conditionally applying transparent background and white text when `pathname === "/"`.

**Step 4: Fix Contact form success messaging**
Change the success toast and card text to be honest: "Your default email client should have opened. If it didn't, you can email us directly at hello@optirfp.ai." Remove the "Check your inbox for a confirmation" line.

**Step 5: Fix NotFound for unauthenticated users**
Import `useAuth` and conditionally show "Return to Dashboard" (authenticated) or "Go to Homepage" (unauthenticated) with the appropriate route.

**Step 6: Delete orphaned `SetInitialAdmin.tsx`**
Remove the unused file.

### Technical Details

- PublicNavbar dark mode: Add `useLocation()`, check `pathname === "/"`, conditionally apply `bg-transparent text-white border-transparent` to the header, and adjust button/link colors.
- Features anchor: Wrap the benefits grid div at line 100 of Index.tsx with `id="features"`.
- Project navigation: Simple find-and-replace of `` `/project/${`` with `` `/projects/${`` across all 6 files.

