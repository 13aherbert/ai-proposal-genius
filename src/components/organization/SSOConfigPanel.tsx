import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Plus, Trash2, Settings, Loader2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { toast } from 'sonner';

interface SSOConfig {
  id: string;
  provider_type: string;
  provider_name: string;
  is_active: boolean;
  configuration: Record<string, any>;
}

const PROVIDER_TEMPLATES: Record<string, { label: string; fields: { key: string; label: string; placeholder: string; type?: string }[] }> = {
  okta: {
    label: 'Okta',
    fields: [
      { key: 'sso_url', label: 'SSO URL', placeholder: 'https://yourorg.okta.com/app/xxx/sso/saml' },
      { key: 'entity_id', label: 'Entity ID / Issuer', placeholder: 'http://www.okta.com/xxx' },
      { key: 'certificate', label: 'X.509 Certificate', placeholder: 'Paste the certificate here...', type: 'textarea' },
    ],
  },
  azure_ad: {
    label: 'Microsoft Azure AD',
    fields: [
      { key: 'sso_url', label: 'Login URL', placeholder: 'https://login.microsoftonline.com/xxx/saml2' },
      { key: 'entity_id', label: 'Azure AD Identifier', placeholder: 'https://sts.windows.net/xxx/' },
      { key: 'certificate', label: 'Certificate (Base64)', placeholder: 'Paste the certificate here...', type: 'textarea' },
    ],
  },
  onelogin: {
    label: 'OneLogin',
    fields: [
      { key: 'sso_url', label: 'SAML Endpoint', placeholder: 'https://yourorg.onelogin.com/trust/saml2/http-post/sso/xxx' },
      { key: 'entity_id', label: 'Issuer URL', placeholder: 'https://app.onelogin.com/saml/metadata/xxx' },
      { key: 'certificate', label: 'X.509 Certificate', placeholder: 'Paste the certificate here...', type: 'textarea' },
    ],
  },
  custom_saml: {
    label: 'Custom SAML 2.0',
    fields: [
      { key: 'sso_url', label: 'SSO URL', placeholder: 'https://idp.example.com/saml/sso' },
      { key: 'entity_id', label: 'Entity ID', placeholder: 'https://idp.example.com' },
      { key: 'certificate', label: 'X.509 Certificate', placeholder: 'Paste the certificate here...', type: 'textarea' },
    ],
  },
};

