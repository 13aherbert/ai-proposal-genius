## Diagnosis

The upload fails at `supabase.storage.from('rfp-files').upload(fileName, file)` in `src/hooks/use-rfp-upload.ts` (`handleFileUpload`).

The `rfp-files` bucket RLS policy (see `supabase/storage.sql`) requires every uploaded object's path to be:

```
{organizationId}/{userId}/{filename}
```

…and enforces:
- `storage_user_in_org(folder[1])` — the first folder must be an org the user belongs to
- `folder[2] = auth.uid()` — the second folder must be the current user's id

Today's code uploads to a flat path: `` `${timestamp}-${randomId}-${file.name}` ``. That has no org folder and no user folder, so the INSERT policy rejects it with "new row violates row-level security policy".

`useQuickUpload` has a similar bug — it uploads to `${user.id}/${fileName}` (missing the org prefix), so it would fail the same RLS check.

## Fix

1. **`src/hooks/use-rfp-upload.ts` — `handleFileUpload`**
   - Fetch the user's `current_organization_id` from `profiles` *before* the storage upload (currently it's fetched after).
   - Build the storage key as `` `${organizationId}/${session.user.id}/${timestamp}-${randomId}-${safeFileName}` ``.
   - Upload using that path; store the same path in `projects.rfp_file_path` so downstream readers continue to work (they already read via the same RLS-protected bucket).
   - Sanitize `file.name` (strip `/` and other path separators) to prevent accidental extra folder segments.

2. **`src/hooks/use-quick-upload.ts` — `uploadAndCreate`**
   - Change `filePath` from `` `${session.user.id}/${fileName}` `` to `` `${organization.id}/${session.user.id}/${fileName}` `` so it matches the same RLS policy.

3. **No database / RLS changes.** The policy is correct; only the client paths are wrong.

4. **Verification**
   - Upload a new RFP from `/upload-rfp` → succeeds, project row created, file viewable.
   - Quick upload modal also succeeds.
   - Existing projects (with legacy flat paths) keep working for users still in the same org because the SELECT policy only checks the first folder; legacy rows won't break reads that already happen via signed URLs / service role in edge functions, but new uploads will use the compliant path. (No migration of old paths needed for this fix.)

## Files touched

- `src/hooks/use-rfp-upload.ts`
- `src/hooks/use-quick-upload.ts`
