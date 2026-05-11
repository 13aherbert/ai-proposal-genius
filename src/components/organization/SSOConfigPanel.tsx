import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Plus, Trash2, Loader2, CheckCircle2, XCircle, Globe, Copy, RefreshCw, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { toast } from 'sonner';

interface SSOConfig {
  id: string;
  provider_type: string;
  provider_name: string;
  is_active: boolean;
  configuration: Record<string, unknown>;
}

interface OrgDomain {
  id: string;
  domain: string;
  is_verified: boolean;
  verified_at: string | null;
  verification_token: string;
}

export function SSOConfigPanel() {
  const { organization } = useCurrentOrganization();
  const [configs, setConfigs] = useState<SSOConfig[]>([]);
  const [domains, setDomains] = useState<OrgDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [ssoRequired, setSsoRequired] = useState(false);
  const [ssoAutoRedirect, setSsoAutoRedirect] = useState(false);
  const [passwordFallback, setPasswordFallback] = useState(true);

  // Add domain
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Add provider dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [providerKind, setProviderKind] = useState<'native' | 'oidc'>('native');
  const [isSaving, setIsSaving] = useState(false);
  // Native SAML
  const [metadataUrl, setMetadataUrl] = useState('');
  const [metadataXml, setMetadataXml] = useState('');
  // OIDC
  const [oidcName, setOidcName] = useState('');
  const [oidcDiscovery, setOidcDiscovery] = useState('');
  const [oidcClientId, setOidcClientId] = useState('');
  const [oidcClientSecret, setOidcClientSecret] = useState('');

  // Rotate-secret dialog
  const [rotateForId, setRotateForId] = useState<string | null>(null);
  const [rotateValue, setRotateValue] = useState('');
  const [rotating, setRotating] = useState(false);

  const loadAll = useCallback(async () => {
    if (!organization?.id) return;
    setIsLoading(true);
    try {
      const [{ data: ssoConfigs }, { data: org }, { data: doms }] = await Promise.all([
        supabase.from('organization_sso_config').select('*').eq('organization_id', organization.id),
        supabase.from('organizations').select('sso_enabled, sso_required, sso_allow_password_fallback, sso_auto_redirect').eq('id', organization.id).single(),
        supabase.from('organization_domains').select('id, domain, is_verified, verified_at, verification_token').eq('organization_id', organization.id).order('created_at'),
      ]);
      setConfigs((ssoConfigs || []).map(c => ({ ...c, configuration: c.configuration as Record<string, unknown> })));
      setSsoEnabled(org?.sso_enabled ?? false);
      setSsoRequired(org?.sso_required ?? false);
      setSsoAutoRedirect(org?.sso_auto_redirect ?? false);
      setPasswordFallback(org?.sso_allow_password_fallback ?? true);
      setDomains((doms || []) as OrgDomain[]);
    } catch (err) {
      console.error('Failed to load SSO data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const updateOrgFlag = async (field: string, value: boolean) => {
    try {
      const { error } = await supabase.from('organizations').update({ [field]: value }).eq('id', organization!.id);
      if (error) throw error;
      if (field === 'sso_required') setSsoRequired(value);
      if (field === 'sso_allow_password_fallback') setPasswordFallback(value);
      if (field === 'sso_auto_redirect') setSsoAutoRedirect(value);
      toast.success('SSO settings updated');
    } catch (err: unknown) {
      toast.error('Failed to update', { description: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const addDomain = async () => {
    const d = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) {
      toast.error('Enter a valid domain like company.com');
      return;
    }
    setAddingDomain(true);
    try {
      const { error } = await supabase.from('organization_domains').insert({
        organization_id: organization!.id,
        domain: d,
      });
      if (error) throw error;
      setNewDomain('');
      await loadAll();
      toast.success('Domain added — add the TXT record then click Verify');
    } catch (err: unknown) {
      toast.error('Failed to add domain', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setAddingDomain(false);
    }
  };

  const verifyDomain = async (domainId: string) => {
    setVerifyingId(domainId);
    try {
      const { data, error } = await supabase.functions.invoke('verify-organization-domain', {
        body: { domainId },
      });
      if (error) throw error;
      if (data?.verified) {
        toast.success('Domain verified');
        await loadAll();
      } else {
        toast.error('TXT record not found yet', {
          description: `Expected ${data?.expected} on ${data?.host}. DNS can take a few minutes to propagate.`,
        });
      }
    } catch (err: unknown) {
      toast.error('Verification failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setVerifyingId(null);
    }
  };

  const removeDomain = async (domainId: string) => {
    try {
      const { error } = await supabase.from('organization_domains').delete().eq('id', domainId);
      if (error) throw error;
      await loadAll();
      toast.success('Domain removed');
    } catch (err: unknown) {
      toast.error('Failed to remove', { description: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const copyTxt = (token: string, domain: string) => {
    navigator.clipboard.writeText(`optirfp-verify=${token}`);
    toast.success(`TXT value copied`, { description: `Add it as a TXT record on _optirfp-verification.${domain}` });
  };

  const verifiedDomains = domains.filter(d => d.is_verified);

  const saveNativeProvider = async () => {
    if (verifiedDomains.length === 0) {
      toast.error('Verify at least one domain first');
      return;
    }
    if (!metadataUrl && !metadataXml.trim()) {
      toast.error('Provide either an IdP metadata URL or paste the metadata XML');
      return;
    }
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('provision-sso-provider', {
        body: {
          organizationId: organization!.id,
          metadataUrl: metadataUrl || undefined,
          metadataXml: metadataXml || undefined,
        },
      });
      if (error) throw error;
      toast.success('SAML provider registered', {
        description: `ACS URL: ${data.acsUrl}`,
      });
      setShowAddDialog(false);
      resetForm();
      await loadAll();
    } catch (err: unknown) {
      toast.error('Provisioning failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsSaving(false);
    }
  };

  const saveOidcProvider = async () => {
    if (verifiedDomains.length === 0) {
      toast.error('Verify at least one domain first');
      return;
    }
    if (!oidcName.trim() || !oidcDiscovery || !oidcClientId) {
      toast.error('Provider name, discovery URL, and client ID are required');
      return;
    }
    setIsSaving(true);
    try {
      // Fetch discovery doc to populate endpoints
      const dRes = await fetch(oidcDiscovery);
      if (!dRes.ok) throw new Error(`Discovery doc returned ${dRes.status}`);
      const disc = await dRes.json();

      const { data: inserted, error } = await supabase.from('organization_sso_config').insert({
        organization_id: organization!.id,
        provider_type: 'oidc',
        provider_name: oidcName,
        is_active: true,
        configuration: {
          discovery_url: oidcDiscovery,
          issuer: disc.issuer,
          authorize_endpoint: disc.authorization_endpoint,
          token_endpoint: disc.token_endpoint,
          jwks_uri: disc.jwks_uri,
          client_id: oidcClientId,
          scopes: 'openid email profile',
          default_role: 'viewer',
        },
      }).select('id').single();
      if (error) throw error;

      // Store client secret separately (encrypted) via edge function
      if (oidcClientSecret && inserted?.id) {
        const { error: secErr } = await supabase.functions.invoke('sso-set-client-secret', {
          body: { sso_config_id: inserted.id, client_secret: oidcClientSecret },
        });
        if (secErr) {
          toast.warning('Provider saved, but failed to store client secret', {
            description: 'Use "Set client secret" on the provider to retry.',
          });
        }
      }

      await supabase.from('organizations').update({ sso_enabled: true }).eq('id', organization!.id);
      toast.success('OIDC provider added');
      setShowAddDialog(false);
      resetForm();
      await loadAll();
    } catch (err: unknown) {
      toast.error('Failed to save', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProvider = async (id: string, active: boolean) => {
    await supabase.from('organization_sso_config').update({ is_active: active }).eq('id', id);
    await loadAll();
  };

  const deleteProvider = async (id: string) => {
    await supabase.from('organization_sso_config').delete().eq('id', id);
    await loadAll();
  };

  const submitRotateSecret = async () => {
    if (!rotateForId || !rotateValue.trim()) return;
    setRotating(true);
    try {
      const { error } = await supabase.functions.invoke('sso-set-client-secret', {
        body: { sso_config_id: rotateForId, client_secret: rotateValue.trim() },
      });
      if (error) throw error;
      toast.success('Client secret updated');
      setRotateForId(null);
      setRotateValue('');
    } catch (err: unknown) {
      toast.error('Failed to update secret', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setRotating(false);
    }
  };

  const resetForm = () => {
    setProviderKind('native');
    setMetadataUrl(''); setMetadataXml('');
    setOidcName(''); setOidcDiscovery(''); setOidcClientId(''); setOidcClientSecret('');
  };

  if (isLoading) {
    return <Card><CardContent className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;
  }

  return (
    <>
      {/* Domains */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Email domains</CardTitle>
              <CardDescription>Verify domains your organization owns. SSO is offered to users whose email matches a verified domain.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2">
            <Input placeholder="company.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDomain()} />
            <Button onClick={addDomain} disabled={addingDomain || !newDomain.trim()}>
              {addingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-1">Add</span>
            </Button>
          </div>

          {domains.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No domains added yet.</p>
          ) : (
            <div className="space-y-3">
              {domains.map((d) => (
                <div key={d.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {d.is_verified ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <p className="font-medium text-sm">{d.domain}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.is_verified ? `Verified ${d.verified_at ? new Date(d.verified_at).toLocaleDateString() : ''}` : 'Awaiting verification'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!d.is_verified && (
                        <Button size="sm" variant="outline" onClick={() => verifyDomain(d.id)} disabled={verifyingId === d.id}>
                          {verifyingId === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          <span className="ml-1">Verify</span>
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => removeDomain(d.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {!d.is_verified && (
                    <div className="bg-muted/50 rounded p-3 space-y-2 text-xs">
                      <p className="font-medium">Add this TXT record at your DNS provider:</p>
                      <div className="grid grid-cols-[80px_1fr] gap-2">
                        <span className="text-muted-foreground">Host</span>
                        <code className="break-all">_optirfp-verification.{d.domain}</code>
                        <span className="text-muted-foreground">Value</span>
                        <div className="flex items-center gap-2">
                          <code className="break-all flex-1">optirfp-verify={d.verification_token}</code>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyTxt(d.verification_token, d.domain)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Providers + Policy */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Single Sign-On</CardTitle>
                <CardDescription>Configure SAML or OIDC identity providers</CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowAddDialog(true)} disabled={verifiedDomains.length === 0}>
              <Plus className="h-4 w-4 mr-1" /> Add Provider
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {verifiedDomains.length === 0 && (
            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              Verify at least one email domain above before adding an identity provider.
            </div>
          )}

          {configs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Sign-in policy</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Require SSO for all members</p>
                    <p className="text-xs text-muted-foreground">Block password sign-in for users on verified domains</p>
                  </div>
                  <Switch checked={ssoRequired} onCheckedChange={(v) => updateOrgFlag('sso_required', v)} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Auto-redirect to SSO</p>
                    <p className="text-xs text-muted-foreground">Skip password screen for users on verified domains</p>
                  </div>
                  <Switch checked={ssoAutoRedirect} onCheckedChange={(v) => updateOrgFlag('sso_auto_redirect', v)} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Allow password fallback</p>
                    <p className="text-xs text-muted-foreground">Let users sign in with email/password if SSO is unavailable</p>
                  </div>
                  <Switch checked={passwordFallback} onCheckedChange={(v) => updateOrgFlag('sso_allow_password_fallback', v)} />
                </div>
              </div>
            </div>
          )}

          {configs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No identity providers configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Identity providers</h4>
              {configs.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {c.is_active ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-muted-foreground" />}
                    <div>
                      <p className="font-medium text-sm">{c.provider_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {c.provider_type === 'supabase_native' ? 'SAML (Native)' : c.provider_type === 'oidc' ? 'OIDC' : 'SAML (Legacy)'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{c.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.provider_type === 'oidc' && (
                      <Button size="icon" variant="ghost" title="Set / rotate client secret"
                        onClick={() => { setRotateForId(c.id); setRotateValue(''); }}>
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    )}
                    <Switch checked={c.is_active} onCheckedChange={(v) => toggleProvider(c.id, v)} />
                    <Button size="icon" variant="ghost" onClick={() => deleteProvider(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Provider Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(o) => { setShowAddDialog(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add identity provider</DialogTitle>
            <DialogDescription>Choose SAML (recommended for most enterprise IdPs) or OIDC.</DialogDescription>
          </DialogHeader>
          <Tabs value={providerKind} onValueChange={(v) => setProviderKind(v as 'native' | 'oidc')}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="native">SAML 2.0</TabsTrigger>
              <TabsTrigger value="oidc">OIDC</TabsTrigger>
            </TabsList>

            <TabsContent value="native" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Paste your IdP's metadata URL or XML. We'll register the provider and return the
                ACS URL and Entity ID for you to paste into the IdP.
              </p>
              <div className="space-y-2">
                <Label>Metadata URL (preferred)</Label>
                <Input value={metadataUrl} onChange={(e) => setMetadataUrl(e.target.value)} placeholder="https://idp.example.com/app/xxx/sso/saml/metadata" />
              </div>
              <div className="space-y-2">
                <Label>Or paste Metadata XML</Label>
                <Textarea value={metadataXml} onChange={(e) => setMetadataXml(e.target.value)} rows={5} className="font-mono text-xs" placeholder="<EntityDescriptor ...>" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={saveNativeProvider} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Register provider
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="oidc" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Register OptiRFP as an OAuth/OIDC application in your IdP using this redirect URI:
                <br />
                <code className="text-foreground">{`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sso-oidc-callback`}</code>
              </p>
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input value={oidcName} onChange={(e) => setOidcName(e.target.value)} placeholder="e.g. Corporate Okta (OIDC)" />
              </div>
              <div className="space-y-2">
                <Label>Discovery URL (.well-known/openid-configuration)</Label>
                <Input value={oidcDiscovery} onChange={(e) => setOidcDiscovery(e.target.value)} placeholder="https://idp.example.com/.well-known/openid-configuration" />
              </div>
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input value={oidcClientId} onChange={(e) => setOidcClientId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Client secret (optional for public clients with PKCE)</Label>
                <Input type="password" value={oidcClientSecret} onChange={(e) => setOidcClientSecret(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={saveOidcProvider} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save provider
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
