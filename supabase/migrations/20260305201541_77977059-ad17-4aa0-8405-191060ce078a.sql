
-- Organization webhooks table
CREATE TABLE public.organization_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  secret_key TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 3,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  headers JSONB NOT NULL DEFAULT '{}',
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Webhook delivery logs
CREATE TABLE public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.organization_webhooks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Support tickets
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  sla_deadline_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Support ticket messages
CREATE TABLE public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_org_webhooks_org_id ON public.organization_webhooks(organization_id);
CREATE INDEX idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_org_id ON public.webhook_deliveries(organization_id);
CREATE INDEX idx_support_tickets_org_id ON public.support_tickets(organization_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);

-- RLS
ALTER TABLE public.organization_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- organization_webhooks policies
CREATE POLICY "Org members can view webhooks" ON public.organization_webhooks
  FOR SELECT TO authenticated
  USING (public.check_organization_membership(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage webhooks" ON public.organization_webhooks
  FOR ALL TO authenticated
  USING (public.check_organization_admin(auth.uid(), organization_id))
  WITH CHECK (public.check_organization_admin(auth.uid(), organization_id));

-- webhook_deliveries policies
CREATE POLICY "Org members can view deliveries" ON public.webhook_deliveries
  FOR SELECT TO authenticated
  USING (public.check_organization_membership(auth.uid(), organization_id));

CREATE POLICY "Service can insert deliveries" ON public.webhook_deliveries
  FOR INSERT TO authenticated
  WITH CHECK (public.check_organization_membership(auth.uid(), organization_id));

-- support_tickets policies
CREATE POLICY "Org members can view tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (public.check_organization_membership(auth.uid(), organization_id));

CREATE POLICY "Org members can create tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (public.check_organization_membership(auth.uid(), organization_id));

CREATE POLICY "Org members can update own tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (public.check_organization_membership(auth.uid(), organization_id));

-- support_ticket_messages policies
CREATE POLICY "Users can view messages for their org tickets" ON public.support_ticket_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets st 
    WHERE st.id = ticket_id 
    AND public.check_organization_membership(auth.uid(), st.organization_id)
  ));

CREATE POLICY "Users can add messages to their org tickets" ON public.support_ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets st 
    WHERE st.id = ticket_id 
    AND public.check_organization_membership(auth.uid(), st.organization_id)
  ));

-- Updated_at triggers
CREATE TRIGGER update_organization_webhooks_updated_at
  BEFORE UPDATE ON public.organization_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
