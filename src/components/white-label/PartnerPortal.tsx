
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Settings, 
  BarChart3, 
  Globe, 
  Key, 
  Plus,
  ExternalLink,
  Copy,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface PartnerData {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'pending' | 'suspended';
  users: number;
  revenue: number;
  lastActivity: string;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
}

export function PartnerPortal() {
  const [partners] = useState<PartnerData[]>([
    {
      id: '1',
      name: 'Acme Solutions',
      domain: 'acme.proposalpro.com',
      status: 'active',
      users: 150,
      revenue: 2500,
      lastActivity: '2 hours ago'
    },
    {
      id: '2',
      name: 'TechStart Inc',
      domain: 'techstart.proposalpro.com',
      status: 'pending',
      users: 25,
      revenue: 500,
      lastActivity: '1 day ago'
    }
  ]);

  const [apiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Production API',
      key: 'pk_live_abc123...',
      created: '2024-01-15',
      lastUsed: '2 hours ago'
    },
    {
      id: '2',
      name: 'Development API',
      key: 'pk_test_def456...',
      created: '2024-01-10',
      lastUsed: '1 day ago'
    }
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      pending: "secondary",
      suspended: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Partner Portal</h2>
          <p className="text-muted-foreground">
            Manage your white label partnerships and integrations
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New Partner
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="api">API Management</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Partners</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Custom Domains</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold">$15,420</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">API Calls</p>
                    <p className="text-2xl font-bold">2.1M</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium">New partner activated</p>
                    <p className="text-sm text-muted-foreground">TechStart Inc successfully configured their domain</p>
                  </div>
                  <span className="text-sm text-muted-foreground">2 hours ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">Custom domain verified</p>
                    <p className="text-sm text-muted-foreground">acme.proposalpro.com SSL certificate installed</p>
                  </div>
                  <span className="text-sm text-muted-foreground">1 day ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="space-y-6">
          <div className="grid gap-4">
            {partners.map((partner) => (
              <Card key={partner.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{partner.name}</h3>
                        <p className="text-sm text-muted-foreground">{partner.domain}</p>
                      </div>
                      {getStatusBadge(partner.status)}
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <p className="font-medium">{partner.users}</p>
                        <p className="text-muted-foreground">Users</p>
                      </div>
                      <div>
                        <p className="font-medium">${partner.revenue}</p>
                        <p className="text-muted-foreground">Revenue</p>
                      </div>
                      <div>
                        <p className="font-medium">{partner.lastActivity}</p>
                        <p className="text-muted-foreground">Last Active</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                API Keys
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate New Key
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{key.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created: {key.created} | Last used: {key.lastUsed}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">{key.key}</code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(key.key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Manage custom domains for your white label partners. Each partner can have their own branded domain.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Domain
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partner Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Advanced analytics and reporting features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
