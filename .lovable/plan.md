

## Add "Automate Proposal" Button to Project Overview Page

### Current State
- The project overview page renders `ProjectInfoCard` which shows project details and documents
- The `AutomatedProposalCreation` component already exists and is currently only used on the `UploadRFP` page
- It accepts `projectId` and `filePath` props and provides a full automation UI with start/stop/reset controls and progress tracking
- The project object available in the overview contains both `project_id` and `rfp_file_path`

### Plan

**File: `src/components/project/info/ProjectInfoCard.tsx`**

Add the `AutomatedProposalCreation` component below the project details/documents section:

1. Import `AutomatedProposalCreation` from `@/components/project/AutomatedProposalCreation`
2. After the `ProjectDocuments` component (inside the non-editing view), render `AutomatedProposalCreation` with `projectId={project.project_id}` and `filePath={project.rfp_file_path}`
3. Only render it when `project.rfp_file_path` exists (no RFP file = nothing to automate)

This is a single-file change. The automation component already handles its own UI (start/stop buttons, progress bar, step indicators), so no additional UI work is needed.

### Summary

| File | Change |
|------|--------|
| `src/components/project/info/ProjectInfoCard.tsx` | Import and render `AutomatedProposalCreation` below project documents when `rfp_file_path` is available |

