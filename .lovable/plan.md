

## Make Executive Summary Derive from Proposal Content

### Problem
The Executive Summary section currently requires knowledge base entries to generate content, triggering coverage warnings and potentially failing in strict mode. An Executive Summary should instead be synthesized from the other proposal sections -- it is a distillation of the full proposal, not a standalone KB-dependent section.

### Changes

#### 1. Update the prompt for executive sections to prioritize other sections over KB
**File:** `supabase/functions/generate-section-content/prompt.ts`

In the `generatePrompt` function, when `sectionType === 'executive'`:
- Add explicit instructions that the executive summary should be synthesized primarily from the existing proposal sections (passed via `existingSections`)
- Demote knowledge base context to a secondary/supplementary role
- If existing sections are available, restructure the prompt to lead with them as the primary source material

#### 2. Update generation order so Executive Summary generates last
**File:** `src/hooks/use-content-generation.ts`

In the `generateAllContent` function, reorder sections so that any section detected as `executive` type (title contains "executive", "summary", or "overview") is moved to the end of the generation queue. This ensures all other sections exist as context when the executive summary is generated.

#### 3. Skip KB coverage warnings for executive sections
**File:** `src/hooks/use-content-generation.ts`

When checking knowledge base coverage or displaying warnings, skip sections identified as executive type since they do not depend on KB entries.

**File:** `src/components/shared/KnowledgeBaseValidation.tsx`

Add a check: if the `sectionTitle` matches executive summary patterns, show a different message like "This section will be generated from your other proposal sections" instead of showing a low-coverage warning.

#### 4. Update the dynamic prompt optimizer context
**File:** `supabase/functions/generate-section-content/dynamic-prompt-optimizer.ts` (line 237)

Enhance the executive context string to explicitly state: "This section MUST be synthesized from the existing proposal sections below. Do not require separate knowledge base entries -- use the proposal itself as the primary source."

#### 5. Handle strict mode exception for executive sections
**File:** `supabase/functions/generate-section-content/prompt.ts`

In strict mode, the executive summary should NOT trigger the `INSUFFICIENT_KNOWLEDGE_BASE_DATA` refusal. Add a carve-out so strict mode still applies anti-hallucination rules but sources from existing sections rather than demanding KB entries.

### Technical Summary

| Change | File | Purpose |
|--------|------|---------|
| Reorder sections (exec last) | `use-content-generation.ts` | Ensure other sections exist as context |
| Update executive prompt | `prompt.ts` | Synthesize from proposal, not KB |
| Skip KB warnings for exec | `use-content-generation.ts`, `KnowledgeBaseValidation.tsx` | No false coverage alerts |
| Update optimizer context | `dynamic-prompt-optimizer.ts` | Reinforce proposal-based synthesis |
| Strict mode exception | `prompt.ts` | Allow exec generation without KB |

One edge function redeployed (`generate-section-content`), three client files updated. No new dependencies.

