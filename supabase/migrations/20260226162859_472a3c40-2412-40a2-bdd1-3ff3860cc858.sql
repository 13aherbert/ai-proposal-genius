
-- Create organization_brand_guidelines table
CREATE TABLE public.organization_brand_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  is_default BOOLEAN NOT NULL DEFAULT false,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  header_font TEXT DEFAULT 'Inter',
  body_font TEXT DEFAULT 'Georgia',
  header_style TEXT DEFAULT 'accent-bar',
  cover_layout TEXT DEFAULT 'centered',
  margins TEXT DEFAULT 'normal',
  section_numbering BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_brand_guidelines ENABLE ROW LEVEL SECURITY;

-- Org members can read
CREATE POLICY "Organization members can view brand guidelines"
  ON public.organization_brand_guidelines
  FOR SELECT
  USING (user_belongs_to_organization(auth.uid(), organization_id));

-- Owners/admins can insert
CREATE POLICY "Organization admins can insert brand guidelines"
  ON public.organization_brand_guidelines
  FOR INSERT
  WITH CHECK (user_belongs_to_organization(auth.uid(), organization_id));

-- Owners/admins can update
CREATE POLICY "Organization admins can update brand guidelines"
  ON public.organization_brand_guidelines
  FOR UPDATE
  USING (user_belongs_to_organization(auth.uid(), organization_id));

-- Owners/admins can delete
CREATE POLICY "Organization admins can delete brand guidelines"
  ON public.organization_brand_guidelines
  FOR DELETE
  USING (user_belongs_to_organization(auth.uid(), organization_id));

-- Trigger to ensure only one default per org
CREATE OR REPLACE FUNCTION public.ensure_single_default_guideline()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.organization_brand_guidelines
    SET is_default = false, updated_at = now()
    WHERE organization_id = NEW.organization_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ensure_single_default_guideline
  BEFORE INSERT OR UPDATE ON public.organization_brand_guidelines
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_guideline();
