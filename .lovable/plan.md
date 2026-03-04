

## Plan: Add Social Proof Elements to OptiRFP

### Changes

**1. `src/components/blocks/SocialProofBar.tsx`** — NEW
- Stats bar with 3 items in a row: "Trusted by 500+ proposal teams", "93% faster proposal creation", "$20K+ average yearly savings"
- Dark card style matching hero (`bg-[#181818]/90`), icons for each stat (Users, Zap, DollarSign)
- Responsive: 3 columns desktop, stacked mobile

**2. `src/components/blocks/Testimonial.tsx`** — NEW
- Featured testimonial card with quote, 5-star rating (Star icons), author name/title/company
- Quote text, attribution below, centered layout
- Dark card style consistent with homepage

**3. `src/components/blocks/ROICalculator.tsx`** — NEW
- 3 inputs: RFPs/month (number), Hours per RFP (number), Hourly cost (number, $)
- Live calculation: `annual savings = rfps * hours * cost * 12 * 0.93` (93% time saved)
- Output: "Your annual savings: $X with OptiRFP" + "Most customers save $20,000+ per year"
- Dark card style, placed above pricing grid

**4. `src/components/blocks/TrustBadges.tsx`** — NEW
- 3 badges in a row: "SOC 2 Type II Certified" (Shield), "AES-256 Encryption" (Lock), "Your data never trains our AI" (Eye)
- Subtle styling, muted text with icons

**5. `src/pages/Index.tsx`** — Modify
- Insert `<SocialProofBar />` between hero and key benefits sections
- Insert `<Testimonial />` between key benefits and pricing sections

**6. `src/components/blocks/pricing-demo.tsx`** — Modify
- Add `<ROICalculator />` above the `<Pricing>` component

**7. `src/components/navigation/Footer.tsx`** — Modify
- Add `<TrustBadges />` row above the copyright/links section

