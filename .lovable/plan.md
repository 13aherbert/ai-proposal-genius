
# Prompt Improvement Plan: Addressing Proposal Evaluation Issues

## Overview
This plan enhances the content generation prompts to prevent the common quality issues identified in the proposal evaluation. The evaluation revealed 15+ distinct categories of problems that can be addressed by improving prompt instructions.

---

## Identified Issues from Evaluation

Based on the most recent proposal evaluation, these are the primary content quality problems that need prevention:

### Category 1: Unsubstantiated Claims & Hallucination
- Statistics cited without sources (e.g., "34% message retention", "4.8% conversion rates")
- Generic industry statistics presented as company-specific data
- Claims about capabilities not verifiable in knowledge base

### Category 2: Extreme Verbosity & Poor Conciseness
- Content far too long (6,000+ words when 2,500 would suffice)
- Excessive adjectives and promotional language
- Sentences exceeding 40-50 words
- Repetitive points across sections

### Category 3: Hyperbolic & Promotional Language
- Over-the-top phrases: "catastrophic", "ruthless", "bulletproof", "weaponize"
- Marketing copy tone instead of professional proposal
- Overselling that undermines credibility

### Category 4: Lack of Verifiable Evidence
- No portfolio links or work sample references
- Missing client references with contact information
- Team credentials without verifiable details
- Claims without project context (dates, outcomes)

### Category 5: Vague Specifics & Missing Details
- "Texas vendor partnerships" without naming partners
- Timeline milestones without breakdown
- Cost line items that don't add up logically
- Generic location/logistics descriptions

### Category 6: Cross-Section Redundancy
- Federal compliance mentioned in 4+ sections
- Same differentiators repeated throughout
- Information not organized by section purpose

---

## Implementation Plan

### Phase 1: Core Prompt Improvements

**File: `supabase/functions/generate-section-content/prompt.ts`**

Update the `generatePrompt()` function with enhanced anti-hallucination and quality controls:

**1.1 Add Evidence Requirements Section**
```
EVIDENCE REQUIREMENTS (MANDATORY):
• Every statistic MUST include: source, date, and context
• If no source available in knowledge base, state "Our experience shows..." or omit
• Never cite percentages/numbers without explicit knowledge base backing
• Replace unverifiable claims with descriptive outcomes
```

**1.2 Add Conciseness Controls**
```
CONCISENESS REQUIREMENTS:
• Maximum 400-600 words for standard sections (not 1000+)
• Maximum sentence length: 25 words
• Maximum 2 adjectives per noun phrase
• No words with 4+ syllables when simpler alternatives exist
• If you've made a point once, don't repeat it in another form
```

**1.3 Add Banned Phrases List**
```
BANNED PHRASES (Never use these):
• "Catastrophic", "bulletproof", "ruthless", "weaponize"
• "Unparalleled", "world-class", "cutting-edge", "state-of-the-art"
• "We believe", "we think", "would be able to"
• "Various", "multiple", "several", "numerous" (be specific instead)
• Industry jargon: "synergy", "paradigm", "leverage" (as verb)
```

**1.4 Add Specificity Requirements**
```
SPECIFICITY REQUIREMENTS:
• If mentioning partners/vendors: provide names or omit
• If claiming experience: include project name, client, date, outcome
• If citing timeline: include specific dates, not ranges
• If discussing team: include actual credentials, not adjectives
• If referencing costs: ensure line items logically sum to total
```

---

### Phase 2: Enhanced Section Guidelines

**File: `supabase/functions/generate-section-content/prompt.ts`**

Update `getSectionGuidelines()` function with anti-pattern warnings:

**2.1 Executive Summary Enhancement**
```
Current: General guidance about value proposition
Add: 
• AVOID generic superlatives - use specific outcomes
• MUST include at least one verifiable reference
• Keep under 400 words - executives skim
• Lead with client's problem, not your capabilities
```

**2.2 Technical Approach Enhancement**
```
Current: Methodology-focused guidance
Add:
• Provide actual tool/framework names, not "best-in-class tools"
• Include specific dates/durations for each phase
• Avoid jargon - write as if explaining to a smart non-expert
• Every capability claim needs a "proven by" reference
```

