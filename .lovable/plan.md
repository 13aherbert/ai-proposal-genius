

## Fix: Auto-Fill Gaps Failing Due to Database Constraint Violation

### Root Cause

The `knowledge_entries` table has a CHECK constraint that only allows these values for `migration_status`:
- `NULL`
- `'pending'`
- `'migrated'`
- `'reviewed'`

The edge function is inserting `migration_status: 'auto_generated'` -- a value **not in the allowed list**. This causes every insert to fail with the error:

```
new row for relation "knowledge_entries" violates check constraint "knowledge_entries_migration_status_check"
```

All 3 gap categories (Team Bios, Technical Capabilities, Differentiators) failed for this exact reason. The AI generation itself succeeded -- the entries simply couldn't be saved.

### Fix (Simple, One-Line Change)

**File: `supabase/functions/auto-fill-knowledge-gaps/index.ts`** (line 158)

Change `migration_status: 'auto_generated'` to `migration_status: 'reviewed'`

Using `'reviewed'` is the correct semantic choice because:
- The entry is AI-generated from existing content and ready for use
- It won't appear in the "needs migration" or "needs review" audit queues
- It matches the existing workflow where reviewed = finalized content

### Redeployment

Redeploy the `auto-fill-knowledge-gaps` edge function after the change.

### Verification

1. Go to the Knowledge Base Audit section
2. Click "Auto-Fill Gaps"
3. Confirm entries are created successfully for all missing categories
4. Check that the new entries contain extracted data from your existing documents (e.g., team member names from the RFP resumes)

