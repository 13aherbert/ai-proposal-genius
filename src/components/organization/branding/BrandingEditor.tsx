import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Eye, RotateCcw, Save, Palette, Type, Image as ImageIcon, Code } from 'lucide-react';
import { toast } from 'sonner';
import { useBranding } from '@/contexts/BrandingContext';

const fontOptions = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Nunito', label: 'Nunito' },
];

export function BrandingEditor() {
  const { branding, loading, updateBranding, resetToDefaults } = useBranding();
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(branding || {});

  React.useEffect(() => {
    if (branding) {
      setFormData(branding);
    }
  }, [branding]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateBranding(formData);
      toast.success('Branding updated successfully');
    } catch (error) {
      toast.error('Failed to update branding');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetToDefaults();
      toast.success('Branding reset to defaults');
    } catch (error) {
      toast.error('Failed to reset branding');
      console.error(error);
    }
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
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
          <h2 className="text-2xl font-bold">Brand Customization</h2>
          <p className="text-muted-foreground">
            Customize your organization's branding and visual identity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={togglePreview}>
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {isPreviewMode ? (
        <PreviewMode formData={formData} />
      ) : (
        <EditMode formData={formData} onInputChange={handleInputChange} />
      )}
    </div>
  );
}

function PreviewMode({ formData }: { formData: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Brand Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: formData.background_color,
              color: formData.text_color,
              fontFamily: formData.font_family,
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {formData.logo_url && (
                  <img src={formData.logo_url} alt="Logo" className="h-12 w-auto" />
                )}
                <div>
                  <h3 className="text-xl font-bold" style={{ color: formData.primary_color }}>
                    {formData.brand_name || 'Your Brand Name'}
                  </h3>
                  {formData.tagline && (
                    <p className="text-sm opacity-75">{formData.tagline}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div
                  className="p-4 rounded"
                  style={{ backgroundColor: formData.primary_color, color: 'white' }}
                >
                  <h4 className="font-semibold">Primary Color</h4>
                  <p className="text-sm">Main brand color</p>
                </div>
                <div
                  className="p-4 rounded"
                  style={{ backgroundColor: formData.secondary_color, color: 'white' }}
                >
                  <h4 className="font-semibold">Secondary Color</h4>
                  <p className="text-sm">Supporting color</p>
                </div>
                <div
                  className="p-4 rounded"
                  style={{ backgroundColor: formData.accent_color, color: 'white' }}
                >
                  <h4 className="font-semibold">Accent Color</h4>
                  <p className="text-sm">Highlight color</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditMode({ formData, onInputChange }: { formData: any; onInputChange: (field: string, value: string) => void }) {
  return (
    <Tabs defaultValue="colors" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="colors" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Colors
        </TabsTrigger>
        <TabsTrigger value="typography" className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          Typography
        </TabsTrigger>
        <TabsTrigger value="assets" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Assets
        </TabsTrigger>
        <TabsTrigger value="advanced" className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          Advanced
        </TabsTrigger>
      </TabsList>

      <TabsContent value="colors" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={formData.primary_color || '#3b82f6'}
                    onChange={(e) => onInputChange('primary_color', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.primary_color || '#3b82f6'}
                    onChange={(e) => onInputChange('primary_color', e.target.value)}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={formData.secondary_color || '#64748b'}
                    onChange={(e) => onInputChange('secondary_color', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.secondary_color || '#64748b'}
                    onChange={(e) => onInputChange('secondary_color', e.target.value)}
                    placeholder="#64748b"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="accent-color"
                    type="color"
                    value={formData.accent_color || '#06b6d4'}
                    onChange={(e) => onInputChange('accent_color', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.accent_color || '#06b6d4'}
                    onChange={(e) => onInputChange('accent_color', e.target.value)}
                    placeholder="#06b6d4"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="background-color"
                    type="color"
                    value={formData.background_color || '#ffffff'}
                    onChange={(e) => onInputChange('background_color', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.background_color || '#ffffff'}
                    onChange={(e) => onInputChange('background_color', e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="text-color"
                    type="color"
                    value={formData.text_color || '#1e293b'}
                    onChange={(e) => onInputChange('text_color', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.text_color || '#1e293b'}
                    onChange={(e) => onInputChange('text_color', e.target.value)}
                    placeholder="#1e293b"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="typography" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Typography Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select
                value={formData.font_family || 'Inter'}
                onValueChange={(value) => onInputChange('font_family', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font family" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="assets" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Brand Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                value={formData.brand_name || ''}
                onChange={(e) => onInputChange('brand_name', e.target.value)}
                placeholder="Your Brand Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline || ''}
                onChange={(e) => onInputChange('tagline', e.target.value)}
                placeholder="Your brand tagline"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                value={formData.logo_url || ''}
                onChange={(e) => onInputChange('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favicon-url">Favicon URL</Label>
              <Input
                id="favicon-url"
                value={formData.favicon_url || ''}
                onChange={(e) => onInputChange('favicon_url', e.target.value)}
                placeholder="https://example.com/favicon.ico"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                value={formData.support_email || ''}
                onChange={(e) => onInputChange('support_email', e.target.value)}
                placeholder="support@yourcompany.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacy-url">Privacy Policy URL</Label>
              <Input
                id="privacy-url"
                value={formData.privacy_policy_url || ''}
                onChange={(e) => onInputChange('privacy_policy_url', e.target.value)}
                placeholder="https://yourcompany.com/privacy"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms-url">Terms of Service URL</Label>
              <Input
                id="terms-url"
                value={formData.terms_of_service_url || ''}
                onChange={(e) => onInputChange('terms_of_service_url', e.target.value)}
                placeholder="https://yourcompany.com/terms"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="advanced" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Advanced Customization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="custom-css">Custom CSS</Label>
              <Textarea
                id="custom-css"
                value={formData.custom_css || ''}
                onChange={(e) => onInputChange('custom_css', e.target.value)}
                placeholder="/* Custom CSS styles */
.custom-element {
  background-color: var(--primary);
  color: white;
}"
                className="font-mono text-sm min-h-32"
              />
              <p className="text-xs text-muted-foreground">
                Add custom CSS to further customize your brand appearance. Use CSS custom properties for colors.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}