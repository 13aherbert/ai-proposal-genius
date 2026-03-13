

## Plan: Revamp UpgradeGateModal with Comparison Table and Value Calculation

### Changes to `src/components/subscription/UpgradeGateModal.tsx`

Replace the current two-column feature-list layout with:

**For `user_limit` reason:**
- Headline: "Add Your Entire Team"
- Subheadline: "Upgrade to invite unlimited team members"
- Comparison table (4 rows): Price ($0 → $199/mo), Projects (12 → 36), Team Members (1 user → Unlimited 🚀 highlighted), Support (Community → Email 24hr)
- Value calculation block: "For a 12-person team:" — OptiRFP $16.50/person vs Loopio $1,667/person — "Save 99% per user"
- Primary CTA: "Upgrade to Growth — $199/month"
- Secondary CTA: "Start with 14-day free trial"

**For `project_limit` reason:**
- Headline: "You've used 12 of 12 projects"
- Subheadline: "Upgrade for 3x more projects + unlimited team"
- Same comparison table as above
- Keep archive-project footnote
- Primary CTA: "Upgrade to Growth — $199/month"
- Secondary CTA: "Start with 14-day free trial"

**Implementation details:**
- Replace the two-card grid with a styled HTML table (using existing Table components or simple markup)
- Highlight the "Unlimited 🚀" cell in the Team Members row with `text-brand-green font-bold`
- Add a value calculation `div` with a muted background showing the per-user cost comparison
- Keep "See all plans" and "Maybe later" buttons
- Import `Users` icon from lucide-react for the headline area

### File touched
- **Modified**: `src/components/subscription/UpgradeGateModal.tsx`

