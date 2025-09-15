-- CRITICAL SECURITY FIX: Remove public access to subscriptions table
-- This fixes the subscription data exposure vulnerability

-- First, check if RLS is enabled (it should be)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop the dangerous policy that allows unrestricted access
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;

-- Drop overlapping/duplicate policies to clean up
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can read their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable insert for service role only" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable update for service role only" ON public.subscriptions;

-- Create secure, consolidated policies
-- 1. Users can only access their own subscription data
CREATE POLICY "Users can manage their own subscriptions"
ON public.subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Admins can view and manage all subscriptions (for support purposes)
CREATE POLICY "Admins can manage all subscriptions"
ON public.subscriptions
FOR ALL
USING (is_admin_direct())
WITH CHECK (is_admin_direct());

-- 3. Service role can manage subscriptions (for automated systems like Stripe webhooks)
-- This is secure because service_role bypasses RLS entirely when using the service key
CREATE POLICY "Service role access for webhooks"
ON public.subscriptions
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add security logging for subscription access
CREATE OR REPLACE FUNCTION public.log_subscription_access(
  subscription_id_param uuid, 
  action_type_param text,
  user_id_param uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log subscription access for security monitoring
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    target_user_id,
    details
  ) VALUES (
    'subscription_access',
    user_id_param,
    (SELECT user_id FROM public.subscriptions WHERE subscription_id = subscription_id_param),
    jsonb_build_object(
      'subscription_id', subscription_id_param,
      'action', action_type_param,
      'timestamp', NOW(),
      'ip_address', inet_client_addr()
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If logging fails, don't break the subscription operation
    NULL;
END;
$$;

-- Add trigger to log subscription access (optional, for high-security environments)
-- Uncomment if you want detailed access logging:
-- CREATE OR REPLACE FUNCTION public.trigger_log_subscription_access()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   PERFORM public.log_subscription_access(
--     COALESCE(NEW.subscription_id, OLD.subscription_id),
--     TG_OP
--   );
--   RETURN COALESCE(NEW, OLD);
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER subscription_access_log
-- AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.subscriptions
-- FOR EACH ROW EXECUTE FUNCTION public.trigger_log_subscription_access();

-- Add comment explaining the security model
COMMENT ON TABLE public.subscriptions IS 
'Subscription data with strict RLS policies: users can only access their own data, admins have full access for support, service role for automated systems.';

-- Verify RLS is working by testing access
-- This query should only return subscriptions for the current user when RLS is active
-- (This is just a verification comment, not executed code)