**2.3 Team/Qualifications Enhancement**
```
Current: Experience-focused guidance
Add:
• NEVER mention awards without relevance to this project
• Include verifiable credentials (actual certifications, years)
• If no specific team members in knowledge base, use role-based descriptions
• Link each team capability to a specific project deliverable
```

**2.4 Pricing Enhancement**
```
Current: Value-before-cost guidance
Add:
• Line items MUST mathematically add up to total
• If price seems low, don't defensively justify - state value confidently
• Include what's NOT included to set expectations
• Never compare to competitor pricing without verifiable market research
```

---

### Phase 3: Optimized Prompt Updates

**File: `supabase/functions/generate-section-content/optimized-prompt.ts`**

Update `generateOptimizedPrompt()` function:

**3.1 Add Quality Gates**
Replace the current `WRITING REQUIREMENTS` section with:
```
QUALITY GATES (Content fails if any violated):
✓ Every statistic has knowledge base source OR is removed
✓ Total word count under 600 (under 400 for executive/timeline)
✓ No hyperbolic language (catastrophic, bulletproof, etc.)
✓ No repeated information from other sections
✓ Every claim about capability has verifiable backing
✓ Sentence average under 20 words
```

**3.2 Add Tone Calibration**
```
TONE CALIBRATION:
• Government evaluators prefer: clear, direct, factual
• Avoid: marketing language, superlatives, defensive justifications
• Confidence comes from specifics, not adjectives
• When uncertain, be conservative - understate rather than overstate
• Never negatively reference competitors
```

---

### Phase 4: Dynamic Prompt Optimizer Updates

**File: `supabase/functions/generate-section-content/dynamic-prompt-optimizer.ts`**

**4.1 Update OPTIMIZATION_TECHNIQUES object**
Add anti-pattern warnings to each section type:
```typescript
'executive': {
  keywords: ['strategic', 'value proposition', 'business impact', 'ROI'],
  structure: 'Problem → Solution → Evidence → Outcome',
  tone: 'confident, factual, concise',
  avoid: ['world-class', 'unparalleled', 'cutting-edge', 'extensive experience'],
  maxWords: 400
},
```

**4.2 Add Content Quality Pre-Check**
New function to detect problematic patterns before generation:
```typescript
static identifyRiskyContent(prompt: string, knowledgeContent: string): string[] {
  const risks = [];
  // Flag if knowledge base lacks specific statistics
  // Flag if section type typically triggers verbosity
  // Add warnings to prompt for identified risks
  return risks;
}
```

**4.3 Update enhancePromptStructure() method**
Add conciseness enforcement:
```
STRICT LENGTH LIMITS:
- Executive Summary: 300-400 words
- Technical Approach: 400-600 words  
- Team Qualifications: 250-400 words
- Timeline: 200-350 words
- Pricing: 300-500 words
- Other sections: 300-500 words

Exceeding these limits indicates verbosity problems.
```

---

### Phase 5: Add Post-Generation Validation

**File: `supabase/functions/generate-section-content/content-validator.ts`** (new file)

Create a validation layer that checks generated content for:

```typescript
interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
  wordCount: number;
  avgSentenceLength: number;
}

// Checks to implement:
1. Word count within section-specific limits
2. No banned phrases detected
3. No unattributed statistics
4. Sentence length average under threshold
5. No repetition of key phrases from other sections
6. No defensive/apologetic language patterns
```

---

## File Changes Summary

| File | Change Type | Purpose |
|------|-------------|---------|
| `supabase/functions/generate-section-content/prompt.ts` | Modify | Add evidence, conciseness, banned phrases, specificity requirements |
| `supabase/functions/generate-section-content/optimized-prompt.ts` | Modify | Add quality gates, tone calibration, strict length limits |
| `supabase/functions/generate-section-content/dynamic-prompt-optimizer.ts` | Modify | Update section guidelines with anti-patterns, add maxWords, add risk detection |
| `supabase/functions/generate-section-content/content-validator.ts` | Create | Post-generation validation for quality enforcement |
| `supabase/functions/generate-section-content/index.ts` | Modify | Integrate new validator, add quality rejection logic |

---

## Technical Details

### Specific Prompt Text Additions

