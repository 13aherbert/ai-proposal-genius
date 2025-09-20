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
  Webhook, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Settings, 
  CheckCircle, 
  XCircle,
  Clock,
  RotateCcw,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { formatDistanceToNow } from 'date-fns';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret_token: string;
  is_active: boolean;
  retry_config: {
    max_retries: number;
    retry_delay: number;
  };
  headers: Record<string, string>;
  last_triggered_at: string | null;
  success_count: number;
  failure_count: number;
  created_at: string;
}

const availableEvents = [
  { value: 'project.created', label: 'Project Created' },
  { value: 'project.updated', label: 'Project Updated' },
  { value: 'project.deleted', label: 'Project Deleted' },
  { value: 'knowledge.created', label: 'Knowledge Entry Created' },
  { value: 'knowledge.updated', label: 'Knowledge Entry Updated' },
  { value: 'knowledge.deleted', label: 'Knowledge Entry Deleted' },
  { value: 'proposal.generated', label: 'Proposal Generated' },
  { value: 'member.invited', label: 'Member Invited' },
  { value: 'member.joined', label: 'Member Joined' },
  { value: 'member.removed', label: 'Member Removed' },
];

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret_token: '',
    headers: {} as Record<string, string>,
    retry_config: { max_retries: 3, retry_delay: 1000 },
  });
  
  const { organization } = useCurrentOrganization();

  const loadWebhooks = async () => {
    setWebhooks([]);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      events: [],
      secret_token: '',
      headers: {},
      retry_config: { max_retries: 3, retry_delay: 1000 },
    });
  };

  const handleCreateWebhook = async () => {
    if (!organization?.id || !formData.name.trim() || !formData.url.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organization_webhooks')
        .insert({
          organization_id: organization.id,
          name: formData.name,
          url: formData.url,
          events: formData.events,
          secret_token: formData.secret_token || null,
          headers: formData.headers,
          retry_config: formData.retry_config,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setWebhooks(prev => [data, ...prev]);
      setShowCreateDialog(false);
      resetForm();
      toast.success('Webhook created successfully');
    } catch (error) {
      console.error('Failed to create webhook:', error);
      toast.error('Failed to create webhook');
    }
  };

  const handleUpdateWebhook = async () => {
    if (!editingWebhook || !formData.name.trim() || !formData.url.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organization_webhooks')
        .update({
          name: formData.name,
          url: formData.url,
          events: formData.events,
          secret_token: formData.secret_token || null,
          headers: formData.headers,
          retry_config: formData.retry_config,
        })
        .eq('id', editingWebhook.id)
        .select()
        .single();

      if (error) throw error;

      setWebhooks(prev => prev.map(w => w.id === editingWebhook.id ? data : w));
      setEditingWebhook(null);
      resetForm();
      toast.success('Webhook updated successfully');
    } catch (error) {
      console.error('Failed to update webhook:', error);
      toast.error('Failed to update webhook');
    }
  };

  const handleToggleWebhook = async (webhookId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('organization_webhooks')
        .update({ is_active: !isActive })
        .eq('id', webhookId);

      if (error) throw error;

      setWebhooks(prev => prev.map(w => 
        w.id === webhookId ? { ...w, is_active: !isActive } : w
      ));
      
      toast.success(`Webhook ${isActive ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
      toast.error('Failed to toggle webhook');
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from('organization_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;

      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      setShowDeleteDialog(null);
      toast.success('Webhook deleted successfully');
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  const openEditDialog = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      secret_token: webhook.secret_token || '',
      headers: webhook.headers || {},
      retry_config: webhook.retry_config,
    });
  };

  const generateSecretToken = () => {
    const token = `whsec_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    setFormData(prev => ({ ...prev, secret_token: token }));
  };

  useEffect(() => {
    loadWebhooks();
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
            <Webhook className="h-6 w-6" />
            Webhooks
          </h2>
          <p className="text-muted-foreground">
            Configure webhook endpoints to receive real-time notifications about events
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Webhooks</h3>
              <p className="text-muted-foreground mb-4">
                Create your first webhook to receive real-time notifications
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{webhook.name}</h3>
                      <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                        {webhook.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{webhook.url}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map(event => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {availableEvents.find(e => e.value === event)?.label || event}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {webhook.success_count} success
                        </span>
                        {webhook.failure_count > 0 && (
                          <span className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500" />
                            {webhook.failure_count} failed
                          </span>
                        )}
                        {webhook.last_triggered_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last triggered {formatDistanceToNow(new Date(webhook.last_triggered_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={() => handleToggleWebhook(webhook.id, webhook.is_active)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(webhook)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteDialog(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Webhook Dialog */}
      <Dialog 
        open={showCreateDialog || !!editingWebhook} 
        onOpenChange={() => {
          setShowCreateDialog(false);
          setEditingWebhook(null);
          resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
            </DialogTitle>
            <DialogDescription>
              Configure webhook settings and event subscriptions
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Name *</Label>
                <Input
                  id="webhook-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Webhook"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">Endpoint URL *</Label>
                <Input
                  id="webhook-url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://yourapp.com/webhooks"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret-token">Secret Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="secret-token"
                    value={formData.secret_token}
                    onChange={(e) => setFormData(prev => ({ ...prev, secret_token: e.target.value }))}
                    placeholder="Optional secret for webhook verification"
                  />
                  <Button type="button" variant="outline" onClick={generateSecretToken}>
                    Generate
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <div className="space-y-2">
                <Label>Event Subscriptions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map(event => (
                    <label key={event.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.value)}
                        onChange={(e) => {
                          const events = e.target.checked
                            ? [...formData.events, event.value]
                            : formData.events.filter(ev => ev !== event.value);
                          setFormData(prev => ({ ...prev, events }));
                        }}
                      />
                      <span className="text-sm">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Retry Configuration</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="max-retries" className="text-xs">Max Retries</Label>
                      <Input
                        id="max-retries"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.retry_config.max_retries}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          retry_config: {
                            ...prev.retry_config,
                            max_retries: parseInt(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="retry-delay" className="text-xs">Retry Delay (ms)</Label>
                      <Input
                        id="retry-delay"
                        type="number"
                        min="100"
                        value={formData.retry_config.retry_delay}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          retry_config: {
                            ...prev.retry_config,
                            retry_delay: parseInt(e.target.value) || 1000
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-headers">Custom Headers (JSON)</Label>
                  <Textarea
                    id="custom-headers"
                    value={JSON.stringify(formData.headers, null, 2)}
                    onChange={(e) => {
                      try {
                        const headers = JSON.parse(e.target.value);
                        setFormData(prev => ({ ...prev, headers }));
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                setEditingWebhook(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingWebhook ? handleUpdateWebhook : handleCreateWebhook}>
              {editingWebhook ? 'Update Webhook' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this webhook? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => showDeleteDialog && handleDeleteWebhook(showDeleteDialog)}
            >
              Delete Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}