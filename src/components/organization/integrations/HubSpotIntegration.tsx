import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Unplug,
  Zap,
  Clock 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { formatDistanceToNow } from 'date-fns';
import { FieldMappingEditor } from './FieldMappingEditor';
import { SyncHistory } from './SyncHistory';

interface HubSpotIntegrationData {
  id: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: string;
  error_message: string | null;
  created_at: string;
  configuration: any;
}

export function HubSpotIntegration() {
  const [integration, setIntegration] = useState<HubSpotIntegrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { organization } = useCurrentOrganization();

  const loadIntegration = async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await (supabase as any)
        .from('organization_integrations')
        .select('id, is_active, last_sync_at, sync_status, error_message, created_at, configuration')
        .eq('organization_id', organization.id)
        .eq('integration_name', 'HubSpot')
        .maybeSingle();

      if (error) throw error;
      setIntegration(data);
    } catch (error) {
      console.error('Failed to load HubSpot integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!organization?.id) return;
    setConnecting(true);

    try {
      const { data, error } = await supabase.functions.invoke('hubspot-oauth-init', {
        body: { organization_id: organization.id },
      });

      if (error) throw error;
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error: any) {
      console.error('Failed to init HubSpot OAuth:', error);
      toast.error(error.message || 'Failed to start HubSpot connection');
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    if (!integration?.id) return;
    setSyncing(true);

    try {
      const { data, error } = await supabase.functions.invoke('hubspot-sync', {
        body: { integration_id: integration.id, sync_type: 'full' },
      });

      if (error) throw error;
      toast.success(`Synced ${data.records_processed} records${data.records_failed > 0 ? ` (${data.records_failed} failed)` : ''}`);
      await loadIntegration();
    } catch (error: any) {
      console.error('Sync failed:', error);
      toast.error('Sync failed: ' + (error.message || 'Unknown error'));
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!integration?.id) return;

    try {
      const { error } = await (supabase as any)
        .from('organization_integrations')
        .delete()
        .eq('id', integration.id);

      if (error) throw error;
      setIntegration(null);
      toast.success('HubSpot disconnected');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect HubSpot');
    }
  };

  const handleToggle = async (active: boolean) => {
    if (!integration?.id) return;

    try {
      const { error } = await (supabase as any)
        .from('organization_integrations')
        .update({ is_active: active })
        .eq('id', integration.id);

      if (error) throw error;
      setIntegration(prev => prev ? { ...prev, is_active: active } : null);
      toast.success(active ? 'HubSpot integration enabled' : 'HubSpot integration paused');
    } catch (error) {
      toast.error('Failed to update integration');
    }
  };

  useEffect(() => {
    loadIntegration();
  }, [organization?.id]);

  // Check for callback success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('hubspot') === 'connected') {
      toast.success('HubSpot connected successfully!');
      loadIntegration();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🟠</span>
              <div>
                <CardTitle className="text-xl">HubSpot CRM</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sync proposals to HubSpot deals automatically
                </p>
              </div>
            </div>
            {integration && (
              <div className="flex items-center gap-3">
                <Switch
                  checked={integration.is_active}
                  onCheckedChange={handleToggle}
                />
                <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                  {integration.is_active ? 'Active' : 'Paused'}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!integration ? (
            <div className="text-center py-6 space-y-4">
              <p className="text-muted-foreground">
                Connect your HubSpot account to sync won proposals as deals.
              </p>
              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Connect HubSpot
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Connected {formatDistanceToNow(new Date(integration.created_at), { addSuffix: true })}
                  </span>
                  {integration.last_sync_at && (
                    <span>
                      Last sync {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}
                    </span>
                  )}
                  {integration.sync_status === 'success' && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" /> Success
                    </Badge>
                  )}
                  {integration.sync_status === 'error' && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" /> Error
                    </Badge>
                  )}
                  {integration.sync_status === 'syncing' && (
                    <Badge variant="secondary">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Syncing
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing || !integration.is_active}
                  >
                    {syncing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Sync Now
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDisconnect}>
                    <Unplug className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>

              {integration.error_message && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{integration.error_message}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {integration && (
        <>
          <FieldMappingEditor integrationId={integration.id} />
          <SyncHistory integrationId={integration.id} />
        </>
      )}
    </div>
  );
}
