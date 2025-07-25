export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, string | number | boolean>;
}

export interface UserProperties {
  user_id?: string;
  subscription_plan?: string;
  organization_size?: string;
  industry?: string;
  user_role?: string;
}

export interface ProposalWorkflowEvent {
  project_id: string;
  step: 'rfp_upload' | 'analysis' | 'outline' | 'content_generation' | 'evaluation' | 'export';
  method?: 'manual' | 'automated';
  success: boolean;
  duration_ms?: number;
}

export interface FeatureUsageEvent {
  feature: string;
  action: 'view' | 'interact' | 'complete';
  context?: string;
}

export interface SubscriptionEvent {
  action: 'upgrade' | 'downgrade' | 'cancel' | 'renew';
  from_plan?: string;
  to_plan?: string;
}

export type CustomEvent = 
  | ProposalWorkflowEvent 
  | FeatureUsageEvent 
  | SubscriptionEvent
  | AnalyticsEvent;