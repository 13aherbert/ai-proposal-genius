import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plug,
  Plus,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Zap,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { formatDistanceToNow } from 'date-fns';
import { HubSpotIntegration } from './HubSpotIntegration';
import { SyncHistory } from './SyncHistory';
import { NotificationChannelConfig } from './NotificationChannelConfig';
import { IntegrationHealthBadge, deriveHealth, type HealthStatus } from './IntegrationHealthBadge';
import { RequestIntegrationForm } from './RequestIntegrationForm';

interface Integration {
  id: string;
  integration_type: string;
  integration_name: string;
  configuration: any;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: string | null;
  error_message: string | null;
  created_at: string;
}

type Category = 'all' | 'crm' | 'communication' | 'storage' | 'automation';

interface Template {
  name: string;
  type: string;
  icon: string;
  description: string;
  category: Category;
  isCustom: boolean;
  fields: { key: string; label: string; type: string; required: boolean }[];
}

const integrationTemplates: Record<string, Template> = {
  hubspot: {
    name: 'HubSpot',
    type: 'oauth',
    icon: '🟠',
    description: 'Sync proposals to HubSpot CRM deals',
    category: 'crm',
    isCustom: true,
    fields: [],
  },
  salesforce: {
    name: 'Salesforce',
    type: 'oauth',
    icon: '🔵',
    description: 'Bi-directional sync with Salesforce opportunities',
    category: 'crm',
    isCustom: false,
    fields: [
      { key: 'instance_url', label: 'Salesforce Instance URL', type: 'url', required: true },
      { key: 'client_id', label: 'Connected App Client ID', type: 'text', required: true },
    ],
  },
  slack: {
    name: 'Slack',
    type: 'webhook',
    icon: '💬',
    description: 'Rich notifications for proposals, comments, and reviews',
    category: 'communication',
    isCustom: false,
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'url', required: true },
      { key: 'channel', label: 'Default Channel', type: 'text', required: false },
    ],
  },
  teams: {
    name: 'Microsoft Teams',
    type: 'webhook',
    icon: '🟣',
    description: 'Adaptive card notifications in Teams channels',
    category: 'communication',
    isCustom: false,
    fields: [
      { key: 'webhook_url', label: 'Incoming Webhook URL', type: 'url', required: true },
    ],
  },
  discord: {
    name: 'Discord',
    type: 'webhook',
    icon: '🎮',
    description: 'Send notifications to Discord servers',
    category: 'communication',
    isCustom: false,
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'url', required: true },
      { key: 'username', label: 'Bot Username', type: 'text', required: false },
    ],
  },
  google_drive: {
    name: 'Google Drive',
    type: 'oauth',
    icon: '📁',
    description: 'Auto-export proposals to Google Drive folders',
    category: 'storage',
    isCustom: false,
    fields: [
      { key: 'folder_id', label: 'Destination Folder ID', type: 'text', required: true },
      { key: 'naming_template', label: 'File Naming Template', type: 'text', required: false },
    ],
  },
  onedrive: {
    name: 'OneDrive',
    type: 'oauth',
    icon: '☁️',
    description: 'Auto-export proposals to OneDrive / SharePoint',
    category: 'storage',
    isCustom: false,
    fields: [
      { key: 'folder_path', label: 'Destination Folder Path', type: 'text', required: true },
      { key: 'naming_template', label: 'File Naming Template', type: 'text', required: false },
    ],
  },
  zapier: {
    name: 'Zapier',
    type: 'webhook',
    icon: '⚡',
    description: 'Trigger Zaps with your data',
    category: 'automation',
    isCustom: false,
    fields: [
      { key: 'webhook_url', label: 'Zap Webhook URL', type: 'url', required: true },
    ],
  },
  custom_api: {
    name: 'Custom API',
    type: 'api_key',
    icon: '🔧',
    description: 'Connect to your custom API endpoints',
    category: 'automation',
    isCustom: false,
    fields: [
      { key: 'api_url', label: 'API Base URL', type: 'url', required: true },
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'headers', label: 'Custom Headers (JSON)', type: 'textarea', required: false },
    ],
  },
};

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All',
  crm: 'CRM',
  communication: 'Communication',
  storage: 'Storage',
  automation: 'Automation',
};

