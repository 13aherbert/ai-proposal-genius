import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Shield, Key, Settings, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { useAuth } from "@/components/AuthProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SSOConfig {
  id: string;
  provider_type: 'saml' | 'oauth' | 'oidc';
  provider_name: string;
  configuration: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function SSOConfiguration() {
  const { session } = useAuth();
  const { organization: currentOrganization } = useCurrentOrganization();
  const [ssoConfigs, setSsoConfigs] = useState<SSOConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SSOConfig | null>(null);

  // New SSO configuration form state
  const [newConfig, setNewConfig] = useState<{
    provider_type: 'saml' | 'oauth' | 'oidc';
    provider_name: string;
    configuration: Record<string, any>;
    is_active: boolean;
  }>({
    provider_type: 'oauth' as const,
    provider_name: '',
    configuration: {},
    is_active: false
  });

  useEffect(() => {
    if (currentOrganization) {
      fetchSSOConfigs();
    }
  }, [currentOrganization]);

  const fetchSSOConfigs = async () => {
    if (!currentOrganization?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('organization_sso_config')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSsoConfigs(data as SSOConfig[] || []);
    } catch (error: any) {
      console.error('Error fetching SSO configs:', error);
      toast.error("Failed to load SSO configurations", {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    if (!currentOrganization?.id || !newConfig.provider_name.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsCreating(true);
      const { error } = await supabase
        .from('organization_sso_config')
        .insert({
          organization_id: currentOrganization.id,
          provider_type: newConfig.provider_type,
          provider_name: newConfig.provider_name,
          configuration: newConfig.configuration,
          is_active: newConfig.is_active
        });

      if (error) throw error;

      toast.success("SSO configuration created successfully");
      setShowCreateForm(false);
      setNewConfig({
        provider_type: 'oauth' as const,
        provider_name: '',
        configuration: {},
        is_active: false
      });
      fetchSSOConfigs();
    } catch (error: any) {
      console.error('Error creating SSO config:', error);
      toast.error("Failed to create SSO configuration", {
        description: error.message
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleConfig = async (config: SSOConfig) => {
    try {
      const { error } = await supabase
        .from('organization_sso_config')
        .update({ is_active: !config.is_active })
        .eq('id', config.id);

      if (error) throw error;

      toast.success(
        config.is_active 
          ? "SSO configuration disabled" 
          : "SSO configuration enabled"
      );
      fetchSSOConfigs();
    } catch (error: any) {
      console.error('Error toggling SSO config:', error);
      toast.error("Failed to update SSO configuration", {
        description: error.message
      });
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    try {
      const { error } = await supabase
        .from('organization_sso_config')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      toast.success("SSO configuration deleted");
      fetchSSOConfigs();
    } catch (error: any) {
      console.error('Error deleting SSO config:', error);
      toast.error("Failed to delete SSO configuration", {
        description: error.message
      });
    }
  };

  const getProviderDisplayName = (type: string) => {
    switch (type) {
      case 'saml': return 'SAML 2.0';
      case 'oauth': return 'OAuth 2.0';
      case 'oidc': return 'OpenID Connect';
      default: return type.toUpperCase();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SSO Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SSO Configuration
              </CardTitle>
              <CardDescription>
                Configure Single Sign-On providers for your organization
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add SSO Provider
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ssoConfigs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No SSO providers configured</h3>
              <p className="text-muted-foreground mb-4">
                Add SSO providers to enable single sign-on for your organization
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                Configure SSO
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ssoConfigs.map((config) => (
                <div 
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{config.provider_name}</h4>
                        <Badge variant={config.is_active ? "default" : "secondary"}>
                          {getProviderDisplayName(config.provider_type)}
                        </Badge>
                        {config.is_active && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(config.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.is_active}
                      onCheckedChange={() => handleToggleConfig(config)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingConfig(config)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete SSO Configuration</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the SSO configuration for {config.provider_name}? 
                            This action cannot be undone and will disable SSO for this provider.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteConfig(config.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create SSO Provider Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add SSO Provider</CardTitle>
            <CardDescription>
              Configure a new Single Sign-On provider for your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider-type">Provider Type</Label>
                <Select
                  value={newConfig.provider_type}
                  onValueChange={(value: 'saml' | 'oauth' | 'oidc') => 
                    setNewConfig(prev => ({ ...prev, provider_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oauth">OAuth 2.0</SelectItem>
                    <SelectItem value="saml">SAML 2.0</SelectItem>
                    <SelectItem value="oidc">OpenID Connect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-name">Provider Name</Label>
                <Input
                  id="provider-name"
                  placeholder="e.g., Google, Microsoft, Okta"
                  value={newConfig.provider_name}
                  onChange={(e) => setNewConfig(prev => ({ 
                    ...prev, 
                    provider_name: e.target.value 
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="configuration">Configuration (JSON)</Label>
              <Textarea
                id="configuration"
                placeholder="Enter provider configuration as JSON"
                rows={6}
                value={JSON.stringify(newConfig.configuration, null, 2)}
                onChange={(e) => {
                  try {
                    const config = JSON.parse(e.target.value || '{}');
                    setNewConfig(prev => ({ ...prev, configuration: config }));
                  } catch {
                    // Invalid JSON, keep the text as is for user to fix
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={newConfig.is_active}
                  onCheckedChange={(checked) => 
                    setNewConfig(prev => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is-active">Enable this provider</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateConfig}
                disabled={isCreating || !newConfig.provider_name.trim()}
              >
                {isCreating ? "Creating..." : "Create Provider"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
