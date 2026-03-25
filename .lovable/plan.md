

## Plan: Add "AI & Data Privacy" Section to Security Page

### What
Add a new dedicated section between the Security Highlights grid and the Compliance Documentation section on `/security`. It will explicitly state that user data is never used to train AI models and list data processing safeguards.

### Content
A new full-width section with a distinct card containing:

1. **Headline**: "AI & Data Privacy" with an `EyeOff` icon
2. **Lead statement**: Bold callout — "Your data is never used to train AI models."
3. **Safeguard items** (using the same `CheckCircle2` list pattern as existing sections):
   - **No AI training on your data** — Your documents, proposals, and knowledge base content are never used to train, fine-tune, or improve any AI model.
   - **Ephemeral processing** — Data sent to AI providers is processed in real-time and not stored or retained after the response is generated.
   - **Third-party provider policies** — We use Google Gemini and Anthropic Claude, both of which contractually exclude API inputs from model training under their standard API terms.
   - **Data isolation** — Each organization's data is logically isolated via row-level security. No cross-tenant data access is possible.
   - **You own your data** — Export or delete your data at any time. We never claim ownership of your content.

### Technical Details
- Add `EyeOff` to the lucide imports in `Security.tsx`
- Insert a new `<section>` block after the Security Highlights grid (after the closing `</section>` around line 145) and before the Compliance Documentation section
- Use the same `motion.div` scroll-reveal pattern and `Card` styling as the rest of the page
- Style the lead statement as a larger, bold callout with a subtle primary-tinted background badge

