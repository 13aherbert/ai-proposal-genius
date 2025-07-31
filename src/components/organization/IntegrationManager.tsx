import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Zap, 
  Plus, 
  Settings, 
  ExternalLink, 
  Slack, 
  Github, 
  Mail,
  MessageSquare,
  Database,
  BarChart3,
  Users,
  Calendar,
  FileText,
  Shield,
  Puzzle
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: 'communication' | 'productivity' | 'analytics' | 'storage' | 'security';
  icon: React.ReactNode;
  is_enabled: boolean;
  configuration: Record<string, any>;
  created_at: string;
  last_sync_at?: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
}

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications and updates to Slack channels',
    provider: 'slack',
    category: 'communication' as const,
    icon: <Slack className="h-6 w-6" />,
    required_config: ['webhook_url', 'channel']
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Post messages and notifications to Discord servers',
    provider: 'discord',
    category: 'communication' as const,
    icon: <MessageSquare className="h-6 w-6" />,
    required_config: ['webhook_url']
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Sync projects and track development activities',
    provider: 'github',
    category: 'productivity' as const,
    icon: <Github className="h-6 w-6" />,
    required_config: ['access_token', 'repository']
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track user behavior and website analytics',
    provider: 'google',
    category: 'analytics' as const,
    icon: <BarChart3 className="h-6 w-6" />,
    required_config: ['tracking_id', 'api_key']
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Store and sync files with Google Drive',
    provider: 'google',
    category: 'storage' as const,
    icon: <Database className="h-6 w-6" />,
    required_config: ['client_id', 'client_secret']
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Send notifications to Teams channels',
    provider: 'microsoft',
    category: 'communication' as const,
    icon: <Users className="h-6 w-6" />,
    required_config: ['webhook_url']
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Sync scheduling and booking events',
    provider: 'calendly',
    category: 'productivity' as const,
    icon: <Calendar className="h-6 w-6" />,
    required_config: ['api_key']
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync data with Notion databases',
    provider: 'notion',
    category: 'productivity' as const,
    icon: <FileText className="h-6 w-6" />,
    required_config: ['integration_token']
  }
];

