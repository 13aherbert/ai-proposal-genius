

## Plan: Enhanced Knowledge Base Starter Templates

### What exists now
- `useStarterTemplates.ts` already seeds 6 entries with basic placeholder content when KB is empty
- Progress bar shows during seeding in `KnowledgeBase.tsx`
- Categories match the 6 essential categories in `categories.tsx`

### Changes

#### 1. Enrich template content with user profile data
**File:** `src/components/knowledge-base/hooks/useStarterTemplates.ts`
- Fetch user profile (`business_name`, `industry`) before seeding
- Replace current short markdown templates with the detailed content from the request (Company Overview with mission/capabilities/contact sections, Key Personnel with qualifications/projects, Past Performance with scope/results, Technical Capabilities with competencies/certifications, Pricing & Rates with rate schedules/payment terms, Why Choose Us with differentiators/value proposition)
- Interpolate `companyName` and `industry` from profile data, falling back to `[Your Company Name]` / `[Your Industry]`

#### 2. Add template badge to entry list
**File:** `src/components/knowledge-base/entries/EntryList.tsx`
- Detect template entries by checking if content contains `"Replace with your content"` or similar marker text
- Show a yellow "TEMPLATE" badge above the title for such entries
- Add a subtle yellow-tinted left border for visual distinction

#### 3. Add KB completion progress tracker
**File:** `src/pages/KnowledgeBase.tsx`
- Add a persistent progress section showing "X of 6 essential categories completed"
- Query `knowledge_entries` to check which of the 6 essential categories have non-template content (content that no longer contains the placeholder markers)
- Include a tip: "Replace template content with your actual company information for better proposals"
- Hide once all 6 are completed with real content

#### 4. Update entry list to pass content info
**File:** `src/components/knowledge-base/entries/useEntries.ts`
- Include a `content` snippet in the formatted entries so EntryList can detect template status
**File:** `src/components/knowledge-base/types.ts`
- Add optional `isTemplate` field to `KnowledgeEntry` type

### Technical Details

| Change | File(s) |
|--------|---------|
| Rich template content with profile personalization | `useStarterTemplates.ts` |
| Template badge + visual styling | `EntryList.tsx` |
| Completion progress indicator | `KnowledgeBase.tsx` |
| Pass template detection data | `useEntries.ts`, `types.ts` |

No database changes needed -- the existing `knowledge_entries` table and `content` column support the richer templates. Template detection is content-based (checking for placeholder markers) rather than requiring a new DB column.

