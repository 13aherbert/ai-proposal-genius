

## Plan: Redesign Dashboard Empty State for New Users

### Overview
Replace the current `SegmentedWelcome` + `FeatureSpotlight` + `QuickActionCard` grid with a new hero-driven empty state and interactive getting started checklist when the user has no projects or knowledge entries (`!isEstablished`).

### New File: `src/components/dashboard/DashboardEmptyState.tsx`

Single component containing both the hero section and the checklist, rendered when `!isEstablished && !isEnterprise`.

**Hero Section:**
- Gradient card (`bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5`, border-0)
- Left column: "AI-Powered" badge with Sparkles icon, "Create your first AI-powered proposal in 3 minutes" headline (text-3xl md:text-4xl), description text, two CTAs — primary "Upload Your First RFP" button (triggers `onUploadClick` callback to reuse existing QuickUpload flow) and outline "Try with Sample RFP" button (navigates to `/upload-rfp` with sample query param)
- Right column (hidden lg:block): Visual illustration showing FileText icon → ArrowDown → CheckCircle icon in a rounded-3xl gradient container
- "Supports PDF, DOCX, and TXT files up to 50MB" helper text

**Process Steps (3-column grid below hero):**
- Upload RFP → AI Analyzes → Get Proposal
- Each in a `Card` with `border-0 shadow-none bg-muted/50`, icon in colored circle, title, description
- Stacks to 1 column on mobile

**Getting Started Checklist:**
- Props: `profileComplete`, `hasKnowledgeEntries`, `knowledgeReadiness` (for essential count)
- 3 items: Complete Profile, Build Knowledge Base, Create First Proposal
- Each item has status (completed/in-progress/pending) with colored left border and status icon
- Completed = green bg + check, In-progress = yellow bg + animated dot, Pending = gray
- Action buttons for incomplete items linking to respective pages
- Completion rewards as badges ("+10% proposal quality", "First win!")
- Header shows "{n} of 3 completed" badge

**Props interface:**
```typescript
interface DashboardEmptyStateProps {
  profileComplete: boolean;
  hasKnowledgeEntries: boolean;
  knowledgeReadiness: { missingEssential: string[]; completedEssential: number };
  onUploadClick: () => void;
}
```

### Modified File: `src/pages/Dashboard.tsx`

- Import `DashboardEmptyState`
- When `!isEstablished && !isEnterprise`: render `<DashboardEmptyState>` instead of `<SegmentedWelcome>`, `<FeatureSpotlight>`, and the quick actions grid
- Pass `profileComplete`, `dashboardStats.hasKnowledgeEntries`, `knowledgeReadiness`, and an `onUploadClick` that opens the QuickUpload modal
- The quick actions grid + recent activity still render for established users (no change to that path)
- Remove the `FeatureSpotlight` render for new users (replaced by the hero) — keep `isNewUser` check but remove that block
- Keep sidebar with `OnboardingProgress` and `KnowledgeBaseReadiness` as-is

### Files Summary

| File | Action |
|------|--------|
| `src/components/dashboard/DashboardEmptyState.tsx` | Create |
| `src/pages/Dashboard.tsx` | Modify — swap SegmentedWelcome/FeatureSpotlight for new empty state |