export function SSOConfigPanel() {
  const { organization } = useCurrentOrganization();
  const [configs, setConfigs] = useState<SSOConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [providerName, setProviderName] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [ssoRequired, setSsoRequired] = useState(false);
  const [passwordFallback, setPasswordFallback] = useState(true);

  useEffect(() => {
    if (!organization?.id) return;
    loadConfigs();
  }, [organization?.id]);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const [{ data: ssoConfigs }, { data: org }] = await Promise.all([
        supabase.from('organization_sso_config').select('*').eq('organization_id', organization!.id),
        supabase.from('organizations').select('sso_enabled, sso_required, sso_allow_password_fallback').eq('id', organization!.id).single(),
      ]);
      setConfigs((ssoConfigs || []).map(c => ({ ...c, configuration: c.configuration as Record<string, any> })));
      setSsoEnabled(org?.sso_enabled ?? false);
      setSsoRequired(org?.sso_required ?? false);
      setPasswordFallback(org?.sso_allow_password_fallback ?? true);
    } catch (err) {
      console.error('Failed to load SSO configs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProvider = async () => {
    if (!selectedProvider || !providerName.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('organization_sso_config').insert({
        organization_id: organization!.id,
        provider_type: 'saml',
        provider_name: providerName,
        configuration: fieldValues,
        is_active: true,
      });
      if (error) throw error;

      // Enable SSO on org
      await supabase.from('organizations').update({ sso_enabled: true }).eq('id', organization!.id);
      setSsoEnabled(true);

      toast.success('SSO provider added', { description: `${providerName} has been configured.` });
      setShowAddDialog(false);
      resetForm();
      loadConfigs();
    } catch (err: any) {
      toast.error('Failed to save SSO provider', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProvider = async (configId: string, active: boolean) => {
    try {
      const { error } = await supabase.from('organization_sso_config').update({ is_active: active }).eq('id', configId);
      if (error) throw error;
      setConfigs(prev => prev.map(c => c.id === configId ? { ...c, is_active: active } : c));
      toast.success(active ? 'Provider activated' : 'Provider deactivated');
    } catch (err: any) {
      toast.error('Failed to update provider', { description: err.message });
    }
  };

  const deleteProvider = async (configId: string) => {
    try {
      const { error } = await supabase.from('organization_sso_config').delete().eq('id', configId);
      if (error) throw error;
      setConfigs(prev => prev.filter(c => c.id !== configId));
      toast.success('SSO provider removed');
    } catch (err: any) {
      toast.error('Failed to delete provider', { description: err.message });
    }
  };

  const updateOrgSSOSettings = async (field: string, value: boolean) => {
    try {
      const { error } = await supabase.from('organizations').update({ [field]: value }).eq('id', organization!.id);
      if (error) throw error;
      if (field === 'sso_required') setSsoRequired(value);
      if (field === 'sso_allow_password_fallback') setPasswordFallback(value);
      toast.success('SSO settings updated');
    } catch (err: any) {
      toast.error('Failed to update', { description: err.message });
    }
  };

  const resetForm = () => {
    setSelectedProvider('');
    setProviderName('');
    setFieldValues({});
  };

  const template = PROVIDER_TEMPLATES[selectedProvider];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Single Sign-On (SSO)</CardTitle>
                <CardDescription>Configure SAML 2.0 identity providers for your organization</CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Provider
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* SSO Settings */}
          {configs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">SSO Policy</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Require SSO for all members</p>
                    <p className="text-xs text-muted-foreground">Members must sign in through SSO</p>
                  </div>
                  <Switch checked={ssoRequired} onCheckedChange={(v) => updateOrgSSOSettings('sso_required', v)} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Allow password fallback</p>
                    <p className="text-xs text-muted-foreground">Let users sign in with email/password if SSO is unavailable</p>
                  </div>
                  <Switch checked={passwordFallback} onCheckedChange={(v) => updateOrgSSOSettings('sso_allow_password_fallback', v)} />
                </div>
              </div>
            </div>
          )}

          {/* Provider List */}
          {configs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No SSO providers configured</p>
              <p className="text-sm mt-1">Add an identity provider to enable single sign-on</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Identity Providers</h4>
              {configs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {config.is_active ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{config.provider_name}</p>
                      <p className="text-xs text-muted-foreground">SAML 2.0 • {config.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={config.is_active} onCheckedChange={(v) => toggleProvider(config.id, v)} />
                    <Button size="icon" variant="ghost" onClick={() => deleteProvider(config.id)}>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add SSO Provider</DialogTitle>
            <DialogDescription>Configure a SAML 2.0 identity provider</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Provider Type</Label>
              <Select value={selectedProvider} onValueChange={(v) => { setSelectedProvider(v); setProviderName(PROVIDER_TEMPLATES[v]?.label || ''); setFieldValues({}); }}>
                <SelectTrigger><SelectValue placeholder="Select a provider" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROVIDER_TEMPLATES).map(([key, tmpl]) => (
                    <SelectItem key={key} value={key}>{tmpl.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {template && (
              <>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="e.g. Corporate Okta" />
                </div>
                {template.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={fieldValues[field.key] || ''}
                        onChange={(e) => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        rows={4}
                        className="font-mono text-xs"
                      />
                    ) : (
                      <Input
                        value={fieldValues[field.key] || ''}
                        onChange={(e) => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>Cancel</Button>
            <Button onClick={saveProvider} disabled={!selectedProvider || !providerName.trim() || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
