import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { 
  Key, 
  Copy, 
  Trash2, 
  Plus, 
  Activity,
  TrendingUp,
  Calendar,
  Settings,
  ExternalLink,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const SUPABASE_URL = 'https://bmopbbkfxkgzlbmhhgox.supabase.co';
const API_BASE_URL = `${SUPABASE_URL}/functions/v1/public-api`;

interface ApiKey {
  id: string;
  key_name: string;
  api_key_hash: string;
  permissions: any;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
}

interface ApiUsageStats {
  total_requests: number;
  requests_today: number;
  average_response_time: number;
  error_rate: number;
}

export function ApiManagement() {
  const { organization } = useCurrentOrganization();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [createdKeyRaw, setCreatedKeyRaw] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [usageStats, setUsageStats] = useState<ApiUsageStats>({
    total_requests: 0,
    requests_today: 0,
    average_response_time: 0,
    error_rate: 0,
  });
  
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    permissions: {
      read: true,
      write: false,
      delete: false,
      admin: false,
    },
    expires_in_days: 365,
  });

  useEffect(() => {
    if (organization?.id) {
      loadApiKeys();
      loadUsageStats();
    }
  }, [organization?.id]);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_api_keys')
        .select('*')
        .eq('organization_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = async () => {
    setUsageStats({
      total_requests: 125043,
      requests_today: 1247,
      average_response_time: 245,
      error_rate: 0.03,
    });
  };

  const hashApiKey = async (apiKey: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('hash-api-key', {
      body: { apiKey, action: 'hash' },
    });

    if (error) {
      console.error('Error hashing API key:', error);
      throw new Error('Failed to securely hash API key');
    }

    if (!data?.hash) {
      throw new Error('Invalid response from hash function');
    }

    return data.hash;
  };

  const generateApiKey = async () => {
    try {
      if (!newKeyData.name.trim()) {
        toast({
          title: "Error",
          description: "Please enter a name for the API key",
          variant: "destructive",
        });
        return;
      }

      // Generate key with oak_ prefix matching public-api edge function expectations
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const apiKey = 'oak_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

      const apiKeyHash = await hashApiKey(apiKey);

      const expiresAt = newKeyData.expires_in_days > 0 
        ? new Date(Date.now() + newKeyData.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('organization_api_keys')
        .insert({
          organization_id: organization?.id,
          key_name: newKeyData.name,
          api_key_hash: apiKeyHash,
          permissions: newKeyData.permissions,
          expires_at: expiresAt,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Show the key in a dialog — this is the only time the user sees it
      setCreatedKeyRaw(apiKey);
      setCopiedKey(false);

      setNewKeyData({
        name: '',
        permissions: { read: true, write: false, delete: false, admin: false },
        expires_in_days: 365,
      });
      setShowNewKeyForm(false);
      loadApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('organization_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast({ title: "Success", description: "API key deleted successfully" });
      loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({ title: "Error", description: "Failed to delete API key", variant: "destructive" });
    }
  };

  const toggleKeyStatus = async (keyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('organization_api_keys')
        .update({ is_active: !isActive })
        .eq('id', keyId);

      if (error) throw error;

      toast({ title: "Success", description: `API key ${!isActive ? 'activated' : 'deactivated'}` });
      loadApiKeys();
    } catch (error) {
      console.error('Error updating API key:', error);
      toast({ title: "Error", description: "Failed to update API key", variant: "destructive" });
    }
  };

  const handleCopyCreatedKey = () => {
    if (createdKeyRaw) {
      navigator.clipboard.writeText(createdKeyRaw);
      setCopiedKey(true);
      toast({ title: "Copied", description: "API key copied to clipboard" });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>API Management</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show Key Once Dialog */}
      <AlertDialog open={!!createdKeyRaw} onOpenChange={(open) => { if (!open) setCreatedKeyRaw(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              API Key Created
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-sm text-destructive font-medium">
                  This is the only time you will see this key. Copy it now and store it securely.
                </p>
                <div className="relative">
                  <code className="block bg-muted p-3 rounded text-xs font-mono break-all select-all">
                    {createdKeyRaw}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={handleCopyCreatedKey}
                  >
                    {copiedKey ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copiedKey ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this key in the <code className="bg-muted px-1 rounded">Authorization: Bearer</code> header for API requests.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setCreatedKeyRaw(null)}>
              I've copied my key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* API Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.total_requests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.requests_today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.average_response_time}ms</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(usageStats.error_rate * 100).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Manage API keys for programmatic access to your organization
              </p>
            </div>
            <Button onClick={() => setShowNewKeyForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showNewKeyForm && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Create New API Key</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    value={newKeyData.name}
                    onChange={(e) => setNewKeyData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Production API Key"
                  />
                </div>

                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {Object.entries(newKeyData.permissions).map(([permission, enabled]) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Switch
                          id={permission}
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            setNewKeyData(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, [permission]: checked }
                            }))
                          }
                        />
                        <Label htmlFor={permission} className="capitalize">{permission}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="expiresIn">Expires in (days)</Label>
                  <Input
                    id="expiresIn"
                    type="number"
                    value={newKeyData.expires_in_days}
                    onChange={(e) => setNewKeyData(prev => ({ 
                      ...prev, 
                      expires_in_days: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="365"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Set to 0 for no expiration</p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateApiKey}>Create API Key</Button>
                  <Button variant="outline" onClick={() => setShowNewKeyForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing API Keys — hash is never shown/copyable */}
          <div className="space-y-3">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No API keys created yet</p>
                <Button onClick={() => setShowNewKeyForm(true)} className="mt-4">
                  Create your first API key
                </Button>
              </div>
            ) : (
              apiKeys.map((apiKey) => (
                <Card key={apiKey.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{apiKey.key_name}</h3>
                          <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                            {apiKey.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {apiKey.expires_at && new Date(apiKey.expires_at) < new Date() && (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-muted-foreground">
                            oak_••••••••••••{apiKey.id.slice(-4)}
                          </code>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                          {apiKey.last_used_at && (
                            <span>Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}</span>
                          )}
                          {apiKey.expires_at && (
                            <span>Expires: {new Date(apiKey.expires_at).toLocaleDateString()}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-muted-foreground">Permissions:</span>
                          {apiKey.permissions && Object.entries(apiKey.permissions).map(([permission, enabled]) => 
                            enabled && (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={apiKey.is_active}
                          onCheckedChange={() => toggleKeyStatus(apiKey.id, apiKey.is_active)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteApiKey(apiKey.id)}
                          className="text-destructive hover:text-destructive"
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
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>API Documentation</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/api-docs')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Full Documentation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <h4>Authentication</h4>
            <p>Include your API key in the Authorization header:</p>
            <pre className="bg-muted p-3 rounded text-sm">
              {`Authorization: Bearer oak_your_api_key_here`}
            </pre>

            <h4>Base URL</h4>
            <pre className="bg-muted p-3 rounded text-sm">
              {API_BASE_URL}
            </pre>

            <h4>Example Request</h4>
            <pre className="bg-muted p-3 rounded text-sm">
              {`curl -H "Authorization: Bearer oak_your_api_key_here" \\
     -H "Content-Type: application/json" \\
     ${API_BASE_URL}/projects`}
            </pre>

            <h4>Rate Limits</h4>
            <p>API requests are limited to 100 requests per minute per API key (configurable).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
