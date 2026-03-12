
-- Fix 1: Add search_path to ensure_single_default_guideline function
CREATE OR REPLACE FUNCTION public.ensure_single_default_guideline()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix 2: Replace overly permissive INSERT policy on password_reset_attempts
DROP POLICY IF EXISTS "Users can insert password reset attempts" ON public.password_reset_attempts;

CREATE POLICY "Authenticated users can insert password reset attempts"
ON public.password_reset_attempts FOR INSERT
TO authenticated
WITH CHECK (true);
