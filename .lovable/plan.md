

## Auto-Generate Missing Categories from Existing Knowledge Base Content

### The Problem
Your audit shows "Missing Essential Categories" like Team Bios, Technical Capabilities, and Differentiators -- but the information for those categories already exists scattered across other documents you've uploaded. The system currently doesn't offer a way to extract and reorganize that content into the proper category slots.

### The Solution
Add an "Auto-Fill Gaps" feature to the Knowledge Base Audit card. When the audit identifies missing essential categories, a new button will let you automatically generate entries for those gaps by having the AI scan all your existing entries and extract the relevant information into properly categorized entries.

### How It Will Work (User Experience)
1. Run the audit as usual -- it shows missing essential categories (e.g., "Team Bios & Qualifications")
2. A new "Auto-Fill Gaps" button appears next to the missing categories
3. Click it, and the system reads all your existing entries, sends them to the AI, and asks it to extract and compose a proper entry for each missing category
4. New entries are created and saved automatically in the correct categories
5. The audit re-runs to show updated readiness score

### Technical Details

**1. New Edge Function: `supabase/functions/auto-fill-knowledge-gaps/index.ts`**
- Accepts `organizationId`, `gapCategories` (array of missing category names), and `industry`
- Authenticates the user via the Authorization header
- Fetches ALL existing knowledge entries for the organization (full content, not truncated)
- For each gap category, calls Claude with a specialized prompt:
  - Provides all existing entry content as context
  - Instructs the AI to extract and synthesize information relevant to the target category
  - If insufficient information exists, the AI generates a structured template with placeholders the user can fill in
- Inserts the generated entries into `knowledge_entries` with the correct category and organization

**2. New Prompt File: `supabase/functions/auto-fill-knowledge-gaps/prompt.ts`**
- Specialized prompt that differs from the standard generation prompt:
  - Focus is on extraction and reorganization, not generic content creation
  - Instructs the AI to pull real data (names, qualifications, capabilities) from existing entries
  - Marks sections where data was found vs. where the user needs to add more detail

**3. Update Edge Function Config: `supabase/config.toml`**
- Register the new `auto-fill-knowledge-gaps` function with `verify_jwt = false`

**4. Update Frontend: `src/components/knowledge-base/KnowledgeBaseAudit.tsx`**
- Add an "Auto-Fill Gaps" button that appears when `essentialGaps.length > 0`
- Button triggers the new edge function with the list of gap categories
- Shows progress indicator during generation (may take 30-60 seconds for multiple categories)
- After completion, re-runs the audit analysis and shows a toast with results
- Triggers a page refresh/refetch so the new entries appear in the knowledge base list

**5. Update `src/pages/KnowledgeBase.tsx`** (if needed)
- Ensure the knowledge base entry list refreshes after auto-fill completes

### Content Size Management
- The auto-fill function will use a higher context limit (up to 30,000 characters) since extraction quality depends on seeing more content
- Entries will be prioritized by content length (richer entries first)
- Each gap category will be processed sequentially to avoid API rate limits

### What the AI Will Produce
For each missing category, the AI will generate an entry like:

**Example -- "Team Bios & Qualifications" (extracted from existing docs):**
- Pulls actual team member names, titles, and qualifications mentioned across all entries
- Organizes them into a structured team bio format
- Flags sections where more detail is needed (e.g., "[Add years of experience for Jane Smith]")

