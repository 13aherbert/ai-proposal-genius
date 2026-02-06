

## Enhance AI Knowledge Base Generation with Existing Entry Context

### Problem
Currently, when you generate a new knowledge base entry using AI, the system only uses the topic, industry, and category you provide. It has **no awareness** of your existing knowledge base entries -- meaning it can't reference your company's specific terminology, processes, team details, or any other information you've already documented.

### Solution
Update the generation system so that it fetches all existing knowledge base entries for your organization and includes them as context when creating new content. This ensures the AI:

- Uses your company's actual terminology and naming conventions
- References existing processes and procedures consistently
- Avoids contradicting information already in your knowledge base
- Builds on existing content rather than generating generic material

### What Will Change

**For you as a user**: The "Generate with AI" experience will look and feel the same, but the output will be noticeably more tailored to your organization. If you already have entries about your team structure, the AI will reference real team names. If you have documented processes, new entries will align with them.

**Behind the scenes**: The system will query your existing knowledge base before generating, and feed that context to the AI model.

### Technical Details

**1. Frontend: `AIGenerator.tsx`**
- Fetch the user's `current_organization_id` from their profile
- Pass `organizationId` to the Edge Function alongside the existing fields

**2. Edge Function: `generate-knowledge-content/index.ts`**
- Add Supabase client initialization (using `SUPABASE_URL`, `SUPABASE_ANON_KEY` environment variables)
- Accept the user's auth token from the request `Authorization` header
- Query `knowledge_entries` table filtered by the user's `organization_id`
- Filter to entries that have actual content (text content or parsed document content)
- Pass the formatted entries into the prompt generation function
- Add content size management to avoid exceeding API token limits (truncate if total context is very large)

**3. Prompt: `generate-knowledge-content/prompt.ts`**
- Add a new `existingContent` parameter to `generatePrompt()`
- Insert an "Existing Knowledge Base Context" section into the prompt that instructs the AI to:
  - Reference and align with existing company information
  - Use consistent terminology found in existing entries
  - Avoid duplicating content that already exists
  - Cross-reference related entries where relevant

**4. No new tables or database changes required** -- all the data structures already exist.

### Content Size Management
To prevent issues with very large knowledge bases exceeding API limits:
- Each entry's content will be summarized/truncated to a reasonable length (approximately 500 characters per entry)
- A maximum overall context size will be enforced (roughly 15,000 characters)
- Entries in the same category as the new entry will be prioritized to ensure the most relevant context is included first

