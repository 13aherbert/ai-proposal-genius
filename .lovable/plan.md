
# AI Cost Optimization Implementation Plan

## Overview

This plan implements tiered model selection and intelligent context truncation to reduce AI costs by up to 85% while maintaining proposal quality. The current system uses `claude-opus-4-1-20250805` (the most expensive model) for all 29+ proposal sections and sends the entire knowledge base without filtering.

## Current State Analysis

### Issues Identified

1. **Single Expensive Model**: All sections use Claude Opus 4.1 regardless of complexity
2. **No Context Truncation**: Full knowledge base (~276K+ characters) sent for every section
3. **Redundant Processing**: Existing optimization modules in `generate-section-content` not used in `generate-full-proposal`
4. **High Token Usage**: No intelligent filtering of knowledge content per section type

### Cost Impact

Using Claude Opus for all sections at full context:
- **Per section**: ~$0.50-0.80 (276K input + 4K output tokens)
- **Per proposal (29 sections)**: ~$15-25
- **Target after optimization**: $2-4 per proposal

---

## Implementation Plan

### Phase 1: Tiered Model Selection System

Create a new model selection module for the full proposal generator that selects appropriate models based on section complexity.

**New File**: `supabase/functions/generate-full-proposal/model-selector.ts`

#### Model Tiers

```text
+-------------------+---------------------------+---------------+------------+
| Section Type      | Model                     | Max Tokens    | Cost Tier  |
+-------------------+---------------------------+---------------+------------+
| Executive Summary | Claude Sonnet 4           | 2000          | High       |
| Technical/Approach| Claude Sonnet 4           | 2500          | High       |
| Pricing/Budget    | Claude 3.5 Sonnet         | 1500          | Medium     |
| Timeline/Schedule | Claude 3.5 Sonnet         | 1500          | Medium     |
| Team/Personnel    | Claude 3.5 Haiku          | 1200          | Low        |
| Company Overview  | Claude 3.5 Haiku          | 1200          | Low        |
| General Sections  | Claude 3.5 Sonnet         | 1500          | Medium     |
+-------------------+---------------------------+---------------+------------+
```

#### Complexity Scoring Logic

- Section type complexity (executive: 0.9, technical: 0.8, team: 0.4, etc.)
- Title complexity indicators (methodology, strategy, analysis)
- Content length requirements

---

### Phase 2: Intelligent Knowledge Base Filtering

Create a smart knowledge filter that selects only relevant entries per section type.

**New File**: `supabase/functions/generate-full-proposal/smart-knowledge-filter.ts`

#### Filtering Strategy

1. **Section-Specific Keywords**: Map section types to relevant knowledge categories
2. **Relevance Scoring**: Score entries based on keyword matches and category alignment
3. **Content Limits**: 
   - Executive: 4 most relevant entries
   - Technical: 5 entries
   - Team: 3 entries
   - Company: 3 entries
   - Pricing: 2 entries
   - Timeline: 2 entries

4. **Content Summarization**: For entries >2000 characters, extract key points only

#### Expected Reduction

- Before: 276K+ characters (full knowledge base)
- After: 5-20K characters (filtered, relevant content only)
- Reduction: ~80-90%

---

### Phase 3: Optimized Prompt Generation

Create streamlined prompts that reduce token usage while maintaining quality.

**New File**: `supabase/functions/generate-full-proposal/optimized-prompt.ts`

#### Prompt Optimizations

1. **Condensed Instructions**: Remove verbose guidelines (~70% reduction)
2. **Section-Specific Focus**: Only include relevant guidance per section type
3. **Existing Section References**: Extract key info only, not full content
4. **Anti-Repetition Measures**: Compact format for avoiding duplicate content

#### Prompt Size Comparison

- Current: ~4,000+ characters per prompt
- Optimized: ~800-1,200 characters per prompt

---

### Phase 4: Update Main Generation Logic

Modify `supabase/functions/generate-full-proposal/index.ts` to integrate all optimization modules.

