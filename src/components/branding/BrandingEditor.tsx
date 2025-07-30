import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrandingContext } from './BrandingProvider';
import { useToast } from '@/hooks/use-toast';
import { Palette, Upload, Code, Globe } from 'lucide-react';
import { BrandingConfig } from '@/hooks/useBranding';

export function BrandingEditor() {
  const { branding, updateBranding, loading } = useBrandingContext();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<BrandingConfig>>(branding || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateBranding(formData);
      toast({
        title: 'Branding updated',
        description: 'Your organization branding has been successfully updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update branding. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div>Loading branding editor...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Brand Configuration</h2>
        <p className="text-muted-foreground">
          Customize your organization's branding and appearance.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic brand information and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    value={formData.brandName || ''}
                    onChange={(e) => handleInputChange('brandName', e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={formData.supportEmail || ''}
                    onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                    placeholder="support@yourcompany.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline || ''}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  placeholder="Your company tagline"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="privacyPolicyUrl">Privacy Policy URL</Label>
                  <Input
                    id="privacyPolicyUrl"
                    type="url"
                    value={formData.privacyPolicyUrl || ''}
                    onChange={(e) => handleInputChange('privacyPolicyUrl', e.target.value)}
                    placeholder="https://yourcompany.com/privacy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termsOfServiceUrl">Terms of Service URL</Label>
                  <Input
                    id="termsOfServiceUrl"
                    type="url"
                    value={formData.termsOfServiceUrl || ''}
                    onChange={(e) => handleInputChange('termsOfServiceUrl', e.target.value)}
                    placeholder="https://yourcompany.com/terms"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>
                Customize your brand colors and appearance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor || '#3b82f6'}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.primaryColor || '#3b82f6'}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor || '#64748b'}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.secondaryColor || '#64748b'}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      placeholder="#64748b"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={formData.accentColor || '#06b6d4'}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.accentColor || '#06b6d4'}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      placeholder="#06b6d4"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.textColor || '#1e293b'}
                      onChange={(e) => handleInputChange('textColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.textColor || '#1e293b'}
                      onChange={(e) => handleInputChange('textColor', e.target.value)}
                      placeholder="#1e293b"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor || '#ffffff'}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.backgroundColor || '#ffffff'}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Brand Assets</CardTitle>
              <CardDescription>
                Upload and manage your brand logos and assets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={formData.logoUrl || ''}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    type="url"
                    value={formData.faviconUrl || ''}
                    onChange={(e) => handleInputChange('faviconUrl', e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Input
                  id="fontFamily"
                  value={formData.fontFamily || 'Inter'}
                  onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                  placeholder="Inter, sans-serif"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Customization</CardTitle>
              <CardDescription>
                Add custom CSS for advanced styling customizations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customCss">Custom CSS</Label>
                <Textarea
                  id="customCss"
                  value={formData.customCss || ''}
                  onChange={(e) => handleInputChange('customCss', e.target.value)}
                  placeholder="/* Custom CSS styles */&#10;.custom-class {&#10;  color: #333;&#10;}"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}