import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Webhook, Plus, Trash2, Play, Activity, CheckCircle, XCircle, Settings
} from 'lucide-react';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret_key: string;
  retry_count: number;
  timeout_seconds: number;
  headers: Record<string, string>;
  created_at: string;
  last_triggered_at?: string;
  success_count: number;
  failure_count: number;
}

interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  response_status: number;
  response_body: string;
  attempts: number;
  created_at: string;
  delivered_at?: string;
}

const WEBHOOK_EVENTS = [
  'user.created', 'user.updated', 'user.deleted',
  'project.created', 'project.updated', 'project.deleted',
  'organization.updated', 'subscription.updated',
  'payment.succeeded', 'payment.failed'
];

export function WebhookManager() {
  const { organization } = useCurrentOrganization();
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [newWebhook, setNewWebhook] = useState({
    name: '', url: '', events: [] as string[],
    is_active: true, retry_count: 3, timeout_seconds: 30,
    headers: {} as Record<string, string>
  });

  useEffect(() => {
    if (organization?.id) {
      fetchWebhooks();
      fetchWebhookLogs();
    }
  }, [organization?.id]);

  const fetchWebhooks = async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_webhooks')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setWebhooks((data as WebhookEndpoint[]) || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookLogs = async () => {
    if (!organization?.id) return;
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setWebhookLogs((data as WebhookLog[]) || []);
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
    }
  };

  const createWebhook = async () => {
    if (!organization?.id || !newWebhook.name || !newWebhook.url) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const secretBytes = new Uint8Array(24);
      crypto.getRandomValues(secretBytes);
      const secretKey = 'whsec_' + Array.from(secretBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase.from('organization_webhooks').insert({
        organization_id: organization.id,
        name: newWebhook.name,
        url: newWebhook.url,
        events: newWebhook.events,
        is_active: newWebhook.is_active,
        secret_key: secretKey,
        retry_count: newWebhook.retry_count,
        timeout_seconds: newWebhook.timeout_seconds,
        headers: newWebhook.headers,
      });
      if (error) throw error;

      toast.success('Webhook created successfully');
      setShowCreateDialog(false);
      setNewWebhook({ name: '', url: '', events: [], is_active: true, retry_count: 3, timeout_seconds: 30, headers: {} });
      fetchWebhooks();
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error('Failed to create webhook');
    }
  };

  const toggleWebhook = async (webhook: WebhookEndpoint) => {
    try {
      const { error } = await supabase
        .from('organization_webhooks')
        .update({ is_active: !webhook.is_active })
        .eq('id', webhook.id);
      if (error) throw error;
      toast.success(webhook.is_active ? 'Webhook disabled' : 'Webhook enabled');
      fetchWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast.error('Failed to update webhook');
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      const { error } = await supabase.from('organization_webhooks').delete().eq('id', webhookId);
      if (error) throw error;
      toast.success('Webhook deleted');
      fetchWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  const testWebhook = async (webhook: WebhookEndpoint) => {
    try {
      const { data, error } = await supabase.functions.invoke('dispatch-webhook', {
        body: {
          organization_id: organization?.id,
          event_type: 'webhook.test',
          payload: { test: true, timestamp: new Date().toISOString() },
        },
      });
      if (error) throw error;
      toast.success(`Test dispatched — ${data?.dispatched || 0} webhook(s) triggered`);
      fetchWebhookLogs();
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Failed to test webhook');
    }
  };

  const getStatusBadge = (webhook: WebhookEndpoint) => {
    if (!webhook.is_active) return <Badge variant="secondary">Disabled</Badge>;
    const total = webhook.success_count + webhook.failure_count;
    const rate = total > 0 ? webhook.success_count / total : 1;
    if (rate >= 0.95) return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
    if (rate >= 0.8) return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    return <Badge variant="destructive">Failing</Badge>;
  };

  if (loading) {
    return <div className="space-y-6"><div className="animate-pulse"><div className="h-8 bg-muted rounded w-1/3 mb-4" /><div className="h-64 bg-muted rounded" /></div></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5" />Webhook Management</CardTitle>
              <CardDescription>Configure webhooks to receive real-time notifications about events</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Webhook</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Webhook</DialogTitle>
                  <DialogDescription>Set up a new webhook endpoint to receive event notifications</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input placeholder="My Webhook" value={newWebhook.name} onChange={(e) => setNewWebhook(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Endpoint URL</Label>
                      <Input placeholder="https://your-app.com/webhooks" value={newWebhook.url} onChange={(e) => setNewWebhook(p => ({ ...p, url: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Events to Subscribe</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                      {WEBHOOK_EVENTS.map((event) => (
                        <label key={event} className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" checked={newWebhook.events.includes(event)}
                            onChange={(e) => {
                              if (e.target.checked) setNewWebhook(p => ({ ...p, events: [...p.events, event] }));
                              else setNewWebhook(p => ({ ...p, events: p.events.filter(ev => ev !== event) }));
                            }} />
                          <span>{event}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Retry Count</Label>
                      <Select value={newWebhook.retry_count.toString()} onValueChange={(v) => setNewWebhook(p => ({ ...p, retry_count: parseInt(v) }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem><SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timeout (seconds)</Label>
                      <Select value={newWebhook.timeout_seconds.toString()} onValueChange={(v) => setNewWebhook(p => ({ ...p, timeout_seconds: parseInt(v) }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem><SelectItem value="30">30</SelectItem>
                          <SelectItem value="60">60</SelectItem><SelectItem value="120">120</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={newWebhook.is_active} onCheckedChange={(c) => setNewWebhook(p => ({ ...p, is_active: c }))} />
                    <Label>Enable webhook immediately</Label>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                    <Button onClick={createWebhook}>Create Webhook</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="endpoints" className="space-y-4">
            <TabsList>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
              <TabsTrigger value="events">Event Types</TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="space-y-4">
              {webhooks.length === 0 ? (
                <div className="text-center py-8">
                  <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No webhooks configured</h3>
                  <p className="text-muted-foreground mb-4">Add webhook endpoints to receive real-time notifications</p>
                  <Button onClick={() => setShowCreateDialog(true)}>Create Your First Webhook</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <Card key={webhook.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{webhook.name}</h4>
                              {getStatusBadge(webhook)}
                            </div>
                            <p className="text-sm text-muted-foreground">{webhook.url}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Events: {webhook.events?.length || 0}</span>
                              <span>Success: {webhook.success_count}</span>
                              <span>Failed: {webhook.failure_count}</span>
                              {webhook.last_triggered_at && <span>Last: {new Date(webhook.last_triggered_at).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => testWebhook(webhook)}><Play className="h-4 w-4" /></Button>
                            <Switch checked={webhook.is_active} onCheckedChange={() => toggleWebhook(webhook)} />
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteWebhook(webhook.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              {webhookLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2" /><p>No webhook deliveries yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {webhookLogs.map((log) => (
                    <Card key={log.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{log.event_type}</span>
                              {log.response_status >= 200 && log.response_status < 300 ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">Status: {log.response_status} • Attempts: {log.attempts}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WEBHOOK_EVENTS.map((event) => (
                  <Card key={event}>
                    <CardContent className="p-4">
                      <h4 className="font-medium">{event}</h4>
                      <p className="text-sm text-muted-foreground">Triggered when {event.replace('.', ' is ').replace('_', ' ')}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
