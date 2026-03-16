import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentOrganization } from "@/hooks/use-current-organization";

export function SSOSettings() {
  const { organization, refreshOrganization } = useCurrentOrganization();
  const [settings, setSettings] = useState({
    sso_enabled: false,
    sso_required: false,
    sso_allow_password_fallback: true,
    sso_auto_redirect: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      const org = organization as any;
      setSettings({
        sso_enabled: org.sso_enabled ?? false,
        sso_required: org.sso_required ?? false,
        sso_allow_password_fallback: org.sso_allow_password_fallback ?? true,
        sso_auto_redirect: org.sso_auto_redirect ?? false,
      });
    }
  }, [organization]);

  const handleSave = async () => {
    if (!organization?.id) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-sso-config', {
        body: {
          action: 'update-settings',
          organizationId: organization.id,
          configData: settings,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success("SSO settings updated");
      refreshOrganization();
    } catch (err: any) {
      toast.error(err.message || "Failed to update SSO settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />SSO Policy Settings
        </CardTitle>
        <CardDescription>Control how SSO is enforced across your organization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label className="font-medium">Enable SSO</Label>
            <p className="text-sm text-muted-foreground">Allow SSO login for your organization</p>
          </div>
          <Switch checked={settings.sso_enabled} onCheckedChange={(v) => setSettings(p => ({ ...p, sso_enabled: v }))} />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label className="font-medium">Require SSO</Label>
            <p className="text-sm text-muted-foreground">Block password login for all members</p>
          </div>
          <Switch checked={settings.sso_required} onCheckedChange={(v) => setSettings(p => ({ ...p, sso_required: v }))} disabled={!settings.sso_enabled} />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label className="font-medium">Allow Password Fallback</Label>
            <p className="text-sm text-muted-foreground">Let users sign in with password if SSO is down</p>
          </div>
          <Switch checked={settings.sso_allow_password_fallback} onCheckedChange={(v) => setSettings(p => ({ ...p, sso_allow_password_fallback: v }))} disabled={!settings.sso_enabled} />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <Label className="font-medium">Auto-redirect to SSO</Label>
            <p className="text-sm text-muted-foreground">Skip the login page and go directly to your IdP</p>
          </div>
          <Switch checked={settings.sso_auto_redirect} onCheckedChange={(v) => setSettings(p => ({ ...p, sso_auto_redirect: v }))} disabled={!settings.sso_enabled} />
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save SSO Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
