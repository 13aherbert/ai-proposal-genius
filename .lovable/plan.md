

## Plan: Visual Progress Indicator for Knowledge Base Page

### Overview
Add a rich progress header card with circular SVG ring, segmented progress bar, and enhanced category sidebar with status indicators. Include milestone celebrations at 50% and 100% completion.

### New Components

**1. `src/components/knowledge-base/KBProgressHeader.tsx`** — Progress card for the header area
- Circular SVG progress ring (80px) showing essential % complete, animated stroke-dashoffset
- Text: "X of 6 essential categories filled" + "Y of 12 total categories complete"
- Segmented progress bar: 12 segments — first 6 colored (essential, green when filled, gray when empty), last 6 lighter (optional/recommended, blue when filled, gray when empty)
- Mobile: sticky at top (`sticky top-0 z-10`), collapsible via Collapsible component
- Replaces the existing completion banner in `KnowledgeBase.tsx`
- Uses `useKnowledgeReadiness` hook for all data

**2. `src/components/knowledge-base/KBMilestones.tsx`** — Milestone celebration logic
- Uses `useEffect` to detect crossing 50% essential threshold → toast "Halfway there! 🎉"
- Detects 100% essential → Dialog modal "Knowledge Base Ready! You can now generate high-quality proposals."
- Detects 100% all categories → toast with "KB Master" badge message
- Uses `localStorage` keys to prevent re-triggering (`kb_milestone_50`, `kb_milestone_100_essential`, `kb_milestone_100_all`)
- `canvas-confetti` on 100% essential milestone

### Modified Components

**3. `src/components/knowledge-base/CategorySidebar.tsx`** — Enhanced with status indicators
- Each category button gets a status icon:
  - Empty (no entries): gray border dot
  - Template only (has entries but all contain "Replace with your content"): yellow dot (`text-amber-500`)
  - Customized (has real content): green checkmark (`text-green-500 CheckCircle`)
- Essential categories get a `Star` icon (h-3 w-3, text-amber-400) next to name
- Optional/recommended get a `Plus` icon (h-3 w-3, text-muted-foreground)
- Tooltip on star: "Essential categories generate better proposals"
- Needs entry data: pass `categoryCoverage` from `useKnowledgeReadiness` as prop, plus raw entries to detect template vs customized

**4. `src/pages/KnowledgeBase.tsx`** — Integration
- Remove the existing completion banner (lines 40-54)
- Add `useKnowledgeReadiness` hook
- Render `<KBProgressHeader>` between seeding banner and header
- Render `<KBMilestones>` (invisible, just handles effects)
- Pass `categoryCoverage` + entries data to `CategorySidebar`

### Technical Details

**Circular Progress Ring SVG:**
- `<circle>` with `stroke-dasharray` = circumference, `stroke-dashoffset` = circumference * (1 - score/100)
- Transition: `transition: stroke-dashoffset 0.5s ease`
- Center text: percentage number

**Segmented Progress Bar:**
- 12 divs in a flex row with 2px gaps
- Each segment: `h-2 flex-1 rounded-full`
- Color logic: essential segments use green-500/gray-200, non-essential use blue-400/gray-200

**Template Detection:**
- Reuse `TEMPLATE_MARKER = "Replace with your content"` pattern from `useKBCompletion`
- Need to fetch `content` field in `useKnowledgeReadiness` (already fetched)

### Files Summary
| File | Action |
|------|--------|
| `src/components/knowledge-base/KBProgressHeader.tsx` | Create |
| `src/components/knowledge-base/KBMilestones.tsx` | Create |
| `src/components/knowledge-base/CategorySidebar.tsx` | Modify — add status dots, star/plus icons, tooltips |
| `src/pages/KnowledgeBase.tsx` | Modify — swap completion banner for new components |
| `src/hooks/use-knowledge-readiness.ts` | Modify — add `templateOnlyCategories` to return value (categories with entries but all template content) |

