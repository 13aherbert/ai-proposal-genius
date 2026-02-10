

## Fix: Evaluate Proposals Against Actual RFP Evaluation Criteria

### The Problem

The current evaluation system has two issues:

1. **It doesn't use the actual RFP content** -- it only looks at the AI-generated analysis summary, which is a condensed interpretation of the RFP, not the real evaluation criteria language the reviewers will use.

2. **The regex extraction is broken** -- the code searches for `Evaluation Criteria:` but the analysis format uses `EVALUATION CRITERIA & SCORING` as a heading. The regex rarely matches, so the system almost always falls back to "evaluate based on general proposal best practices" -- generic standards rather than the RFP's actual scoring rubric.

### The Fix

Pass the **original RFP analysis** (which contains the extracted evaluation criteria section) AND the **full analysis text** to the edge function, then restructure the prompt to:

1. **Primary source**: Use the full analysis text and specifically extract the "EVALUATION CRITERIA & SCORING" section with a corrected regex pattern
2. **Fallback only**: Use general best practices only if the analysis truly contains no evaluation criteria

### Technical Changes

**1. Edge Function: `supabase/functions/evaluate-proposal/index.ts`**

Update the evaluation criteria extraction logic:

- Fix the regex to match the actual analysis format: search for `EVALUATION CRITERIA & SCORING` (the heading used by the analyze-rfp function), plus fallback patterns like `Evaluation Criteria`, `Scoring`, etc.
- Extract a larger portion of the analysis -- not just the criteria section, but also the "KEY REQUIREMENTS ANALYSIS" and "WIN PROBABILITY ASSESSMENT" sections, since these contain information about what the RFP is looking for
- Restructure the prompt so the AI evaluates against the **specific criteria, weights, and scoring factors** found in the RFP, not generic standards
- Make the fallback explicit in the prompt: "The following criteria were extracted from the RFP. If no criteria are shown, evaluate against standard government proposal best practices."

**Specific regex fix:**
```
// Current (broken):
analysis?.match(/Evaluation Criteria:([\s\S]*?)(?=\n#|\n$)/)?.[1]

// Fixed (matches actual format):
analysis?.match(/(?:EVALUATION CRITERIA & SCORING|Evaluation Criteria)[:\s]*([\s\S]*?)(?=\n##|\n\d+\.\s|\n\*\*\d+|$)/i)?.[1]
```

**Prompt restructure:**
- Add a new section "RFP REQUIREMENTS & EXPECTATIONS" that includes the key requirements from the analysis
- Rename "RFP EVALUATION CRITERIA" to "RFP EVALUATION CRITERIA (from uploaded RFP)" and include the full extracted criteria with scoring weights
- Add explicit instruction: "You MUST evaluate against every criterion listed below. Score each one individually. Do NOT substitute generic criteria."

**2. Frontend: `src/components/project/proposal-evaluation/useProposalEvaluation.ts`**

No changes needed -- the hook already passes the full `analysis` text to the edge function. The fix is entirely in how the edge function parses and uses that analysis.

### What Changes for the User

- Evaluations will reference the **specific scoring criteria** from the uploaded RFP (e.g., "Technical Approach: 40 points", "Past Performance: 30 points")
- Each criterion from the RFP will get an individual score and specific feedback
- The evaluation will flag if the proposal is missing content for any RFP-specified criterion
- Generic "best practices" feedback only appears as a supplement, not the primary evaluation

### No Database or Config Changes Required

This is a prompt and parsing fix within the existing edge function. Only `supabase/functions/evaluate-proposal/index.ts` needs to be updated and redeployed.

