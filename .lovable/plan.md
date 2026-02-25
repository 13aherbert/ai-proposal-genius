

## Fix: Use the Correct Primary RFP Document for Proposal Generation

### Problem

When `fetch-opportunity-documents` downloads multiple files from SAM.gov, it blindly picks the **first PDF** as the primary RFP document (`rfp_file_path`). This is often wrong -- SAM.gov attachments can include amendments, cover letters, wage determinations, or other supporting files that happen to be listed before the actual Statement of Work or solicitation document.

The `analyze-rfp` function then reads only that single `rfp_file_path` file, and `generate-section-content` uses the resulting `project.analysis` field to guide all content generation. If the wrong file was chosen as primary, the entire proposal is based on the wrong document.

### Root Cause Chain

1. **`fetch-opportunity-documents`**: Uses "first PDF found" heuristic to set `primaryFilePath`. No intelligence about which file is the actual RFP/SOW.
2. **`analyze-rfp`**: Only reads the single file at `project.rfp_file_path`. Ignores all other `project_documents`.
3. **`generate-section-content`**: Relies entirely on `project.analysis` (derived from the single primary file) plus knowledge base entries. Never reads the actual RFP documents directly.

### Solution

Modify `analyze-rfp` to read **all** project documents, use AI to classify which is the primary RFP/SOW, and incorporate supporting documents as supplementary context.

### Implementation Plan

#### 1. Smarter primary file selection in `fetch-opportunity-documents`

**File:** `supabase/functions/fetch-opportunity-documents/index.ts`

After downloading all files, apply filename-based heuristics to pick a better primary file before falling back to "first PDF":

- Score each filename for RFP-indicator keywords: `solicitation`, `sow`, `statement of work`, `rfp`, `rfq`, `performance work statement`, `pws`, `combined synopsis`
- Penalize filenames containing: `amendment`, `modification`, `wage determination`, `sf-`, `sf1449`, `attachment`, `addendum`
- Select the highest-scoring PDF as `primaryFilePath`
- If all scores are equal, fall back to the largest PDF (most likely the main document)

This is a lightweight heuristic that runs without any AI calls.

#### 2. Multi-document analysis in `analyze-rfp`

**File:** `supabase/functions/analyze-rfp/index.ts`

Currently the function reads only `requestData.filePath`. Change it to:

1. Accept an optional `allDocumentPaths` array parameter alongside the existing `filePath`
2. If `allDocumentPaths` is not provided, query the `project_documents` table for all documents belonging to this project
3. Download and extract text from **all** project documents (up to a reasonable limit, e.g., 5 files)
4. Prepend each document's text with a header: `--- DOCUMENT: {filename} (type: {document_type}) ---`
5. Send the combined text to the AI with an enhanced system prompt that instructs it to:
   - Identify which document is the primary RFP/solicitation/SOW
   - Use that document as the primary source for the analysis
   - Reference supporting documents (amendments, attachments) for supplementary context
   - Note in the analysis which document was identified as the primary RFP
6. After the AI identifies the primary document, update `projects.rfp_file_path` to point to the correct file if it differs from the current value

The enhanced system prompt addition:
```
You will receive multiple documents from this opportunity. First, identify which document 
is the PRIMARY RFP, solicitation, or Statement of Work. Base your analysis primarily on 
that document. Use other documents (amendments, wage determinations, forms) as 
supplementary context only. State which document you identified as the primary RFP 
at the start of your analysis.
```

#### 3. Pass document context to content generation

**File:** `supabase/functions/generate-section-content/index.ts`

Currently this function only uses `project.analysis` (a text summary) for RFP context. Enhance it to:

1. Query `project_documents` for the project
2. Download and extract text from the primary RFP document (the one at `project.rfp_file_path`)
3. Include the actual RFP text (processed/truncated) in the prompt alongside the analysis summary and knowledge base content

This ensures content generation references the actual RFP requirements, not just the AI's summary of them.

Changes:
- After fetching the project, query `project_documents` where `document_type = 'rfp'`
- Download the primary file from storage using the same `extractTextFromFile` logic (extract this into a shared utility or inline it)
- Add the processed RFP text to the prompt context under a `PRIMARY RFP DOCUMENT:` header
- Truncate to ~20,000 characters to stay within token limits alongside knowledge base content

#### 4. Update the automation hook to pass all document paths

**File:** `src/hooks/use-automated-proposal-creation.ts`

When calling `analyze-rfp`, also pass the list of all project document paths so the analysis function can process them all. Query `project_documents` for the project before invoking the edge function.

### Summary

| File | Change |
|------|--------|
| `fetch-opportunity-documents/index.ts` | Add filename-based scoring to select the best primary RFP file instead of "first PDF" |
| `analyze-rfp/index.ts` | Read all project documents, use AI to identify the true primary RFP, update `rfp_file_path` if needed |
| `generate-section-content/index.ts` | Include actual RFP document text in the content generation prompt |
| `use-automated-proposal-creation.ts` | Pass all document paths when invoking analysis |

### Edge Cases
- **Single document**: Behaves exactly as today -- no change in behavior
- **No PDFs (only .txt description)**: Still uses the description text as primary; no regression
- **Very large combined documents**: The existing `processRFPContent` intelligent truncation handles this; the multi-doc approach caps at 5 files and applies the same token limits
- **AI misidentifies the primary document**: The filename heuristic acts as a first pass; the AI classification is a second pass that can correct it. The original file is never deleted, only the `rfp_file_path` pointer changes

