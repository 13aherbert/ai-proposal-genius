

# Apply Evaluation Suggestions Feature Implementation Plan

## Overview

This feature adds an "Apply Suggestions" button to the Proposal Evaluation component that uses the AI-generated evaluation feedback to intelligently rewrite and improve proposal sections. The AI will parse the evaluation, extract specific improvement recommendations, and rewrite affected sections incorporating those suggestions.

---

## Architecture Decision

### Two Implementation Options

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| **A) Section-by-Section** | User selects which sections to improve | More control, lower AI cost | More clicks, slower workflow |
| **B) Batch Improvement** | One-click improves all sections based on evaluation | Faster UX, comprehensive | Higher AI cost, longer wait |

**Recommendation**: Implement **Option B (Batch)** with a preview/confirmation step, as it aligns with the existing "Generate All Content" pattern users are familiar with.

---

## Data Flow

```text
┌──────────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│  Proposal Evaluation │ ──► │  Parse Suggestions  │ ──► │  apply-suggestions   │
│  (stored in DB)      │     │  (client-side)      │     │  edge function       │
└──────────────────────┘     └─────────────────────┘     └──────────────────────┘
                                                                    │
                                                                    ▼
                                                         ┌──────────────────────┐
                                                         │  For each section:   │
                                                         │  - Original content  │
                                                         │  - Evaluation notes  │
                                                         │  - Knowledge base    │
                                                         │  - RFP analysis      │
                                                         │  ─────────────────── │
                                                         │  AI rewrites section │
                                                         └──────────────────────┘
                                                                    │
                                                                    ▼
                                                         ┌──────────────────────┐
                                                         │  Update proposal_    │
                                                         │  sections table      │
                                                         └──────────────────────┘
```

---

## Implementation Components

### 1. New Edge Function: `apply-evaluation-suggestions`

**Location**: `supabase/functions/apply-evaluation-suggestions/index.ts`

**Purpose**: Takes the evaluation text, parses section-specific feedback, and rewrites each section incorporating the suggestions while preserving the original structure.

**Input**:
```typescript
{
  projectId: string;
  evaluation: string;        // Full evaluation text from projects.evaluation
  sections: Array<{          // Current proposal sections
    section_id: string;
    section_title: string;
    content: string;
  }>;
  analysis: string;          // RFP analysis for context
}
```

**Output**:
```typescript
{
  success: boolean;
  improvements: Array<{
    section_id: string;
    section_title: string;
    original_content: string;
    improved_content: string;
    changes_applied: string[];  // List of improvements made
  }>;
}
```

**AI Prompt Strategy**:
- Parse evaluation to extract section-specific feedback
- For each section, provide: original content + relevant evaluation feedback + knowledge base
- Instruct AI to rewrite addressing specific issues while maintaining voice and structure
- Apply the same quality protocols (anti-hallucination, word limits, banned vocabulary)

### 2. UI Component: `ApplySuggestionsButton`

**Location**: `src/components/project/proposal-evaluation/components/ApplySuggestionsButton.tsx`

**Features**:
- Button appears only when evaluation exists
- Shows confirmation dialog with summary of changes to be made
- Progress indicator showing which section is being improved
- Preview of changes before committing (optional enhancement)

### 3. Hook: `useApplySuggestions`

**Location**: `src/components/project/proposal-evaluation/hooks/useApplySuggestions.ts`

**Responsibilities**:
- Parse evaluation to identify improvable sections
- Call edge function
- Handle progress updates
- Update sections via existing mutation hooks
- Error handling and retry logic

### 4. Evaluation Parser Utility

**Location**: `src/lib/evaluation-parser.ts`

**Purpose**: Extract structured feedback from the markdown evaluation text

