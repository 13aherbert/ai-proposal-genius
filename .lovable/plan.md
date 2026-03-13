

## Plan: Create `pricing_tiers` Table with Revised Seed Data

### Context
The project currently has a `subscription_plan_templates` table with old tier names (starter/basic/pro/enterprise/white_label) and outdated limits. The user wants a new `pricing_tiers` table with the revised OptiRFP pricing structure: Starter, Growth, Business, Enterprise — with unlimited users on all paid tiers.

### Changes

**1. New migration: Create `pricing_tiers` table + seed data**

```sql
CREATE TABLE public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  monthly_price INTEGER NOT NULL DEFAULT 0,  -- cents
  annual_price INTEGER,                       -- cents, null = contact sales
  projects_limit INTEGER NOT NULL,            -- -1 = unlimited
  users_limit INTEGER NOT NULL DEFAULT -1,    -- -1 = unlimited
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT free_tier_user_limit CHECK (users_limit = 1 OR monthly_price > 0)
);
```

- Enable RLS: public read, admin-only write (same pattern as `subscription_plan_templates`)
- Seed the 4 tiers with exact data from the request

**2. Update `subscription_plan_templates` seed data**
- Update existing rows to align with new tier names and limits (starter→12 projects, remove basic/pro, add growth/business)
- Or leave the old table as-is since the new `pricing_tiers` table is the source of truth for pricing display

### Seed data summary

| Tier | Monthly | Annual | Projects | Users | Key Features |
|------|---------|--------|----------|-------|-------------|
| Starter | $0 | $0 | 12 | 1 | basic_ai, watermarked_exports, community_support |
| Growth | $199 | $179/mo | 36 | ∞ | enhanced_ai, no_watermark, opportunity_search_10, email_support, team_collaboration |
| Business | $499 | $449/mo | 120 | ∞ | advanced_ai, unlimited_opportunity_search, api_access, priority_support, ai_evaluation, team_collaboration |
| Enterprise | $1499+ | contact | ∞ | ∞ | all_features, soc2_compliance, dedicated_csm, sso, on_premise, team_collaboration |

### Files
- **New**: `supabase/migrations/[timestamp]_create_pricing_tiers.sql`
- **Updated**: `src/integrations/supabase/types.ts` (auto-regenerated after migration)