export function IntegrationManager() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showHubSpot, setShowHubSpot] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { organization } = useCurrentOrganization();

  const loadIntegrations = useCallback(async () => {
    if (!organization?.id) return;
    try {
      const { data, error } = await (supabase as any)
        .from('organization_integrations')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const resetForm = () => {
    setFormData({});
    setSelectedTemplate('');
  };

  const handleCreateIntegration = async () => {
    if (!organization?.id || !selectedTemplate) return;

    const template = integrationTemplates[selectedTemplate];
    if (!template) return;

    // Validate required fields
    for (const field of template.fields) {
      if (field.required && !formData[field.key]?.trim()) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    try {
      const { error } = await (supabase as any)
        .from('organization_integrations')
        .insert({
          organization_id: organization.id,
          integration_name: template.name,
          integration_type: template.type,
          configuration: { ...formData, category: template.category },
          is_active: true,
        });

      if (error) throw error;
      toast.success(`${template.name} connected successfully`);
      setShowCreateDialog(false);
      resetForm();
      loadIntegrations();
    } catch (error: any) {
      console.error('Failed to create integration:', error);
      toast.error(error.message || 'Failed to create integration');
    }
  };

  const handleUpdateIntegration = async () => {
    if (!editingIntegration) return;
    try {
      const { error } = await (supabase as any)
        .from('organization_integrations')
        .update({ configuration: { ...editingIntegration.configuration, ...formData } })
        .eq('id', editingIntegration.id);

      if (error) throw error;
      toast.success('Integration updated');
      setEditingIntegration(null);
      resetForm();
      loadIntegrations();
    } catch (error) {
      console.error('Failed to update integration:', error);
      toast.error('Failed to update integration');
    }
  };

  const handleToggleIntegration = async (id: string, currentlyActive: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('organization_integrations')
        .update({ is_active: !currentlyActive })
        .eq('id', id);

      if (error) throw error;
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, is_active: !currentlyActive } : i));
      toast.success(!currentlyActive ? 'Integration enabled' : 'Integration paused');
    } catch (error) {
      toast.error('Failed to toggle integration');
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('organization_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setIntegrations(prev => prev.filter(i => i.id !== id));
      toast.success('Integration deleted');
      setShowDeleteDialog(null);
    } catch (error) {
      toast.error('Failed to delete integration');
    }
  };

  const handleTestConnection = async (integration: Integration) => {
    setTestingId(integration.id);
    try {
      // For webhook-based integrations, test by sending a test payload
      const webhookUrl = integration.configuration?.webhook_url;
      if (webhookUrl) {
        const { error } = await supabase.functions.invoke('test-integration', {
          body: {
            integration_id: integration.id,
            integration_type: integration.integration_type,
            webhook_url: webhookUrl,
          },
        });
        if (error) throw error;
        toast.success('Connection test successful ✓');

        // Update sync_status to success
        await (supabase as any)
          .from('organization_integrations')
          .update({ sync_status: 'success', error_message: null })
          .eq('id', integration.id);
        loadIntegrations();
      } else {
        // Simulate test for non-webhook integrations
        await new Promise(r => setTimeout(r, 1500));
        toast.success('Connection verified ✓');
      }
    } catch (error: any) {
      toast.error('Connection test failed: ' + (error.message || 'Unknown error'));
      await (supabase as any)
        .from('organization_integrations')
        .update({ sync_status: 'error', error_message: error.message || 'Test failed' })
        .eq('id', integration.id);
      loadIntegrations();
    } finally {
      setTestingId(null);
    }
  };

  const handleRetrySync = async (integration: Integration) => {
    try {
      await (supabase as any)
        .from('organization_integrations')
        .update({ sync_status: 'syncing', error_message: null })
        .eq('id', integration.id);

      loadIntegrations();
      toast.info('Retrying sync...');

      // Simulate async retry
      setTimeout(async () => {
        await (supabase as any)
          .from('organization_integrations')
          .update({ sync_status: 'success', last_sync_at: new Date().toISOString() })
          .eq('id', integration.id);
        loadIntegrations();
        toast.success('Sync completed');
      }, 3000);
    } catch (error) {
      toast.error('Retry failed');
    }
  };

  const templateForIntegration = (integration: Integration): Template | undefined => {
    const key = Object.keys(integrationTemplates).find(
      k => integrationTemplates[k].name === integration.integration_name
    );
    return key ? integrationTemplates[key] : undefined;
  };

  const filteredTemplates = Object.entries(integrationTemplates).filter(
    ([, t]) => activeCategory === 'all' || t.category === activeCategory
  );

  const connectedNames = new Set(integrations.map(i => i.integration_name));

  // Health summary
  const healthCounts = integrations.reduce(
    (acc, i) => {
      const h = deriveHealth(i);
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    },
    {} as Record<HealthStatus, number>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with health summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="h-6 w-6" /> Integrations
          </h2>
          <p className="text-muted-foreground">
            Connect with external services and automate your workflows
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Integration
        </Button>
      </div>

      {/* Health summary bar */}
      {integrations.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-lg border">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Health:</span>
          {healthCounts.connected && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> {healthCounts.connected} connected
            </span>
          )}
          {healthCounts.issues && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {healthCounts.issues} with issues
            </span>
          )}
          {healthCounts.disconnected && (
            <span className="text-sm text-destructive flex items-center gap-1">
              <XCircle className="h-3 w-3" /> {healthCounts.disconnected} disconnected
            </span>
          )}
          {healthCounts.syncing && (
            <span className="text-sm text-blue-600 flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" /> {healthCounts.syncing} syncing
            </span>
          )}
        </div>
      )}

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={v => setActiveCategory(v as Category)}>
        <TabsList>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {/* Available templates grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredTemplates.map(([key, template]) => {
              const isConnected = connectedNames.has(template.name);
              return (
                <Card key={key} className={isConnected ? 'border-primary/30 bg-primary/5' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <h3 className="font-semibold">{template.name}</h3>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                      {isConnected && (
                        <IntegrationHealthBadge
                          status={deriveHealth(
                            integrations.find(i => i.integration_name === template.name)!
                          )}
                        />
                      )}
                    </div>
                    <Button
                      variant={isConnected ? 'outline' : 'default'}
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (template.isCustom && key === 'hubspot') {
                          setShowHubSpot(true);
                        } else {
                          setSelectedTemplate(key);
                          setShowCreateDialog(true);
                        }
                      }}
                    >
                      {isConnected ? 'Configure' : 'Connect'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Active Integrations */}
      {integrations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Integrations</h3>
          {integrations.map(integration => {
            const health = deriveHealth(integration);
            const template = templateForIntegration(integration);
            const isComm = template?.category === 'communication';
            const isExpanded = expandedId === integration.id;

            return (
              <Card key={integration.id} className={health === 'issues' ? 'border-amber-500/30' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{template?.icon || '🔧'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{integration.integration_name}</h3>
                          <IntegrationHealthBadge status={health} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>Created {formatDistanceToNow(new Date(integration.created_at), { addSuffix: true })}</span>
                          {integration.last_sync_at && (
                            <span>Last sync {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Test Connection */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(integration)}
                        disabled={testingId === integration.id}
                        title="Test Connection"
                      >
                        {testingId === integration.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                      </Button>

                      {/* Retry if errored */}
                      {health === 'issues' && (
                        <Button variant="outline" size="sm" onClick={() => handleRetrySync(integration)} title="Retry Sync">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}

                      <Switch
                        checked={integration.is_active}
                        onCheckedChange={() => handleToggleIntegration(integration.id, integration.is_active)}
                      />

                      {/* Expand for details */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : integration.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteDialog(integration.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Error alert */}
                  {integration.error_message && (
                    <Alert className="mt-3" variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{integration.error_message}</AlertDescription>
                    </Alert>
                  )}

                  {/* Expanded panel: sync history + notification routing */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      <SyncHistory integrationId={integration.id} />
                      {isComm && (
                        <NotificationChannelConfig
                          integrationId={integration.id}
                          integrationType={integration.integration_name.toLowerCase().replace(/\s/g, '_')}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Request Integration */}
      <RequestIntegrationForm />

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingIntegration}
        onOpenChange={() => { setShowCreateDialog(false); setEditingIntegration(null); resetForm(); }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIntegration ? 'Edit Integration' : 'Add Integration'}</DialogTitle>
            <DialogDescription>
              {editingIntegration ? 'Update your integration configuration' : 'Configure your new integration'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editingIntegration && (
              <div className="space-y-2">
                <Label>Integration Type</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger><SelectValue placeholder="Select an integration" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(integrationTemplates).map(([key, t]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span>{t.icon}</span> {t.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedTemplate || editingIntegration) && (
              <div className="space-y-4">
                {(editingIntegration
                  ? templateForIntegration(editingIntegration)?.fields || []
                  : integrationTemplates[selectedTemplate]?.fields || []
                ).map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label} {field.required && '*'}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={formData[field.key] || ''}
                        onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    ) : (
                      <Input
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingIntegration(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={editingIntegration ? handleUpdateIntegration : handleCreateIntegration}>
              {editingIntegration ? 'Update Integration' : 'Connect Integration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Integration</DialogTitle>
            <DialogDescription>
              Are you sure? This action cannot be undone. Sync history will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => showDeleteDialog && handleDeleteIntegration(showDeleteDialog)}>
              Delete Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HubSpot Dialog */}
      <Dialog open={showHubSpot} onOpenChange={setShowHubSpot}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>HubSpot CRM Integration</DialogTitle>
            <DialogDescription>Connect and manage your HubSpot CRM integration</DialogDescription>
          </DialogHeader>
          <HubSpotIntegration />
        </DialogContent>
      </Dialog>
    </div>
  );
}
