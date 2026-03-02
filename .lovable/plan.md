

## Plan: Display Template Content as Normal Documents

**Problem:** The content is plain text with line breaks, but `EntryContent.tsx` renders it inside a `<div>` that collapses whitespace. Line breaks disappear, making it look like raw markdown.

**Fix:** Add `whitespace-pre-wrap` to the content display `<div>` elements in `EntryContent.tsx` (lines 52 and 71-72) so newlines render as actual line breaks.

**File:** `src/components/knowledge-base/dialog/EntryContent.tsx`
- Line 52: Add `whitespace-pre-wrap` to the file content prose div
- Line 72: Add `whitespace-pre-wrap` to the text content prose div

Single file, two one-line changes.

