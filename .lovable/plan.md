

## Streamline the Dashboard UI

### Current Problems

1. **Redundant information layers**: The dashboard stacks too many components vertically -- DashboardHeader (green banner with welcome + action buttons), then conditionally SegmentedWelcome (another welcome card with recommendations), then FeatureSpotlight (yet another card), then KnowledgeBaseReadiness (full-width warning), then Quick Actions grid, then Recent Activity, plus a sidebar with a compact KnowledgeBaseReadiness AND OnboardingProgress. For a returning user, this is overwhelming.

2. **DashboardHeader is bulky**: A full-width green banner card with welcome text, plan badge, and icon buttons (Report Issue, Docs, Settings) that duplicate what the Navbar already provides (Account, Sign Out, nav links). The action buttons (Report Issue, Docs, Settings) are utility-level items that belong in a menu or the Navbar, not front-and-center on the dashboard.

3. **Duplicate quick actions**: The Navbar already links to Dashboard, Projects, Upload RFP, Find Opportunities, and Knowledge Base. The Quick Action cards duplicate most of these same links in a heavier format.

4. **Sidebar clutter at odd offset**: The right sidebar has `lg:mt-32` (128px top margin), which creates an awkward visual gap. It holds a compact KB readiness card (already hidden when complete) and OnboardingProgress (hidden when all steps are done), meaning for established users the sidebar is completely empty but still takes up grid space.

5. **Two separate dashboard branches**: Solo users and team/enterprise users get nearly identical layouts with duplicated JSX. This makes maintenance harder and creates inconsistencies.

6. **RecentActivityList styling mismatch**: Activity items use `hover:bg-black/40` and `text-white` classes which assume a dark background, but they render inside a default light-background section -- creating contrast issues.

### Proposed Changes

#### 1. Simplify DashboardHeader into a lightweight welcome bar
- Replace the full-width green banner card with a slim inline header
- Show just the welcome greeting and plan badge on the left
- Move the Admin Dashboard button to the right (keep it prominent for admins)
- Remove the Report Issue, Docs, and Settings icon buttons -- these are already accessible via Navbar ("Account") or can be consolidated into a user menu
- File: `src/components/dashboard/DashboardHeader.tsx`, `src/components/dashboard/ActionButtons.tsx`, `src/components/dashboard/WelcomeMessage.tsx`

#### 2. Consolidate to a single dashboard layout (remove solo/team split)
- Merge both return blocks in Dashboard.tsx into one unified layout
- Use conditional rendering within a single layout for enterprise-specific cards
- Eliminates ~80 lines of duplicated JSX
- File: `src/pages/Dashboard.tsx`

#### 3. Remove redundant onboarding widgets for established users
- Hide SegmentedWelcome entirely for users who have projects OR knowledge entries (currently shows for all new users even after they start working)
- FeatureSpotlight already self-dismisses via localStorage -- no change needed
- OnboardingProgress already hides when complete -- no change needed
- Keep KnowledgeBaseReadiness only in the sidebar (compact version), remove the full-width version to reduce vertical sprawl
- File: `src/pages/Dashboard.tsx`

#### 4. Clean up the grid layout
- Remove the `lg:mt-32` offset on the sidebar -- align it naturally with the content
- When sidebar widgets are all hidden (established user), collapse to a simpler full-width layout using conditional grid classes
- File: `src/pages/Dashboard.tsx`

#### 5. Fix RecentActivityList contrast
- Replace `hover:bg-black/40` with `hover:bg-muted/50` and `text-white` with `text-foreground` so it works on both light and dark backgrounds
- File: `src/components/dashboard/RecentActivityList.tsx`

#### 6. Streamline Quick Actions
- Make the Upload RFP zone visually smaller (reduce padding from `p-6` to `p-4`) to match the height of the other Quick Action cards
- Keep only 3-4 action cards: Upload RFP, Projects, Knowledge Base, and conditionally Find Opportunities
- Remove the "Manage Organization" card (already in Navbar for enterprise users)
- File: `src/components/dashboard/QuickUploadZone.tsx`, `src/pages/Dashboard.tsx`

### Result for Established Users
The dashboard will show:
1. Navbar (sticky, already exists)
2. A slim welcome line with plan badge
3. 3-4 Quick Action cards in a clean grid
4. Recent Activity list
5. Sidebar with OnboardingProgress (only if incomplete)

### Result for New Users
Same as above, plus:
- SegmentedWelcome card (only until they create their first project or KB entry)
- KnowledgeBaseReadiness in sidebar (only until essentials are complete)
- KnowledgeSetupWizard dialog (only if KB is empty and hasn't been dismissed)

### Technical Summary

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardHeader.tsx` | Replace green banner with slim inline header |
| `src/components/dashboard/ActionButtons.tsx` | Keep only Admin button, remove utility icons |
| `src/components/dashboard/WelcomeMessage.tsx` | Simplify to inline text (no card wrapper) |
| `src/components/dashboard/RecentActivityList.tsx` | Fix contrast classes for theme compatibility |
| `src/components/dashboard/QuickUploadZone.tsx` | Reduce padding for consistent card heights |
| `src/pages/Dashboard.tsx` | Merge solo/team layouts, remove full-width KB readiness, remove sidebar offset, remove Manage Organization card, tighten conditional rendering |

