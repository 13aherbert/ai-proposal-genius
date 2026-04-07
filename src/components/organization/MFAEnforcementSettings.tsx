import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function MFAEnforcementSettings() {
  const { organization } = useCurrentOrganization();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (!organization?.id) return;
    loadSettings();
  }, [organization?.id]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('organization_features')
        .select('is_enabled')
        .eq('organization_id', organization!.id)
        .eq('feature_name', 'mfa_required')
        .maybeSingle();
      setMfaRequired(data?.is_enabled ?? false);
    } catch (err) {
      console.error('Failed to load MFA settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEnforcement = async (enable: boolean) => {
    if (enable) {
      setShowConfirmDialog(true);
      return;
    }
    await saveSetting(false);
  };

  const saveSetting = async (enable: boolean) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('organization_features')
        .upsert({
          organization_id: organization!.id,
          feature_name: 'mfa_required',
          is_enabled: enable,
        }, { onConflict: 'organization_id,feature_name' });
      if (error) throw error;
      setMfaRequired(enable);
      setShowConfirmDialog(false);
      toast.success(enable ? 'MFA enforcement enabled' : 'MFA enforcement disabled', {
        description: enable 
          ? 'All members will be required to set up MFA on next login' 
          : 'MFA is now optional for team members',
      });
    } catch (err: any) {
      toast.error('Failed to update MFA settings', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

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
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">MFA Enforcement</CardTitle>
              <CardDescription>Require all organization members to enable multi-factor authentication</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Require MFA for all members</p>
                <p className="text-xs text-muted-foreground">Members without MFA will be prompted to set it up on login</p>
              </div>
            </div>
            <Switch checked={mfaRequired} onCheckedChange={toggleEnforcement} disabled={isSaving} />
          </div>
          {mfaRequired && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                MFA is enforced. Members who haven't set up MFA will be required to do so before accessing the application.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable MFA Enforcement?</DialogTitle>
            <DialogDescription>
              All organization members will be required to enable multi-factor authentication. 
              Members without MFA will be prompted to set it up on their next login.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onClick={() => saveSetting(true)} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enable Enforcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
