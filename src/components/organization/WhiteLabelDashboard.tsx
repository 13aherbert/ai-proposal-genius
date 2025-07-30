import { BrandingProvider } from '@/components/branding/BrandingProvider';
import { BrandedNavbar } from '@/components/branding/BrandedNavbar';
import { BrandedFooter } from '@/components/branding/BrandedFooter';
import { BrandingEditor } from '@/components/branding/BrandingEditor';
import { ApiKeyManagement } from './ApiKeyManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useAuth } from '@/components/AuthProvider';
import { Palette, Key, Globe, Settings } from 'lucide-react';

export function WhiteLabelDashboard() {
  const { session } = useAuth();
  const { data: organizationId } = useCurrentOrganization(session?.user || null);

  if (!organizationId || !session?.user) {
    return <div>Loading organization...</div>;
  }

  return (
    <BrandingProvider>
      <div className="min-h-screen flex flex-col">
        <BrandedNavbar />
        
        <main className="flex-1 container py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">White Label Configuration</h1>
                <p className="text-muted-foreground">
                  Customize your organization's branding and manage API integrations
                </p>
              </div>
              <Badge variant="secondary">
                Organization Loaded
              </Badge>
            </div>

            <Tabs defaultValue="branding" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="branding" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="api" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Management
                </TabsTrigger>
                <TabsTrigger value="domains" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Domains
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="branding">
                <BrandingEditor />
              </TabsContent>

              <TabsContent value="api">
                <ApiKeyManagement />
              </TabsContent>

              <TabsContent value="domains">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Custom Domains
                    </CardTitle>
                    <CardDescription>
                      Manage custom domains for your white label deployment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Custom domain management will be available in the next update. 
                      Contact support to configure custom domains for your organization.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      White Label Settings
                    </CardTitle>
                    <CardDescription>
                      Configure advanced white label options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">White Label Mode</h4>
                        <p className="text-sm text-muted-foreground">
                          Enable complete white labeling for your organization
                        </p>
                      </div>
                      <Badge variant="secondary">
                        Available
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Custom Domain Support</h4>
                        <p className="text-sm text-muted-foreground">
                          Allow custom domains for your organization
                        </p>
                      </div>
                      <Badge variant="secondary">
                        Available
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">SSO Integration</h4>
                        <p className="text-sm text-muted-foreground">
                          Single Sign-On capabilities for your organization
                        </p>
                      </div>
                      <Badge variant="secondary">
                        Available
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  Preview how your branding will appear to users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-4">Preview Mode - Live Branding</p>
                    <BrandedNavbar />
                    <div className="py-8 px-4">
                      <h2 className="text-2xl font-bold mb-2">Welcome to Your Platform</h2>
                      <p className="text-muted-foreground">
                        This is how your branded interface will appear to users.
                      </p>
                    </div>
                    <BrandedFooter />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </BrandingProvider>
  );
}