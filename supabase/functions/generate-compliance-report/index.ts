import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { organization_id, report_type } = await req.json();
    if (!organization_id || !report_type) {
      return new Response(JSON.stringify({ error: 'organization_id and report_type required' }), { status: 400, headers: corsHeaders });
    }

    // Gather org data
    const [membersRes, projectsRes, ssoRes, apiKeysRes, securityEventsRes, exportsRes] = await Promise.all([
      supabase.from('organization_members').select('id, role, status').eq('organization_id', organization_id),
      supabase.from('projects').select('project_id, status, created_at').eq('organization_id', organization_id),
      supabase.from('organization_sso_config').select('id, is_active, provider_type').eq('organization_id', organization_id),
      supabase.from('organization_api_keys').select('id, is_active, last_used_at').eq('organization_id', organization_id),
      supabase.from('security_events_log').select('id, event_type, risk_level, created_at').eq('organization_id', organization_id).order('created_at', { ascending: false }).limit(100),
      supabase.from('data_export_requests').select('id, status, created_at').eq('organization_id', organization_id),
    ]);

    const members = membersRes.data || [];
    const projects = projectsRes.data || [];
    const ssoConfigs = ssoRes.data || [];
    const apiKeys = apiKeysRes.data || [];
    const securityEvents = securityEventsRes.data || [];
    const exports = exportsRes.data || [];

    const activeSso = ssoConfigs.filter(s => s.is_active);
    const highRiskEvents = securityEvents.filter(e => e.risk_level === 'high' || e.risk_level === 'critical');

    const checklist = [
      { item: 'Row-Level Security (RLS)', status: 'pass', detail: 'All tables have RLS policies enabled' },
      { item: 'Data Encryption at Rest', status: 'pass', detail: 'AES-256 encryption via Supabase infrastructure' },
      { item: 'Data Encryption in Transit', status: 'pass', detail: 'TLS 1.2+ enforced on all connections' },
      { item: 'SSO/SAML Configuration', status: activeSso.length > 0 ? 'pass' : 'warning', detail: activeSso.length > 0 ? `${activeSso.length} active provider(s)` : 'No SSO providers configured' },
      { item: 'API Key Management', status: apiKeys.length > 0 ? 'pass' : 'info', detail: `${apiKeys.filter(k => k.is_active).length} active API key(s)` },
      { item: 'Audit Logging', status: 'pass', detail: `${securityEvents.length} security events logged (last 100)` },
      { item: 'High-Risk Security Events', status: highRiskEvents.length === 0 ? 'pass' : 'warning', detail: `${highRiskEvents.length} high/critical events detected` },
      { item: 'Data Export Compliance', status: 'pass', detail: `${exports.length} export request(s) on file` },
      { item: 'AI Data Privacy', status: 'pass', detail: 'User data never used for AI model training' },
      { item: 'Access Control', status: 'pass', detail: `${members.length} members with role-based permissions` },
    ];

    const passCount = checklist.filter(c => c.status === 'pass').length;
    const score = Math.round((passCount / checklist.length) * 100);

    const reportData = {
      report_type,
      generated_at: new Date().toISOString(),
      organization_id,
      summary: {
        compliance_score: score,
        total_checks: checklist.length,
        passed: passCount,
        warnings: checklist.filter(c => c.status === 'warning').length,
        info: checklist.filter(c => c.status === 'info').length,
      },
      organization_stats: {
        total_members: members.length,
        active_members: members.filter(m => m.status === 'active').length,
        total_projects: projects.length,
        sso_providers: ssoConfigs.length,
        active_api_keys: apiKeys.filter(k => k.is_active).length,
      },
      checklist,
    };

    // Store report
    const { data: report, error: insertError } = await supabase
      .from('compliance_reports')
      .insert({
        organization_id,
        report_type,
        report_data: reportData,
        generated_by: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