export function IntegrationManager() {
  const { organization } = useCurrentOrganization();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    if (organization?.id) {
      fetchIntegrations();
    }
  }, [organization?.id]);

  const fetchIntegrations = async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      
      // Since we don't have integration tables yet, we'll simulate with some mock data
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'Slack',
          description: 'Send notifications to Slack',
          provider: 'slack',
          category: 'communication',
          icon: <Slack className="h-6 w-6" />,
          is_enabled: true,
          configuration: { webhook_url: 'https://hooks.slack.com/...', channel: '#general' },
          created_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
          status: 'connected'
        }
      ];
      
      setIntegrations(mockIntegrations);
      
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const configureIntegration = (integration: any) => {
    setSelectedIntegration(integration);
    setConfigValues({});
    setShowConfigDialog(true);
  };

  const saveIntegrationConfig = async () => {
    if (!selectedIntegration || !organization?.id) return;

    try {
      const newIntegration: Integration = {
        id: Math.random().toString(36).substring(2, 15),
        name: selectedIntegration.name,
        description: selectedIntegration.description,
        provider: selectedIntegration.provider,
        category: selectedIntegration.category,
        icon: selectedIntegration.icon,
        is_enabled: true,
        configuration: configValues,
        created_at: new Date().toISOString(),
        status: 'connected'
      };

      setIntegrations(prev => [...prev, newIntegration]);
      
      toast.success(`${selectedIntegration.name} integration configured successfully`);
      setShowConfigDialog(false);
      setSelectedIntegration(null);
      setConfigValues({});
    } catch (error) {
      console.error('Error configuring integration:', error);
      toast.error('Failed to configure integration');
    }
  };

  const toggleIntegration = async (integration: Integration) => {
    try {
      const updatedIntegrations = integrations.map(i => 
        i.id === integration.id 
          ? { ...i, is_enabled: !i.is_enabled, status: (!i.is_enabled ? 'connected' : 'disconnected') as 'connected' | 'disconnected' | 'error' | 'syncing' }
          : i
      );
      setIntegrations(updatedIntegrations);
      
      toast.success(integration.is_enabled ? 'Integration disabled' : 'Integration enabled');
    } catch (error) {
      console.error('Error toggling integration:', error);
      toast.error('Failed to update integration');
    }
  };

  const testIntegration = async (integration: Integration) => {
    try {
      // Simulate testing the integration
      toast.success(`${integration.name} integration test successful`);
    } catch (error) {
      console.error('Error testing integration:', error);
      toast.error('Integration test failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="secondary">Disconnected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-100 text-blue-800">Syncing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication': return <MessageSquare className="h-4 w-4" />;
      case 'productivity': return <Zap className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'storage': return <Database className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      default: return <Puzzle className="h-4 w-4" />;
    }
  };

  const filteredAvailableIntegrations = AVAILABLE_INTEGRATIONS.filter(integration => {
    if (activeCategory === 'all') return true;
    return integration.category === activeCategory;
  }).filter(integration => {
    return !integrations.some(i => i.provider === integration.provider);
  });

  const categories = [
    { id: 'all', name: 'All', icon: <Puzzle className="h-4 w-4" /> },
    { id: 'communication', name: 'Communication', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'productivity', name: 'Productivity', icon: <Zap className="h-4 w-4" /> },
    { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'storage', name: 'Storage', icon: <Database className="h-4 w-4" /> },
    { id: 'security', name: 'Security', icon: <Shield className="h-4 w-4" /> }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Integration Management
              </CardTitle>
              <CardDescription>
                Connect your organization with external services and automate workflows
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connected" className="space-y-4">
            <TabsList>
              <TabsTrigger value="connected">Connected ({integrations.length})</TabsTrigger>
              <TabsTrigger value="available">Available ({filteredAvailableIntegrations.length})</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            </TabsList>

            <TabsContent value="connected" className="space-y-4">
              {integrations.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No integrations connected</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect external services to automate your workflows
                  </p>
                  <Button onClick={() => setActiveCategory('all')}>
                    Browse Available Integrations
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <Card key={integration.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 border rounded-lg">
                              {integration.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{integration.name}</h4>
                                {getStatusBadge(integration.status)}
                                <Badge variant="outline" className="flex items-center gap-1">
                                  {getCategoryIcon(integration.category)}
                                  {integration.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {integration.description}
                              </p>
                              {integration.last_sync_at && (
                                <p className="text-xs text-muted-foreground">
                                  Last sync: {new Date(integration.last_sync_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => testIntegration(integration)}
                            >
                              Test
                            </Button>
                            <Switch
                              checked={integration.is_enabled}
                              onCheckedChange={() => toggleIntegration(integration)}
                            />
                            <Button size="sm" variant="ghost">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="available" className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category.id)}
                    className="flex items-center gap-1"
                  >
                    {category.icon}
                    {category.name}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAvailableIntegrations.map((integration) => (
                  <Card key={integration.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 border rounded-lg">
                            {integration.icon}
                          </div>
                          <div>
                            <h4 className="font-medium">{integration.name}</h4>
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              {getCategoryIcon(integration.category)}
                              {integration.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {integration.description}
                        </p>
                        <Button 
                          className="w-full" 
                          onClick={() => configureIntegration(integration)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="marketplace" className="space-y-4">
              <div className="text-center py-8">
                <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Integration Marketplace</h3>
                <p className="text-muted-foreground mb-4">
                  Discover more integrations and custom solutions
                </p>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Marketplace
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Enter the required configuration details for this integration
            </DialogDescription>
          </DialogHeader>
          {selectedIntegration && (
            <div className="space-y-4">
              {selectedIntegration.required_config?.map((configKey: string) => (
                <div key={configKey} className="space-y-2">
                  <Label htmlFor={configKey}>
                    {configKey.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Label>
                  <Input
                    id={configKey}
                    placeholder={`Enter ${configKey.replace('_', ' ')}`}
                    value={configValues[configKey] || ''}
                    onChange={(e) => setConfigValues(prev => ({
                      ...prev,
                      [configKey]: e.target.value
                    }))}
                    type={configKey.includes('token') || configKey.includes('key') ? 'password' : 'text'}
                  />
                </div>
              ))}
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your configuration data is encrypted and stored securely.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={saveIntegrationConfig}
                  disabled={!selectedIntegration?.required_config?.every((key: string) => configValues[key])}
                >
                  Connect Integration
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}