**For prompt.ts - Add after "FORBIDDEN CONTENT" section:**
```
ANTI-HALLUCINATION PROTOCOL:
• Statistics require format: "[Number] (Source: [Knowledge Base Entry Title])"
• If no source exists in knowledge base, rewrite as qualitative: "significant improvement" not "45% increase"
• Never create specific percentages, dollar amounts, or timeframes not in knowledge base
• When describing team: use actual titles/credentials from knowledge base only
• For vendor partnerships: only name partners explicitly listed in knowledge base

ANTI-VERBOSITY PROTOCOL:
• Maximum words by section: Executive (400), Technical (600), Team (400), Timeline (350), Pricing (500), Other (500)
• If a point was made in another section, reference don't repeat: "As noted in [Section Name]..."
• Eliminate: "In order to" → "To", "At this point in time" → "Now", "Due to the fact that" → "Because"
• Remove all instances of: "It is important to note that", "It should be noted that", "As mentioned previously"
• One adjective per noun maximum (not "comprehensive, robust, industry-leading solution")

BANNED VOCABULARY (Causes credibility concerns):
Hyperbolic: catastrophic, bulletproof, ruthless, weaponize, mesmerizing, unparalleled
Vague: various, multiple, numerous, several, extensive, significant (without number)
Jargon: synergy, paradigm, leverage (verb), cutting-edge, state-of-the-art, world-class
Weak: believe, think, feel, hope, try, would be able to, might, perhaps, possibly

SPECIFICITY REQUIREMENTS:
• Bad: "extensive industry experience" → Good: "8 years delivering video production for state agencies"
• Bad: "Texas vendor partnerships" → Good: "partnership with [Vendor Name] in Austin since 2021" OR omit entirely
• Bad: "proven methodology" → Good: "[Methodology Name] used on 12 government projects since 2019"
• Bad: "competitive pricing" → Good: "$34,500 total investment including all deliverables"
```

**For optimized-prompt.ts - Replace WRITING REQUIREMENTS:**
```
MANDATORY QUALITY STANDARDS:
1. WORD COUNT: Stay within section limit (see above) - being concise is a strength
2. SENTENCE LENGTH: Average 15-20 words, maximum 30 words per sentence
3. EVIDENCE: Every claim needs backing - no floating statistics or unverifiable capabilities  
4. TONE: Government-appropriate - professional, factual, confident without hyperbole
5. STRUCTURE: Each paragraph serves ONE purpose, then moves on
6. UNIQUENESS: This section must add NEW value - never repeat other sections' content
```

### Validation Logic (content-validator.ts)

```typescript
const BANNED_WORDS = [
  'catastrophic', 'bulletproof', 'ruthless', 'weaponize', 'mesmerizing',
  'unparalleled', 'world-class', 'cutting-edge', 'state-of-the-art',
  'synergy', 'paradigm', 'leverage'
];

const VAGUE_PATTERNS = [
  /various\s+\w+/gi,
  /multiple\s+\w+/gi,
  /numerous\s+\w+/gi,
  /extensive\s+experience/gi
];

const UNATTRIBUTED_STAT_PATTERN = /\d+%|\$\d+|[0-9]+x|[0-9]+ (years|months|days)/gi;

export function validateGeneratedContent(
  content: string, 
  sectionType: string,
  knowledgeContent: string
): ValidationResult {
  // Implementation checks content against all quality criteria
}
```

---

## Expected Outcomes

After implementation:
- **Verbosity**: Content 40-60% shorter and more impactful
- **Hallucination**: Statistics only appear when knowledge base provides source
- **Tone**: Professional government-appropriate language, no marketing hyperbole
- **Specificity**: Claims backed by verifiable details or rewritten as qualitative
- **Redundancy**: Each section adds unique value without repetition
- **Credibility**: Evaluators see confident, substantive content instead of overselling

---

## Deployment Sequence

1. Update `prompt.ts` with anti-hallucination and anti-verbosity protocols
2. Update `optimized-prompt.ts` with quality gates and tone calibration  
3. Update `dynamic-prompt-optimizer.ts` with section-specific limits and risk detection
4. Create `content-validator.ts` with post-generation checks
5. Update `index.ts` to integrate validation and add quality rejection
6. Redeploy `generate-section-content` edge function
7. Test with sample generation to verify improvements