**Functions**:
```typescript
interface ParsedEvaluation {
  sectionFeedback: Map<string, {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  }>;
  priorityRecommendations: string[];
  overallScore: number;
}

function parseEvaluation(evaluationText: string): ParsedEvaluation;
function getSectionRelevantFeedback(
  sectionTitle: string, 
  parsed: ParsedEvaluation
): string;
```

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/apply-evaluation-suggestions/index.ts` | Create | Edge function for AI-powered section rewriting |
| `src/components/project/proposal-evaluation/components/ApplySuggestionsButton.tsx` | Create | UI button with progress display |
| `src/components/project/proposal-evaluation/hooks/useApplySuggestions.ts` | Create | Hook for managing the improvement workflow |
| `src/lib/evaluation-parser.ts` | Create | Utility to parse evaluation markdown into structured data |
| `src/components/project/proposal-evaluation/ProposalEvaluation.tsx` | Modify | Add ApplySuggestionsButton to the component |
| `supabase/config.toml` | Modify | Register new edge function |

---

## Technical Details

### Edge Function Prompt Design

The edge function will use a specialized prompt that:

1. **Receives section-specific context**:
   - Original section content
   - Extracted evaluation feedback for that section
   - Priority recommendations that apply
   - RFP analysis for alignment
   - Knowledge base for fact-checking

2. **Improvement instructions**:
```text
IMPROVEMENT TASK:
You are revising the "${sectionTitle}" section based on evaluator feedback.

ORIGINAL CONTENT:
${originalContent}

EVALUATOR FEEDBACK FOR THIS SECTION:
${sectionFeedback}

PRIORITY IMPROVEMENTS TO APPLY:
${relevantPriorityItems}

REWRITE REQUIREMENTS:
1. Address each specific criticism from the feedback
2. Maintain the original structure and key points
3. Improve clarity, evidence, and specificity
4. Apply all quality protocols (anti-hallucination, word limits)
5. Preserve accurate information from original
6. Add missing elements identified in feedback

OUTPUT: Improved section content only, no commentary.
```

### Progress Tracking

The hook will provide real-time progress:
```typescript
interface ImprovementProgress {
  isImproving: boolean;
  currentSection: string | null;
  completed: number;
  total: number;
  successes: string[];
  errors: string[];
}
```

### UI Integration

The button will be added to the ProposalEvaluation component header, next to the Evaluate button:

```tsx
<div className="flex items-center gap-2">
  <Button onClick={handleEvaluate}>
    {/* Evaluate button */}
  </Button>
  {evaluation && (
    <ApplySuggestionsButton
      projectId={projectId}
      evaluation={evaluation}
      onComplete={refreshSections}
    />
  )}
</div>
```

---

## Model Selection

**Recommended**: `google/gemini-3-flash-preview`

**Reasoning**:
- Section rewrites are focused tasks (moderate complexity)
- Need to process multiple sections efficiently
- Cost-effective for iterative improvements
- Fast enough for good UX during batch processing

**Token allocation**: 2000 tokens per section (sufficient for improved content)

---

## User Experience Flow

1. User runs proposal evaluation → sees feedback
2. User clicks "Apply Suggestions" button
3. Confirmation dialog shows:
   - Number of sections to improve
   - Summary of main issues to address
4. User confirms → progress indicator shows section-by-section improvement
5. Completion notification with option to:
   - View changes in proposal draft
   - Re-evaluate to measure improvement

---

## Cost & Performance Considerations

| Metric | Estimate |
|--------|----------|
| Sections per proposal | 5-10 typical |
| Tokens per section rewrite | ~2000 output |
| Total AI calls per "Apply" | 5-10 calls |
| Estimated time | 30-60 seconds |
| Estimated cost | ~$0.05-0.10 per apply |

---

## Future Enhancements (Not in Initial Scope)

1. **Preview Mode**: Show diff of proposed changes before applying
2. **Selective Application**: Choose which sections to improve
3. **Undo Support**: Revert to pre-improvement version
4. **Iterative Improvement**: Apply suggestions multiple times with different focus areas

