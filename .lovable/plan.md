

## Plan: Remove Markdown from Template Content

**Single change** in `src/components/knowledge-base/hooks/useStarterTemplates.ts`:

Replace all 6 occurrences of `*${TEMPLATE_MARKER}*` with just `${TEMPLATE_MARKER}` (removing the asterisk/italic markdown wrappers) on lines 12, 45, 82, 108, 143, and 185.

No other files need changes.

