

## Plan: Update Enterprise Tier Pricing & Value Presentation

### Overview
Update Enterprise from $299 to $499/month ($5,388/year → effectively $449/mo annual) across both the public pricing page and the internal subscription page. Enhance the Enterprise card with richer feature list, annual savings badge, subtitle, and multi-CTA layout.

### Changes

#### 1. `src/components/blocks/pricing-demo.tsx` — Update Enterprise plan data
- Change `price` from `"299"` to `"499"`
- Change `yearlyPrice` from `"2988"` to `"5388"` ($449/mo * 12)
- Update features list to the enhanced 11-item set (unlimited everything, SOC 2 & FedRAMP, dedicated CSM, 4-hour SLA, custom AI training, API & webhooks, SSO/SAML specifics, on-premise option, custom integrations, quarterly reviews, team training)
- Update `description` to "Custom solutions for organizations with 50+ users"
- Change `buttonText` to `"Schedule Demo"`

#### 2. `src/components/blocks/pricing/PricingCard.tsx` — Enhanced Enterprise rendering
- Update badge text from "For teams & gov contractors" to "For Enterprise Teams & Government"
- Add annual savings display: when `isEnterprise && isMonthly`, show "or $449/month billed annually" with a "Save $600/year" badge below the price
- Update `renderCTA` for Enterprise to show 3 buttons stacked:
  1. Primary filled blue button: "Schedule Demo" (opens `EnterpriseSalesModal`)
  2. Outline button: "Download Security Whitepaper" (links to `/security-whitepaper.pdf` or `#`)
  3. Ghost text link: "Contact Sales" (mailto:sales@optirfp.ai)
- Add a "Trusted by" section with 3 placeholder gray rectangles below features
- Upgrade Enterprise card shadow from `shadow-lg` to `shadow-xl`

#### 3. `src/components/subscription/SubscriptionPlans.tsx` — Update internal Enterprise card
- Change displayed price from "Custom Pricing" to `$499/mo` / `$5,388/yr` based on billing interval
- Update feature list to match the enhanced 11-item set
- Update CardDescription to "Custom solutions for organizations with 50+ users"
- Change CTA button text from "Contact Sales" to "Schedule Demo"

### Files Summary

| File | Action |
|------|--------|
| `src/components/blocks/pricing-demo.tsx` | Modify — update Enterprise plan object |
| `src/components/blocks/pricing/PricingCard.tsx` | Modify — enhanced Enterprise card UI |
| `src/components/subscription/SubscriptionPlans.tsx` | Modify — update Enterprise pricing & features |

