## Goal

Make every route show a unique, human-readable page title so analytics, browser tabs, and history list each page clearly (e.g. "Proposal Word Counter — OptiRFP" instead of the default site title).

## What's already in place

The project has a `SEO` component (`src/components/SEO.tsx`) backed by `useSEO` that writes `<title>`, description, canonical, and Open Graph tags into `document.head`. Most pages already use it. Only a handful do not.

## Pages missing per-route titles

Tools (11):
- `BidNoBidScorecard.tsx`
- `CapabilityStatementGenerator.tsx`
- `ComplianceMatrixGenerator.tsx`
- `DeadlineCalculator.tsx`
- `ExecutiveSummaryGenerator.tsx`
- `GoNoGoDecisionTool.tsx`
- `GovConAcronymDecoder.tsx`
- `NaicsLookup.tsx`
- `PlainLanguageScorer.tsx`
- `ProposalOutlineGenerator.tsx`
- `PscLookup.tsx`
- `RfpResponseTemplateGenerator.tsx`
- `WinRateCalculator.tsx`
- `WordCounter.tsx`

Other pages (3):
- `Pricing.tsx`
- `SSOFinish.tsx`
- `SsoSetupGuide.tsx`

## Changes

For each file above, add the existing `SEO` component near the top of the rendered output:

```tsx
<SEO
  title="Proposal Word Counter — OptiRFP"
  description="Count words, characters, and reading time for RFP responses."
  canonical="https://optirfp.ai/tools/proposal-word-counter"
/>
```

Each page gets a unique, descriptive title (the tool's real name) and a one-sentence description. Canonicals self-reference the route on `optirfp.ai`.

## Why this fixes the analytics readability issue

Lovable's analytics panel lists URL paths today, but:
- Browser tabs, history, and bookmarks will now show the friendly title.
- Google Analytics / GSC / any third-party analytics records `document.title` alongside the path, making reports readable.
- Future in-app analytics views can fall back to titles when paths are ambiguous.

## Out of scope

- No changes to the Lovable analytics panel UI itself (not customizable from project code).
- No new in-app analytics views or path→name mapping (you picked the lighter option).
- No changes to pages that already use `SEO`/`useSEO`.

## Verification

After build, spot-check 2–3 routes in the preview: tab title should match the page, and `document.title` in DevTools should reflect the new value.
