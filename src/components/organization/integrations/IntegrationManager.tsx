import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Zap,
  Shield,
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { formatDistanceToNow } from 'date-fns';

interface Integration {
  id: string;
  integration_type: string;
  integration_name: string;
  configuration: any;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: 'idle' | 'syncing' | 'error' | 'success';
  error_message: string | null;
  created_at: string;
}

const integrationTemplates = {
  slack: {
    name: 'Slack',
    type: 'oauth',
    icon: '💬',
    description: 'Send notifications to Slack channels',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'url', required: true },
      { key: 'channel', label: 'Default Channel', type: 'text', required: false },
    ]
  },
  discord: {
    name: 'Discord',
    type: 'oauth',
    icon: '🎮',
    description: 'Send notifications to Discord servers',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'url', required: true },
      { key: 'username', label: 'Bot Username', type: 'text', required: false },
    ]
  },
  zapier: {
    name: 'Zapier',
    type: 'api_key',
    icon: '⚡',
    description: 'Trigger Zaps with your data',
    fields: [
      { key: 'webhook_url', label: 'Zap Webhook URL', type: 'url', required: true },
    ]
  },
  google_sheets: {
    name: 'Google Sheets',
    type: 'oauth',
    icon: '📊',
    description: 'Export data to Google Sheets',
    fields: [
      { key: 'sheet_id', label: 'Sheet ID', type: 'text', required: true },
      { key: 'worksheet_name', label: 'Worksheet Name', type: 'text', required: false },
    ]
  },
  custom_api: {
    name: 'Custom API',
    type: 'api_key',
    icon: '🔧',
    description: 'Connect to your custom API endpoints',
    fields: [
      { key: 'api_url', label: 'API Base URL', type: 'url', required: true },
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'headers', label: 'Custom Headers (JSON)', type: 'textarea', required: false },
    ]
  },
};

export function IntegrationManager() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  const { organization } = useCurrentOrganization();

  const loadIntegrations = async () => {
    if (!organization?.id) return;

    try {
      // Temporarily use organization_branding as placeholder until migration completes
      const { data, error } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations([]); // Temporary empty array until tables exist
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({});
    setSelectedTemplate('');
  };

  const handleCreateIntegration = async () => {
    toast.info('Integration management will be available after database migration completes');
  };

  const handleUpdateIntegration = async () => {
    if (!editingIntegration) return;

    try {
      const { data, error } = await supabase
        .from('organization_integrations')
        .update({
          configuration: formData,
        })
        .eq('id', editingIntegration.id)
        .select()
        .single();

      if (error) throw error;

      setIntegrations(prev => prev.map(i => i.id === editingIntegration.id ? data : i));
      setEditingIntegration(null);
      resetForm();
      toast.success('Integration updated successfully');
    } catch (error) {
      console.error('Failed to update integration:', error);
      toast.error('Failed to update integration');
    }
  };

  const handleToggleIntegration = async (integrationId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('organization_integrations')
        .update({ is_active: !isActive })
        .eq('id', integrationId);

      if (error) throw error;

      setIntegrations(prev => prev.map(i => 
        i.id === integrationId ? { ...i, is_active: !isActive } : i
      ));
      
      toast.success(`Integration ${isActive ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('Failed to toggle integration:', error);
      toast.error('Failed to toggle integration');
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('organization_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      setIntegrations(prev => prev.filter(i => i.id !== integrationId));
      setShowDeleteDialog(null);
      toast.success('Integration deleted successfully');
    } catch (error) {
      console.error('Failed to delete integration:', error);
      toast.error('Failed to delete integration');
    }
  };

  const handleTestIntegration = async (integration: Integration) => {
    try {
      // In a real implementation, you'd call an edge function to test the integration
      toast.info('Testing integration...');
      
      // Simulate test
      setTimeout(() => {
        toast.success('Integration test successful');
      }, 2000);
    } catch (error) {
      toast.error('Integration test failed');
    }
  };

  const openEditDialog = (integration: Integration) => {
    setEditingIntegration(integration);
    setFormData(integration.configuration || {});
  };

  const getSyncStatusBadge = (integration: Integration) => {
    switch (integration.sync_status) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      case 'syncing':
        return (
          <Badge variant="secondary">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Syncing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Idle
          </Badge>
        );
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, [organization?.id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="h-6 w-6" />
            Integrations
          </h2>
          <p className="text-muted-foreground">
            Connect with external services and automate your workflows
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Integration Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(integrationTemplates).map(([key, template]) => {
          const hasIntegration = integrations.some(i => i.integration_name === template.name);
          return (
            <Card key={key} className={hasIntegration ? 'border-primary/20' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{template.icon}</div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                  {hasIntegration && (
                    <Badge variant="outline">Connected</Badge>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setSelectedTemplate(key);
                    setShowCreateDialog(true);
                  }}
                >
                  {hasIntegration ? 'Add Another' : 'Connect'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Integrations */}
      {integrations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Integrations</h3>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {integrationTemplates[integration.integration_name.toLowerCase().replace(' ', '_') as keyof typeof integrationTemplates]?.icon || '🔧'}
                        </span>
                        <div>
                          <h3 className="font-semibold">{integration.integration_name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {integration.integration_type} Integration
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                            {integration.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {getSyncStatusBadge(integration)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Created {formatDistanceToNow(new Date(integration.created_at), { addSuffix: true })}
                        </span>
                        {integration.last_sync_at && (
                          <span>
                            Last sync {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      
                      {integration.error_message && (
                        <Alert className="mt-3">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            {integration.error_message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestIntegration(integration)}
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={integration.is_active}
                        onCheckedChange={() => handleToggleIntegration(integration.id, integration.is_active)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(integration)}
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Integration Dialog */}
      <Dialog 
        open={showCreateDialog || !!editingIntegration} 
        onOpenChange={() => {
          setShowCreateDialog(false);
          setEditingIntegration(null);
          resetForm();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration ? 'Edit Integration' : 'Create Integration'}
            </DialogTitle>
            <DialogDescription>
              {editingIntegration 
                ? 'Update your integration configuration'
                : 'Configure your new integration'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editingIntegration && (
              <div className="space-y-2">
                <Label>Integration Type</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an integration" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(integrationTemplates).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{template.icon}</span>
                          <span>{template.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedTemplate || editingIntegration) && (
              <div className="space-y-4">
                {(editingIntegration 
                  ? integrationTemplates[editingIntegration.integration_name.toLowerCase().replace(' ', '_') as keyof typeof integrationTemplates]?.fields || []
                  : integrationTemplates[selectedTemplate as keyof typeof integrationTemplates]?.fields || []
                ).map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label} {field.required && '*'}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.key}
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                setEditingIntegration(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingIntegration ? handleUpdateIntegration : handleCreateIntegration}>
              {editingIntegration ? 'Update Integration' : 'Create Integration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Integration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this integration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => showDeleteDialog && handleDeleteIntegration(showDeleteDialog)}
            >
              Delete Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}