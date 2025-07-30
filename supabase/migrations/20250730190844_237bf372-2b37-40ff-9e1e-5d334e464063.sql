-- Phase 4: Security & SSO Infrastructure
-- Create security events log table
CREATE TABLE IF NOT EXISTS public.security_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security audit log table (global security events)
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'security_events_log' 
    AND policyname = 'Organization members can view security events'
  ) THEN
    ALTER TABLE public.security_events_log ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Organization members can view security events"
    ON public.security_events_log
    FOR SELECT
    USING (user_belongs_to_organization(auth.uid(), organization_id));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'security_events_log' 
    AND policyname = 'System can insert security events'
  ) THEN
    CREATE POLICY "System can insert security events"
    ON public.security_events_log
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'security_audit_log' 
    AND policyname = 'System admins can view security audit log'
  ) THEN
    ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "System admins can view security audit log"
    ON public.security_audit_log
    FOR SELECT
    USING (is_system_admin() OR is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'security_audit_log' 
    AND policyname = 'System can insert security audit log'
  ) THEN
    CREATE POLICY "System can insert security audit log"
    ON public.security_audit_log
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_org_date ON public.security_events_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events_log(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_date ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user ON public.security_audit_log(user_id, created_at DESC);