

## Fix Markdown Table Rendering in Design Preview

### Problem
`ReactMarkdown` in `TextBlock.tsx` doesn't render markdown tables because it requires the `remark-gfm` plugin (GitHub Flavored Markdown) which isn't installed. Tables in proposal content are silently dropped.

### Changes

1. **Install `remark-gfm`** package
2. **Update `TextBlock.tsx`** -- pass `remarkPlugins={[remarkGfm]}` to `ReactMarkdown` so tables (and strikethrough, task lists, etc.) render correctly
3. **Add table styling** -- add custom `components` prop to `ReactMarkdown` mapping `table`, `thead`, `tr`, `th`, `td` to styled elements that match the design settings (primary color header, alternating row shading) -- consistent with `TableBlock` preview styling
4. **Update `export-proposal-pdf/index.ts`** -- ensure the edge function's `text` block HTML rendering also parses markdown tables (add simple regex-based markdown table → HTML conversion since the edge function can't use npm packages)

