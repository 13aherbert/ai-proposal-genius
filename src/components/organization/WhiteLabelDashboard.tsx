import { BrandingProvider } from '@/components/branding/BrandingProvider';
import { BrandedNavbar } from '@/components/branding/BrandedNavbar';
import { BrandedFooter } from '@/components/branding/BrandedFooter';
import { BrandingEditor } from '@/components/branding/BrandingEditor';
import { ApiKeyManagement } from './ApiKeyManagement';
import { DomainManager } from './DomainManager';
import { AssetUploader } from './AssetUploader';
import { EmailTemplateEditor } from '@/components/email/EmailTemplateEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useAuth } from '@/components/AuthProvider';
import { Palette, Key, Globe, Settings, Upload, Mail } from 'lucide-react';

export function WhiteLabelDashboard() {
  const { session } = useAuth();
  const { organization } = useCurrentOrganization();

  if (!organization?.id || !session?.user) {
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
                  Customize your organization's branding, manage domains, templates, and API integrations
                </p>
              </div>
              <Badge variant="secondary">
                Organization: {organization.name}
              </Badge>
            </div>

            <Tabs defaultValue="branding" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="branding" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="assets" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Assets
                </TabsTrigger>
                <TabsTrigger value="domains" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Domains
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Templates
                </TabsTrigger>
                <TabsTrigger value="api" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API
                </TabsTrigger>
              </TabsList>

              <TabsContent value="branding">
                <Card>
                  <CardHeader>
                    <CardTitle>Brand Configuration</CardTitle>
                    <CardDescription>
                      Customize your organization's branding and appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BrandingEditor />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assets">
                <AssetUploader 
                  onAssetUploaded={(url, type) => {
                    console.log(`${type} uploaded:`, url);
                    // Handle asset upload and update branding
                  }}
                />
              </TabsContent>

              <TabsContent value="domains">
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Domains</CardTitle>
                    <CardDescription>
                      Configure custom domains for your white-label application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DomainManager />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email">
                <EmailTemplateEditor />
              </TabsContent>

              <TabsContent value="api">
                <Card>
                  <CardHeader>
                    <CardTitle>API Management</CardTitle>
                    <CardDescription>
                      Manage API keys and integrations for your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ApiKeyManagement />
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