

## Full Mobile Experience Overhaul for Project Editing

This plan addresses every component in the project editing workflow -- from the project header through overview, analysis, proposal, and review sections -- creating a cohesive, thumb-friendly mobile experience.

---

### Changes by File

---

### 1. `src/components/project/details/ProjectHeader.tsx`
- Reduce title font size on mobile: `text-xl sm:text-3xl`
- Add `truncate` to prevent long project titles from wrapping awkwardly
- Make the back button and title vertically centered with proper spacing

### 2. `src/components/project/details/ProjectSidebar.tsx`
- Make mobile tabs sticky at the top of the scroll area (`sticky top-0 z-10`) so users always see navigation
- Add active tab indicator styling (bottom border) for better visibility
- Ensure equal spacing across tabs

### 3. `src/components/project/info/ProjectInfoCard.tsx`
- Stack header buttons vertically on mobile: `flex-col sm:flex-row`
- Make "Automate Proposal" and "Edit Details" buttons full-width on mobile
- Hide button text on very small screens, show icon-only with tooltips
- Reduce CardContent spacing on mobile: `space-y-4 sm:space-y-6`

### 4. `src/components/project/info/ProjectDetails.tsx`
- Change grid from `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` so fields stack vertically on mobile
- Reduce gap: `gap-3 sm:gap-6`
- Truncate long text values to prevent overflow

### 5. `src/components/project/info/ProjectDocuments.tsx`
- Stack header (title + buttons) vertically on mobile: `flex-col sm:flex-row`
- Make "View RFP Document" and "Add Document" buttons full-width on mobile
- Reduce padding on border-top section: `pt-4 sm:pt-6`

### 6. `src/components/project/info/ProjectEditForm.tsx`
- Make save/cancel buttons full-width stacked on mobile: `flex-col sm:flex-row`
- Both buttons get `w-full sm:w-auto`

### 7. `src/components/project/AutomatedProposalCreation.tsx`
- Stack the header (title + Start/Stop/Reset buttons) vertically on mobile
- Make Start/Stop buttons full-width on mobile
- Reduce step card padding on mobile: `p-2 sm:p-3`
- Hide step descriptions on mobile to save space, show only step name and status badge
- Reduce the numbered step circle size on mobile: `w-6 h-6 sm:w-8 sm:h-8`

### 8. `src/components/project/unified-analysis/UnifiedAnalysisView.tsx`
- Add responsive text sizing to tab labels: `text-xs sm:text-sm`
- Reduce `mt-4` to `mt-2 sm:mt-4` on TabsContent for tighter mobile spacing

### 9. `src/components/project/RFPAnalysis.tsx`
- Reduce card title size on mobile: `text-xl sm:text-2xl`
- Stack the "Reset Analysis" and "Analyze Again" buttons full-width on mobile: `flex-col sm:flex-row` with `w-full sm:w-auto`

### 10. `src/components/project/rfp-analysis/AnalysisContent.tsx`
- Reduce section title size on mobile: `text-base sm:text-lg`
- Reduce left padding on content: `pl-4 sm:pl-6`
- Reduce spacing between sections: `space-y-4 sm:space-y-6`

### 11. `src/components/project/proposal-outline/ProposalOutline.tsx`
- Reduce card title size on mobile: `text-xl sm:text-2xl`
- Stack action buttons vertically on mobile with full width
- Reduce markdown prose content padding for mobile readability

### 12. `src/components/project/proposal-evaluation/ProposalEvaluation.tsx`
- Stack header (title + Evaluate/Apply buttons) vertically on mobile: `flex-col sm:flex-row`
- Make evaluate and apply buttons full-width on mobile
- Reduce card title size: `text-xl sm:text-2xl`

### 13. `src/components/project/proposal-evaluation/components/EvaluationContent.tsx`
- Remove fixed `h-[500px]` on ScrollArea -- use `max-h-[60vh] sm:h-[500px]` so it adapts to mobile viewport
- Reduce inner padding on mobile: `p-3 sm:p-6`
- Reduce markdown heading sizes for mobile readability

### 14. `src/components/project/proposal-evaluation/components/ApplySuggestionsButton.tsx`
- Make the trigger button full-width on mobile
- The AlertDialogContent already uses `max-w-lg` which works well on mobile

### 15. `src/components/project/document-viewer/DocumentList.tsx`
- Stack document row content vertically on mobile: file info on top, action buttons below
- Make action buttons smaller on mobile with icon-only variants

---

### Summary

| Area | Key Mobile Change |
|------|-------------------|
| Project Header | Smaller title, truncation |
| Navigation Tabs | Sticky positioning, active indicator |
| Overview Cards | Vertical button stacking, single-column grids |
| Documents | Full-width buttons, stacked layout |
| Edit Form | Full-width save/cancel |
| Automation | Compact step cards, hidden descriptions |
| Analysis Tabs | Smaller text, tighter spacing |
| RFP Summary | Full-width action buttons |
| Proposal Outline | Full-width buttons, compact prose |
| Evaluation | Stacked header, viewport-aware scroll area |
| All Cards | Reduced padding (p-3 on mobile, p-6 on desktop) |

Total files to modify: **15 components**, all with consistent mobile-first responsive patterns.

