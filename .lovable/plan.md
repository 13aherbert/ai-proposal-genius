

## AI Model Efficiency Audit & Migration Plan

### Current State: 8 Edge Functions Using 4 Different AI Providers/Models

Here is every AI call in the system, what it does, what model it uses, and the recommended replacement:

---

### 1. `analyze-rfp/index.ts` -- RFP Document Analysis
- **Current**: `google/gemini-3-flash-preview` via Lovable AI Gateway
- **Cost**: Low
- **Recommendation**: **No change** -- this is already optimal. Flash is ideal for extraction/summarization tasks.

### 2. `analyze-rfp/openai-client.ts` -- Legacy OpenAI Client (DEAD CODE)
- **Current**: `gpt-4-turbo-preview` via direct OpenAI API (`OPENAI_API_KEY`)
- **Cost**: High (direct OpenAI billing)
- **Recommendation**: **Delete this file entirely**. The main `index.ts` already uses the Lovable AI Gateway with Gemini. This file is imported nowhere in the active code path -- it's leftover from before the migration. Removing it eliminates confusion and a dead dependency on `OPENAI_API_KEY`.

### 3. `generate-proposal-outline/index.ts` -- Outline Generation
- **Current**: `google/gemini-3-flash-preview` via Lovable AI Gateway
- **Cost**: Low
- **Recommendation**: **No change** -- outline generation is structured extraction, perfect for Flash.

### 4. `generate-full-proposal/index.ts` -- Full Proposal Section Generation (BULK)
- **Current**: Direct Anthropic API (`ANTHROPIC_API_KEY`) with tiered model selection:
  - HIGH tier: `claude-sonnet-4-5-20250929` (2500 tokens)
  - MEDIUM tier: `claude-sonnet-4-5-20250929` (1500 tokens)
  - LOW tier: `claude-haiku-4-5-20251001` (1200 tokens)
- **Cost**: Very High -- this is the most expensive function (generates 6-20+ sections per proposal, each calling Anthropic directly)
- **Recommendation**: **Migrate to Lovable AI Gateway** and switch to Gemini models:
  - HIGH tier: `google/gemini-2.5-pro` -- matches Claude Sonnet quality for strategic/technical writing at lower cost
  - MEDIUM tier: `google/gemini-2.5-flash` -- excellent quality for standard sections, significantly cheaper
  - LOW tier: `google/gemini-2.5-flash-lite` -- fastest and cheapest for simple factual sections (company info, team bios)
  - This eliminates the `ANTHROPIC_API_KEY` dependency and consolidates billing through Lovable

### 5. `generate-section-content/claude-client.ts` -- Individual Section Generation
- **Current**: `claude-opus-4-1-20250805` via direct Anthropic API -- the **most expensive model available**
- **Cost**: Extremely High
- **Recommendation**: **Migrate to Lovable AI Gateway** with `google/gemini-2.5-flash`. This function generates individual sections on-demand (manual regeneration). Opus is massive overkill. The model-selector.ts in this folder already defines tiered selection but the `claude-client.ts` hardcodes Opus and ignores it. Wire up the model selector to actually use the gateway with the same tiered approach as generate-full-proposal.

### 6. `generate-knowledge-content/index.ts` -- Knowledge Base AI Content
- **Current**: `claude-sonnet-4-5-20250929` via direct Anthropic API (`ANTHROPIC_API_KEY`)
- **Cost**: High
- **Recommendation**: **Migrate to Lovable AI Gateway** with `google/gemini-2.5-flash`. Knowledge base content generation is straightforward writing that doesn't need Sonnet-level reasoning. Flash handles this well and is significantly cheaper.

### 7. `evaluate-proposal/index.ts` -- Proposal Evaluation
- **Current**: `google/gemini-2.5-pro` via Lovable AI Gateway
- **Cost**: Medium-High
- **Recommendation**: **No change** -- evaluation requires deep reasoning across the full proposal against RFP criteria. Pro is appropriate here. Could consider `google/gemini-3-pro-preview` for even better results at similar cost.

### 8. `apply-evaluation-suggestions/index.ts` -- Apply Evaluation Fixes
- **Current**: `google/gemini-2.5-flash` via Lovable AI Gateway
- **Cost**: Low
- **Recommendation**: **No change** -- Flash is appropriate for targeted rewrites based on specific feedback.

### 9. `auto-fill-knowledge-gaps/index.ts` -- Auto-Fill Knowledge Gaps
- **Current**: `google/gemini-2.5-flash` via Lovable AI Gateway
- **Cost**: Low
- **Recommendation**: **No change** -- extraction from existing documents is well-suited to Flash.

---

### Summary of Changes

```text
Function                      Current Model                    New Model                      Savings
---------------------------------------------------------------------------------------------------------
analyze-rfp (main)            gemini-3-flash-preview           No change                      --
analyze-rfp (openai-client)   gpt-4-turbo-preview              DELETE (dead code)             100%
generate-proposal-outline     gemini-3-flash-preview           No change                      --
generate-full-proposal HIGH   claude-sonnet-4.5 (Anthropic)    gemini-2.5-pro (Gateway)       ~40-50%
generate-full-proposal MED    claude-sonnet-4.5 (Anthropic)    gemini-2.5-flash (Gateway)     ~70%
generate-full-proposal LOW    claude-haiku-4.5 (Anthropic)     gemini-2.5-flash-lite (Gateway) ~50%
generate-section-content      claude-opus-4.1 (Anthropic)      gemini-2.5-flash (Gateway)     ~85%
generate-knowledge-content    claude-sonnet-4.5 (Anthropic)    gemini-2.5-flash (Gateway)     ~70%
evaluate-proposal             gemini-2.5-pro                   No change                      --
apply-evaluation-suggestions  gemini-2.5-flash                 No change                      --
auto-fill-knowledge-gaps      gemini-2.5-flash                 No change                      --
```

### Implementation Details

**1. Delete dead code:**
- Remove `supabase/functions/analyze-rfp/openai-client.ts`

**2. Migrate `generate-full-proposal/index.ts`:**
- Replace direct Anthropic API calls with Lovable AI Gateway calls
- Update `generateWithTieredModel()` to use `fetch('https://ai.gateway.lovable.dev/v1/chat/completions')` with `LOVABLE_API_KEY`
- Update `model-selector.ts` to return Gemini model names
- Remove `ANTHROPIC_API_KEY` dependency from this function

**3. Migrate `generate-section-content/`:**
- Rewrite `claude-client.ts` to use Lovable AI Gateway instead of direct Anthropic API
- Update `model-selector.ts` to use Gemini model names matching the full-proposal selector
- Wire model selection into the actual API call (currently ignored -- Opus is hardcoded)

**4. Migrate `generate-knowledge-content/index.ts`:**
- Replace direct Anthropic API call with Lovable AI Gateway
- Switch model to `google/gemini-2.5-flash`
- Remove `ANTHROPIC_API_KEY` dependency

**5. Redeploy all modified edge functions:**
- `generate-full-proposal`
- `generate-section-content`
- `generate-knowledge-content`

### Key Benefits

- **Consolidated billing**: All AI usage through Lovable AI Gateway instead of managing separate Anthropic and OpenAI API keys
- **Estimated 60-70% overall cost reduction** across all AI calls
- **No quality loss**: Gemini 2.5 Pro matches Claude Sonnet for complex tasks; Gemini Flash excels at structured generation
- **Simpler architecture**: One API gateway, one auth key, consistent error handling
- **Dead code removal**: Eliminates unused OpenAI integration