#### Changes Required

1. **Import New Modules**: Model selector, knowledge filter, optimized prompt
2. **Replace generateWithClaude**: Use model-aware generation function
3. **Add Knowledge Filtering**: Filter before each section generation
4. **Track Cost Savings**: Log model used and estimated savings per section

#### New Flow

```text
Section Request
      ↓
Determine Section Type
      ↓
Select Optimal Model (Haiku/Sonnet/Sonnet 4)
      ↓
Filter Knowledge Base (5-20K chars)
      ↓
Generate Optimized Prompt (~1K chars)
      ↓
Call Selected Model with Appropriate Token Limit
      ↓
Track Cost Savings
```

---

### Phase 5: Cost Analytics in Response

Add cost tracking metrics to the generation response and UI.

#### New Metadata Fields

```text
costOptimization: {
  modelUsedPerSection: { [section]: modelName },
  estimatedCostSavings: percentage,
  tokenReductionPercentage: number,
  modelsUsed: {
    haiku: count,
    sonnet35: count,
    sonnet4: count
  }
}
```

#### UI Updates

Add a new section in the metadata display showing:
- Model distribution (pie chart representation as text)
- Estimated cost savings percentage
- Token reduction metrics

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/generate-full-proposal/model-selector.ts` | Create | Tiered model selection based on section complexity |
| `supabase/functions/generate-full-proposal/smart-knowledge-filter.ts` | Create | Section-specific knowledge filtering and summarization |
| `supabase/functions/generate-full-proposal/optimized-prompt.ts` | Create | Streamlined prompt generation |
| `supabase/functions/generate-full-proposal/index.ts` | Modify | Integrate optimization modules, update generation flow |
| `src/components/project/auto-proposal/AutoGeneratedProposal.tsx` | Modify | Display cost savings metrics |

---

## Expected Outcomes

### Cost Reduction

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Average model cost | 100% (Opus) | ~20% (mixed) | 80% |
| Input tokens | 276K+ | 5-20K | 90% |
| Per-section cost | $0.50-0.80 | $0.05-0.15 | 85% |
| Per-proposal cost | $15-25 | $2-4 | 85% |

### Quality Maintenance

- Executive/Technical sections: High-quality Sonnet 4 model maintains strategic content quality
- Medium-complexity sections: Sonnet 3.5 provides good balance
- Simple sections: Haiku handles factual content efficiently
- Context relevance: Section-specific filtering improves content relevance

---

## Technical Details

### Model Cost Reference (Relative to Opus = 1.0)

```text
claude-opus-4-1-20250805:    1.00 (baseline)
claude-sonnet-4-20250514:    0.40 (60% cheaper)
claude-3-5-sonnet-20241022:  0.30 (70% cheaper)
claude-3-5-haiku-20241022:   0.10 (90% cheaper)
```

### Section Type Detection

Uses keyword matching to categorize sections:
- **Executive**: executive, summary, overview, introduction
- **Technical**: technical, approach, methodology, solution, implementation
- **Team**: team, personnel, staff, qualifications, expertise
- **Pricing**: cost, price, budget, investment, financial
- **Timeline**: timeline, schedule, milestone, delivery, phase
- **Company**: company, about, organization, background
- **General**: all other sections

### Knowledge Entry Relevance Scoring

1. Title keyword matches: +0.3 per match
2. Content keyword matches: +0.2 per match
3. Category alignment: +0.5-0.9 based on match quality
4. Content length bonus: +0.1-0.3 for comprehensive entries
5. Structured content bonus: +0.15 for lists/headers
6. Data-rich bonus: +0.2 for entries with numbers/dates

---

## Risk Mitigation

1. **Quality Fallback**: If Haiku produces low-quality content (<60 score), retry with Sonnet
2. **Context Minimum**: Ensure at least 2 knowledge entries per section
3. **Graceful Degradation**: If optimization fails, fall back to current approach
4. **A/B Testing Ready**: Log both optimized and baseline metrics for comparison
