-- Clean up remaining legacy subscription policies for better security
-- Remove duplicate and potentially confusing policies

-- Remove old admin policies (replaced by consolidated admin policy)  
DROP POLICY IF EXISTS "Admin users can update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admin users can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can delete any subscription" ON public.subscriptions;

-- Remove duplicate user policies (replaced by consolidated user policy)
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;  
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;

-- Verify we have clean, secure policies only
-- Current policies should now be:
-- 1. "Users can manage their own subscriptions" - User access control
-- 2. "Admins can manage all subscriptions" - Admin access control  
-- 3. "Service role access for webhooks" - Service role access control