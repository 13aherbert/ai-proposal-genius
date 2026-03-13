-- Create pricing_tiers table
CREATE TABLE public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  monthly_price INTEGER NOT NULL DEFAULT 0,
  annual_price INTEGER,
  projects_limit INTEGER NOT NULL,
  users_limit INTEGER NOT NULL DEFAULT -1,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT free_tier_user_limit CHECK (users_limit = 1 OR monthly_price > 0)
);

-- Enable RLS
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view pricing tiers"
  ON public.pricing_tiers
  FOR SELECT
  TO public
  USING (true);

-- Admin-only write access
CREATE POLICY "Admins can manage pricing tiers"
  ON public.pricing_tiers
  FOR ALL
  TO public
  USING (is_admin_direct())
  WITH CHECK (is_admin_direct());

-- Seed data
INSERT INTO public.pricing_tiers (name, slug, monthly_price, annual_price, projects_limit, users_limit, features) VALUES
  ('Starter', 'starter', 0, 0, 12, 1, '["basic_ai", "watermarked_exports", "community_support"]'::jsonb),
  ('Growth', 'growth', 19900, 214800, 36, -1, '["enhanced_ai", "no_watermark", "opportunity_search_10", "email_support", "team_collaboration"]'::jsonb),
  ('Business', 'business', 49900, 538800, 120, -1, '["advanced_ai", "unlimited_opportunity_search", "api_access", "priority_support", "ai_evaluation", "team_collaboration"]'::jsonb),
  ('Enterprise', 'enterprise', 149900, NULL, -1, -1, '["all_features", "soc2_compliance", "dedicated_csm", "sso", "on_premise", "team_collaboration"]'::jsonb);