import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Calendar, 
  Shield,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { formatDistanceToNow } from 'date-fns';

interface ApiKey {
  id: string;
  key_name: string;
  api_key_hash: string;
  permissions: any;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const permissionCategories = {
  projects: ['read', 'write', 'delete'],
  knowledge: ['read', 'write', 'delete'],
  analytics: ['read'],
  webhooks: ['read', 'write'],
};

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    permissions: {} as Record<string, string[]>,
    expires_in: '30d',
  });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  
  const { organization } = useCurrentOrganization();

  const loadApiKeys = async () => {
    setApiKeys([]);
    setLoading(false);
  };

  const generateApiKey = () => {
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substring(2);
    return `sk_${organization?.id?.substring(0, 8)}_${timestamp}_${randomStr}`;
  };

  const handleCreateKey = async () => {
    if (!organization?.id || !newKeyData.name.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    try {
      const apiKey = generateApiKey();
      const expiresAt = newKeyData.expires_in === 'never' 
        ? null 
        : new Date(Date.now() + (parseInt(newKeyData.expires_in) * 24 * 60 * 60 * 1000)).toISOString();

      const { data, error } = await supabase
        .from('organization_api_keys')
        .insert({
          organization_id: organization.id,
          key_name: newKeyData.name,
          api_key_hash: btoa(apiKey), // In production, use proper hashing
          permissions: newKeyData.permissions,
          expires_at: expiresAt,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setGeneratedKey(apiKey);
      setApiKeys(prev => [data, ...prev]);
      toast.success('API key created successfully');
      
      // Reset form
      setNewKeyData({
        name: '',
        permissions: {},
        expires_in: '30d',
      });
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error('Failed to create API key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('organization_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      setShowDeleteDialog(null);
      toast.success('API key deleted successfully');
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setRevealedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard');
  };

  const getKeyStatus = (key: ApiKey) => {
    if (!key.is_active) return { status: 'inactive', color: 'destructive' };
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return { status: 'expired', color: 'destructive' };
    }
    return { status: 'active', color: 'success' };
  };

  useEffect(() => {
    loadApiKeys();
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
            <Key className="h-6 w-6" />
            API Keys
          </h2>
          <p className="text-muted-foreground">
            Manage API keys for programmatic access to your organization's data
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
              <p className="text-muted-foreground mb-4">
                Create your first API key to start integrating with our platform
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((key) => {
            const keyStatus = getKeyStatus(key);
            const isRevealed = revealedKeys.has(key.id);
            const displayKey = isRevealed 
              ? atob(key.api_key_hash) // In production, you'd need to store and retrieve the actual key
              : '••••••••••••••••••••••••••••••••••••••••';

            return (
              <Card key={key.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{key.key_name}</h3>
                        <Badge 
                          variant={keyStatus.color === 'success' ? 'default' : 'destructive'}
                          className="capitalize"
                        >
                          {keyStatus.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {keyStatus.status === 'expired' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {keyStatus.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1">
                          {displayKey}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(atob(key.api_key_hash))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                        </span>
                        {key.last_used_at && (
                          <span>
                            Last used {formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })}
                          </span>
                        )}
                        {key.expires_at && (
                          <span>
                            Expires {formatDistanceToNow(new Date(key.expires_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteDialog(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for programmatic access to your organization's data
            </DialogDescription>
          </DialogHeader>

          {generatedKey ? (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> This is the only time you'll be able to see this key. 
                  Copy it now and store it securely.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Your API Key</Label>
                <div className="flex gap-2">
                  <Input 
                    value={generatedKey} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button onClick={() => copyToClipboard(generatedKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My API Key"
                />
              </div>

              <div className="space-y-2">
                <Label>Expiration</Label>
                <Select
                  value={newKeyData.expires_in}
                  onValueChange={(value) => setNewKeyData(prev => ({ ...prev, expires_in: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 days</SelectItem>
                    <SelectItem value="30d">30 days</SelectItem>
                    <SelectItem value="90d">90 days</SelectItem>
                    <SelectItem value="365d">1 year</SelectItem>
                    <SelectItem value="never">Never expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="space-y-3">
                  {Object.entries(permissionCategories).map(([category, permissions]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-sm font-medium capitalize">{category}</h4>
                      <div className="flex gap-2 flex-wrap">
                        {permissions.map(permission => (
                          <Button
                            key={`${category}-${permission}`}
                            variant={
                              newKeyData.permissions[category]?.includes(permission) 
                                ? 'default' 
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => {
                              const current = newKeyData.permissions[category] || [];
                              const updated = current.includes(permission)
                                ? current.filter(p => p !== permission)
                                : [...current, permission];
                              
                              setNewKeyData(prev => ({
                                ...prev,
                                permissions: {
                                  ...prev.permissions,
                                  [category]: updated,
                                },
                              }));
                            }}
                          >
                            {permission}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {generatedKey ? (
              <Button onClick={() => {
                setShowCreateDialog(false);
                setGeneratedKey(null);
              }}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateKey}>
                  Create API Key
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => showDeleteDialog && handleDeleteKey(showDeleteDialog)}
            >
              Delete Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}