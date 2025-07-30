import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useProfile } from '@/hooks/use-profile';
import { Key, MoreHorizontal, Copy, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface ApiKey {
  id: string;
  keyName: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  permissions: Record<string, string[]>;
}

export function ApiKeyManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdApiKey, setCreatedApiKey] = useState<string>('');
  const { profile } = useProfile();
  const { data: organization } = useCurrentOrganization(profile);
  const { toast } = useToast();

  useEffect(() => {
    if (organization) {
      fetchApiKeys();
    }
  }, [organization]);

  const fetchApiKeys = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organization_api_keys')
        .select('*')
        .eq('organization_id', organization)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApiKeys(data?.map(key => ({
        id: key.id,
        keyName: key.key_name,
        lastUsedAt: key.last_used_at,
        expiresAt: key.expires_at,
        isActive: key.is_active,
        createdAt: key.created_at,
        permissions: (key.permissions as Record<string, string[]>) || {},
      })) || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch API keys',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    return 'oak_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const hashApiKey = async (apiKey: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const createApiKey = async () => {
    if (!organization || !newKeyName.trim()) return;

    try {
      const apiKey = generateApiKey();
      const apiKeyHash = await hashApiKey(apiKey);

      const { error } = await supabase
        .from('organization_api_keys')
        .insert({
          organization_id: organization,
          key_name: newKeyName.trim(),
          api_key_hash: apiKeyHash,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          permissions: {
            projects: ['read'],
            knowledge_base: ['read'],
          },
        });

      if (error) throw error;

      setCreatedApiKey(apiKey);
      setNewKeyName('');
      fetchApiKeys();

      toast({
        title: 'API Key Created',
        description: 'Your new API key has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive',
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

      fetchApiKeys();
      toast({
        title: 'API Key Deleted',
        description: 'The API key has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete API key',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key Management
            </CardTitle>
            <CardDescription>
              Create and manage API keys for accessing your organization's data
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key to access your organization's data programmatically.
                </DialogDescription>
              </DialogHeader>
              
              {createdApiKey ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Your new API key:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-background p-2 rounded border">
                        {createdApiKey}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(createdApiKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Make sure to copy this API key now. You won't be able to see it again!
                  </p>
                  <Button 
                    onClick={() => {
                      setCreatedApiKey('');
                      setShowCreateDialog(false);
                    }}
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">API Key Name</Label>
                    <Input
                      id="keyName"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="My API Key"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createApiKey} disabled={!newKeyName.trim()}>
                      Create API Key
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading API keys...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No API keys found. Create your first API key to get started.
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.keyName}</TableCell>
                    <TableCell>
                      <Badge variant={key.isActive ? 'default' : 'secondary'}>
                        {key.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {key.lastUsedAt ? format(new Date(key.lastUsedAt), 'MMM d, yyyy') : 'Never'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(key.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => deleteApiKey(key.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}