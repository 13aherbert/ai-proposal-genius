## Diagnosis

All three export formats (PDF, DOC, DOCX) fail with the same error because the edge function `export-proposal-pdf` queries a column that does not exist on `projects`.

In `supabase/functions/export-proposal-pdf/index.ts` (lines 700–704, 733, 738):
```ts
.from("projects")
.select("project_id, project_name, organization_id")
```
The `projects` table has no `project_name` column — the actual column is `title`. The query throws `42703: column "project_name" does not exist`, the function returns a non-2xx response, and the client shows "Export failed. Please try again." for every format.

The Word/PDF generation logic itself is fine; only the project lookup is broken.

## Fix

Single edge function file, three line changes:

1. Replace the select with `"project_id, title, organization_id"`.
2. Replace `project.project_name || "Proposal"` (line 733) with `project.title || "Proposal"`.
3. Replace `project.project_name || "proposal"` (line 738) with `project.title || "proposal"`.

No client, schema, or RLS changes required. Edge function will redeploy automatically.

## Verification

After the fix, click each Export option (PDF, Word .docx, Word .doc) on the project compiled view and confirm:
- PDF opens print window with rendered proposal
- .docx and .doc download and open in Word/Google Docs
- Starter plan output includes the OptiRFP watermark footer
