import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface HealthResult {
  ready: boolean;
  readiness: Record<string, boolean>;
  platform: { sb_mgmt_token_present: boolean; sso_encryption_key_present: boolean };
  recent_rate_limit_events_24h: number;
  providers: { name: string; type: string; active: boolean; configuration_complete: boolean; has_client_secret: boolean | null }[];
  domains: { domain: string; is_verified: boolean }[];
}

const CHECK_LABELS: Record<string, { label: string; hint: string }> = {
  domains_verified: { label: 'At least one domain verified', hint: 'Add and verify your email domain.' },
  provider_configured: { label: 'Active provider with complete config', hint: 'Add SAML or OIDC provider.' },
  oidc_secrets_set: { label: 'OIDC client secrets set', hint: 'Click the key icon on each OIDC provider.' },
  saml_token_present: { label: 'SAML management token present', hint: 'SB_MGMT_API_TOKEN is required for SAML provisioning.' },
  encryption_key_present: { label: 'Encryption key configured', hint: 'SSO_SECRET_ENCRYPTION_KEY is required to store OIDC secrets.' },
};

export function SSODiagnosticsCard({ organizationId }: { organizationId: string }) {
  const [data, setData] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    try {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sso-health-check?organization_id=${encodeURIComponent(organizationId)}`;
      const resp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Health check failed');
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to run health check');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { run(); }, [run]);

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">SSO diagnostics</CardTitle>
              <CardDescription>
                Live readiness check. <Link to="/docs/sso-setup" className="text-primary underline">Setup guide →</Link>
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={run} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!data && !error && (
          <p className="text-sm text-muted-foreground">Running checks…</p>
        )}
        {data && (
          <>
            <div className={`text-sm font-medium ${data.ready ? 'text-green-600' : 'text-amber-600'}`}>
              {data.ready ? '✓ SSO is ready to use.' : '⚠ SSO is not fully configured yet.'}
            </div>
            <ul className="space-y-1.5">
              {Object.entries(data.readiness).map(([key, ok]) => (
                <li key={key} className="flex items-start gap-2 text-sm">
                  {ok
                    ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    : <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                  <div>
                    <span className={ok ? '' : 'text-muted-foreground'}>{CHECK_LABELS[key]?.label || key}</span>
                    {!ok && CHECK_LABELS[key]?.hint && (
                      <span className="text-xs text-muted-foreground block">{CHECK_LABELS[key].hint}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="text-xs text-muted-foreground border-t pt-2">
              {data.recent_rate_limit_events_24h} rate-limit events in last 24h ·
              SAML token: {data.platform.sb_mgmt_token_present ? 'set' : 'missing'} ·
              Encryption key: {data.platform.sso_encryption_key_present ? 'set' : 'missing'}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
