import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Key, CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { cn } from "@/lib/utils";

interface SSOConfig {
  id: string;
  provider_type: 'saml' | 'oauth' | 'oidc';
  provider_name: string;
  configuration: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProviderTemplate {
  name: string;
  type: 'saml' | 'oauth' | 'oidc';
  icon: string;
  config: Record<string, string>;
  attributeMappings: Record<string, string>;
}

const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  {
    name: 'SAML 2.0 (Generic)',
    type: 'saml',
    icon: '🔐',
    config: { entity_id: '', sso_url: '', certificate: '' },
    attributeMappings: { email: 'email', firstName: 'firstName', lastName: 'lastName' },
  },
  {
    name: 'Okta',
    type: 'saml',
    icon: '🟦',
    config: {
      entity_id: 'https://{your-domain}.okta.com',
      sso_url: 'https://{your-domain}.okta.com/app/{app-id}/sso/saml',
      certificate: '',
    },
    attributeMappings: { email: 'user.email', firstName: 'user.firstName', lastName: 'user.lastName' },
  },
  {
    name: 'Azure AD',
    type: 'saml',
    icon: '🔷',
    config: {
      entity_id: 'https://sts.windows.net/{tenant-id}/',
      sso_url: 'https://login.microsoftonline.com/{tenant-id}/saml2',
      certificate: '',
    },
    attributeMappings: { email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress', firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname', lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname' },
  },
  {
    name: 'Google Workspace',
    type: 'saml',
    icon: '🟡',
    config: {
      entity_id: 'https://accounts.google.com/o/saml2?idpid={idp-id}',
      sso_url: 'https://accounts.google.com/o/saml2/idp?idpid={idp-id}',
      certificate: '',
    },
    attributeMappings: { email: 'email', firstName: 'first_name', lastName: 'last_name' },
  },
  {
    name: 'OneLogin',
    type: 'saml',
    icon: '🟣',
    config: {
      entity_id: 'https://{subdomain}.onelogin.com/saml/metadata/{app-id}',
      sso_url: 'https://{subdomain}.onelogin.com/trust/saml2/http-post/sso/{app-id}',
      certificate: '',
    },
    attributeMappings: { email: 'User.email', firstName: 'User.FirstName', lastName: 'User.LastName' },
  },
];

async function invokeSSOFunction(action: string, organizationId: string, configId?: string, configData?: any) {
  const { data, error } = await supabase.functions.invoke('manage-sso-config', {
    body: { action, organizationId, configId, configData },
  });
  if (error) throw new Error(error.message || 'SSO operation failed');
  if (data?.error) throw new Error(data.error);
  return data;
}

const STEPS = ['Choose Provider', 'Configure', 'Test', 'Enable'];

export function SSOConfiguration() {
  const { organization } = useCurrentOrganization();
  const [ssoConfigs, setSsoConfigs] = useState<SSOConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wizardStep, setWizardStep] = useState(-1); // -1 = list view
  const [selectedTemplate, setSelectedTemplate] = useState<ProviderTemplate | null>(null);
  const [configFields, setConfigFields] = useState({ entity_id: '', sso_url: '', certificate: '' });
  const [attributeMappings, setAttributeMappings] = useState({ email: '', firstName: '', lastName: '' });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ssoSettings, setSsoSettings] = useState({ sso_required: false, allow_password_fallback: true });

  useEffect(() => {
    if (organization) fetchSSOConfigs();
  }, [organization]);

  const fetchSSOConfigs = async () => {
    if (!organization?.id) return;
    try {
      setIsLoading(true);
      const result = await invokeSSOFunction('list', organization.id);
      setSsoConfigs(result.data as SSOConfig[] || []);
    } catch (error: any) {
      console.error('Error fetching SSO configs:', error);
      toast.error("Failed to load SSO configurations");
    } finally {
      setIsLoading(false);
    }
  };

  const startWizard = (template?: ProviderTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setConfigFields({ entity_id: template.config.entity_id || '', sso_url: template.config.sso_url || '', certificate: template.config.certificate || '' });
      setAttributeMappings({ email: template.attributeMappings.email || '', firstName: template.attributeMappings.firstName || '', lastName: template.attributeMappings.lastName || '' });
      setWizardStep(1); // skip to configure
    } else {
      setSelectedTemplate(null);
      setWizardStep(0);
    }
    setTestResult(null);
  };

  const selectProvider = (template: ProviderTemplate) => {
    setSelectedTemplate(template);
    setConfigFields({ entity_id: template.config.entity_id || '', sso_url: template.config.sso_url || '', certificate: template.config.certificate || '' });
    setAttributeMappings({ email: template.attributeMappings.email || '', firstName: template.attributeMappings.firstName || '', lastName: template.attributeMappings.lastName || '' });
    setWizardStep(1);
  };

  const handleTest = async () => {
    if (!organization?.id || !selectedTemplate) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await invokeSSOFunction('test', organization.id, undefined, {
        provider_type: selectedTemplate.type,
        provider_name: selectedTemplate.name,
        configuration: {
          ...configFields,
          attribute_mappings: attributeMappings,
          acs_url: `${window.location.origin}/auth/saml/callback`,
          sp_entity_id: window.location.origin,
        },
      });
      setTestResult({ success: true, message: result.message || 'Configuration validated successfully.' });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Validation failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!organization?.id || !selectedTemplate) return;
    setIsSaving(true);
    try {
      await invokeSSOFunction('create', organization.id, undefined, {
        provider_type: selectedTemplate.type,
        provider_name: selectedTemplate.name,
        configuration: {
          ...configFields,
          attribute_mappings: attributeMappings,
          acs_url: `${window.location.origin}/auth/saml/callback`,
          sp_entity_id: window.location.origin,
        },
        is_active: true,
      });

      // Update org-level SSO settings
      await invokeSSOFunction('update-settings', organization.id, undefined, {
        sso_enabled: true,
        sso_required: ssoSettings.sso_required,
        sso_allow_password_fallback: ssoSettings.allow_password_fallback,
      });

      toast.success("SSO configuration saved and enabled");
      setWizardStep(-1);
      fetchSSOConfigs();
    } catch (error: any) {
      toast.error(error.message || "Failed to save SSO configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleConfig = async (config: SSOConfig) => {
    if (!organization?.id) return;
    try {
      await invokeSSOFunction('toggle', organization.id, config.id);
      toast.success(config.is_active ? "SSO provider disabled" : "SSO provider enabled");
      fetchSSOConfigs();
    } catch (error: any) {
      toast.error("Failed to update SSO configuration");
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!organization?.id) return;
    try {
      await invokeSSOFunction('delete', organization.id, configId);
      toast.success("SSO configuration deleted");
      fetchSSOConfigs();
    } catch (error: any) {
      toast.error("Failed to delete SSO configuration");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />SSO Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        </CardContent>
      </Card>
    );
  }

  // Wizard view
  if (wizardStep >= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />SSO Setup Wizard</CardTitle>
          <CardDescription>Step {wizardStep + 1} of {STEPS.length}: {STEPS[wizardStep]}</CardDescription>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-1">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                  i < wizardStep ? "bg-primary text-primary-foreground border-primary" :
                  i === wizardStep ? "border-primary text-primary" :
                  "border-muted text-muted-foreground"
                )}>
                  {i < wizardStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className={cn("w-8 h-0.5", i < wizardStep ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Choose Provider */}
          {wizardStep === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROVIDER_TEMPLATES.map((t) => (
                <Card
                  key={t.name}
                  className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  onClick={() => selectProvider(t)}
                >
                  <CardContent className="p-6 text-center">
                    <span className="text-3xl">{t.icon}</span>
                    <h4 className="font-semibold mt-3">{t.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.type === 'saml' ? 'SAML 2.0' : t.type.toUpperCase()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Step 1: Configure */}
          {wizardStep === 1 && selectedTemplate && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{selectedTemplate.icon}</span>
                <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                <Badge variant="secondary">{selectedTemplate.type.toUpperCase()}</Badge>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Identity Provider Entity ID / Issuer</Label>
                  <Input
                    value={configFields.entity_id}
                    onChange={(e) => setConfigFields(p => ({ ...p, entity_id: e.target.value }))}
                    placeholder="https://idp.example.com/metadata"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SAML SSO URL</Label>
                  <Input
                    value={configFields.sso_url}
                    onChange={(e) => setConfigFields(p => ({ ...p, sso_url: e.target.value }))}
                    placeholder="https://idp.example.com/sso/saml"
                  />
                </div>
                <div className="space-y-2">
                  <Label>X.509 Certificate</Label>
                  <Textarea
                    value={configFields.certificate}
                    onChange={(e) => setConfigFields(p => ({ ...p, certificate: e.target.value }))}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium">Attribute Mappings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Email attribute</Label>
                    <Input
                      value={attributeMappings.email}
                      onChange={(e) => setAttributeMappings(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>First Name attribute</Label>
                    <Input
                      value={attributeMappings.firstName}
                      onChange={(e) => setAttributeMappings(p => ({ ...p, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name attribute</Label>
                    <Input
                      value={attributeMappings.lastName}
                      onChange={(e) => setAttributeMappings(p => ({ ...p, lastName: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
                <p className="font-medium">Service Provider Details (for your IdP):</p>
                <p>ACS URL: <code className="bg-background px-1 rounded">{window.location.origin}/auth/saml/callback</code></p>
                <p>Entity ID: <code className="bg-background px-1 rounded">{window.location.origin}</code></p>
              </div>
            </div>
          )}

          {/* Step 2: Test */}
          {wizardStep === 2 && (
            <div className="space-y-6 text-center py-6">
              <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Test Your SSO Configuration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We'll validate your configuration settings before enabling SSO.
                </p>
              </div>

              <Button onClick={handleTest} disabled={isTesting} size="lg">
                {isTesting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testing...</> : 'Test SSO Configuration'}
              </Button>

              {testResult && (
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-lg text-left",
                  testResult.success ? "bg-primary/10 border border-primary/20" : "bg-destructive/10 border border-destructive/20"
                )}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}
                  <p className="text-sm">{testResult.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Enable */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Require SSO for all users</h4>
                    <p className="text-sm text-muted-foreground">Block password login for all organization members</p>
                  </div>
                  <Switch
                    checked={ssoSettings.sso_required}
                    onCheckedChange={(v) => setSsoSettings(p => ({ ...p, sso_required: v }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Allow password login as backup</h4>
                    <p className="text-sm text-muted-foreground">Let users fall back to password if SSO is unavailable</p>
                  </div>
                  <Switch
                    checked={ssoSettings.allow_password_fallback}
                    onCheckedChange={(v) => setSsoSettings(p => ({ ...p, allow_password_fallback: v }))}
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-1">Important:</p>
                <p>After saving, complete the SAML provider setup in your{' '}
                  <a
                    href="https://supabase.com/dashboard/project/bmopbbkfxkgzlbmhhgox/auth/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Supabase Auth dashboard
                  </a>{' '}
                  to activate the full authentication flow.
                </p>
              </div>

              <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full">
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save & Enable SSO'}
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (wizardStep === 0) { setWizardStep(-1); }
                else { setWizardStep(wizardStep - 1); }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />{wizardStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            {wizardStep < 3 && wizardStep > 0 && (
              <Button
                onClick={() => setWizardStep(wizardStep + 1)}
                disabled={wizardStep === 1 && (!configFields.sso_url || !configFields.entity_id)}
              >
                Next<ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />SSO Configuration</CardTitle>
              <CardDescription>Configure Single Sign-On providers for your organization</CardDescription>
            </div>
            <Button onClick={() => startWizard()} className="flex items-center gap-2">
              <Key className="h-4 w-4" />Add SSO Provider
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ssoConfigs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No SSO providers configured</h3>
              <p className="text-muted-foreground mb-4">Set up SSO to let your team sign in with company credentials</p>
              <Button onClick={() => startWizard()}>Configure SSO</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {ssoConfigs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{config.provider_name}</h4>
                        <Badge variant="secondary">{config.provider_type.toUpperCase()}</Badge>
                        {config.is_active && (
                          <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(config.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={config.is_active} onCheckedChange={() => handleToggleConfig(config)} />
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteConfig(config.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
