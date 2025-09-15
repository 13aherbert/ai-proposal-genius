-- Fix security definer view issue by recreating the organization_metrics_summary view
-- with proper security settings and ensuring it uses SECURITY INVOKER

-- Drop the existing view
DROP VIEW IF EXISTS public.organization_metrics_summary;

-- Recreate the view with SECURITY INVOKER (which is the default and secure option)
CREATE VIEW public.organization_metrics_summary 
WITH (security_invoker = true) AS
SELECT 
    organization_analytics.organization_id,
    organization_analytics.metric_date,
    count(
        CASE
            WHEN organization_analytics.metric_type = 'projects_created'::text THEN 1
            ELSE NULL::integer
        END) AS projects_created,
    count(
        CASE
            WHEN organization_analytics.metric_type = 'users_active'::text THEN 1
            ELSE NULL::integer
        END) AS active_users,
    avg(
        CASE
            WHEN organization_analytics.metric_type = 'user_engagement_score'::text THEN organization_analytics.metric_value
            ELSE NULL::numeric
        END) AS avg_engagement,
    sum(
        CASE
            WHEN organization_analytics.metric_type = 'revenue_generated'::text THEN organization_analytics.metric_value
            ELSE NULL::numeric
        END) AS total_revenue
FROM organization_analytics
GROUP BY organization_analytics.organization_id, organization_analytics.metric_date;

-- Add comment explaining the security model
COMMENT ON VIEW public.organization_metrics_summary IS 
'Aggregated metrics view with SECURITY INVOKER to ensure RLS policies of the querying user are enforced';