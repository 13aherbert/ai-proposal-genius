-- CRITICAL SECURITY FIX: Enable RLS on subscription_plan_templates table
-- This table contains sensitive pricing and business model information

-- Enable Row Level Security on the vulnerable table
ALTER TABLE public.subscription_plan_templates ENABLE ROW LEVEL SECURITY;

-- Create secure access policies
-- 1. Allow public read access to see available subscription plans (this is typically needed for pricing pages)
CREATE POLICY "Public can view subscription plan templates"
ON public.subscription_plan_templates
FOR SELECT
USING (true);

-- 2. Only admins can manage subscription plan templates
CREATE POLICY "Admins can manage subscription plan templates"
ON public.subscription_plan_templates
FOR ALL
USING (is_admin_direct())
WITH CHECK (is_admin_direct());

-- Add security logging for plan template changes
CREATE OR REPLACE FUNCTION public.log_plan_template_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log changes to subscription plan templates for security monitoring
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      'plan_template_' || lower(TG_OP),
      COALESCE(NEW.id, OLD.id),
      jsonb_build_object(
        'plan_name', COALESCE(NEW.name, OLD.name),
        'action', TG_OP,
        'timestamp', NOW(),
        'admin_user', auth.uid()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger for audit logging
CREATE TRIGGER plan_template_audit_log
AFTER INSERT OR UPDATE OR DELETE ON public.subscription_plan_templates
FOR EACH ROW EXECUTE FUNCTION public.log_plan_template_change();

-- Add comment explaining the security model
COMMENT ON TABLE public.subscription_plan_templates IS 
'Subscription plan templates with RLS enabled: public read access for pricing display, admin-only write access for management.';

-- Verify RLS is now enabled (this is a verification comment, not executed code)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'subscription_plan_templates';