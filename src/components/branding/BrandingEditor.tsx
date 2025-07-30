import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Upload, 
  Eye, 
  Code, 
  Save,
  RotateCcw,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  Globe
} from 'lucide-react';
import { useBrandingContext } from './BrandingProvider';
import { useToast } from '@/hooks/use-toast';
import { BrandingConfig } from '@/hooks/useBranding';

interface BrandPreviewProps {
  branding: any;
  viewMode: 'desktop' | 'tablet' | 'mobile';
}

function BrandPreview({ branding, viewMode }: BrandPreviewProps) {
  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'mobile': return 'w-80';
      case 'tablet': return 'w-96';
      default: return 'w-full max-w-4xl';
    }
  };

  return (
    <div className={`${getPreviewWidth()} mx-auto border rounded-lg overflow-hidden bg-white shadow-lg`}>
      <style>
        {`
          .brand-preview {
            --primary-color: ${branding.primaryColor || '#3b82f6'};
            --secondary-color: ${branding.secondaryColor || '#64748b'};
            --accent-color: ${branding.accentColor || '#06b6d4'};
            --text-color: ${branding.textColor || '#1e293b'};
            --background-color: ${branding.backgroundColor || '#ffffff'};
            --font-family: ${branding.fontFamily || 'Inter'};
          }
          .brand-preview * {
            font-family: var(--font-family), sans-serif;
          }
        `}
      </style>
      
      <div className="brand-preview" style={{ 
        backgroundColor: branding.backgroundColor || '#ffffff',
        color: branding.textColor || '#1e293b'
      }}>
        {/* Header */}
        <header className="p-4 border-b" style={{ backgroundColor: branding.primaryColor || '#3b82f6' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {branding.logoUrl && (
                <img 
                  src={branding.logoUrl} 
                  alt="Logo" 
                  className="h-8 w-auto"
                />
              )}
              <h1 className="text-white font-bold text-lg">
                {branding.brandName || 'Your Brand'}
              </h1>
            </div>
            <nav className="flex space-x-4">
              <button className="text-white hover:opacity-80 text-sm">Features</button>
              <button className="text-white hover:opacity-80 text-sm">Pricing</button>
              <button className="text-white hover:opacity-80 text-sm">Contact</button>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: branding.textColor || '#1e293b' }}>
            Welcome to {branding.brandName || 'Your Platform'}
          </h2>
          {branding.tagline && (
            <p className="text-lg mb-6" style={{ color: branding.secondaryColor || '#64748b' }}>
              {branding.tagline}
            </p>
          )}
          <button 
            className="px-6 py-3 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: branding.accentColor || '#06b6d4' }}
          >
            Get Started
          </button>
        </section>

        {/* Content Section */}
        <section className="p-8 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2" style={{ color: branding.textColor || '#1e293b' }}>
                  Feature {i}
                </h3>
                <p className="text-sm" style={{ color: branding.secondaryColor || '#64748b' }}>
                  Description of your amazing feature goes here.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="p-6 border-t" style={{ backgroundColor: branding.backgroundColor || '#ffffff' }}>
          <div className="text-center">
            <p className="text-sm" style={{ color: branding.secondaryColor || '#64748b' }}>
              © 2024 {branding.brandName || 'Your Brand'}. All rights reserved.
            </p>
            {branding.supportEmail && (
              <p className="text-sm mt-2">
                Support: <a 
                  href={`mailto:${branding.supportEmail}`} 
                  className="underline"
                  style={{ color: branding.accentColor || '#06b6d4' }}
                >
                  {branding.supportEmail}
                </a>
              </p>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

export function BrandingEditor() {
  const { branding, updateBranding, loading } = useBrandingContext();
  const { toast } = useToast();
  const [localBranding, setLocalBranding] = useState<Partial<BrandingConfig>>(branding || {});
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (branding) {
      setLocalBranding(branding);
    }
  }, [branding]);

  const handleInputChange = (field: string, value: any) => {
    setLocalBranding(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateBranding(localBranding);
      setHasUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Branding updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update branding",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalBranding(branding || {});
    setHasUnsavedChanges(false);
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    // In a real implementation, this would upload to storage
    // For now, we'll create a URL for preview
    const url = URL.createObjectURL(file);
    handleInputChange(type === 'logo' ? 'logoUrl' : 'faviconUrl', url);
    
    toast({
      title: "Upload Started",
      description: `${type} upload started. This is a preview URL.`,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>White Label Branding</CardTitle>
        </CardHeader>
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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                White Label Branding
              </CardTitle>
              <CardDescription>
                Customize your organization's brand appearance and identity
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="secondary">Unsaved changes</Badge>
              )}
              <Button variant="outline" onClick={handleReset} disabled={!hasUnsavedChanges}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={!hasUnsavedChanges || saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="general" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                General
              </TabsTrigger>
              <TabsTrigger value="colors" className="text-xs">
                <Palette className="h-3 w-3 mr-1" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="assets" className="text-xs">
                <Upload className="h-3 w-3 mr-1" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs">
                <Code className="h-3 w-3 mr-1" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Brand Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input
                      id="brandName"
                      value={localBranding.brandName || ''}
                      onChange={(e) => handleInputChange('brandName', e.target.value)}
                      placeholder="Your Brand Name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={localBranding.tagline || ''}
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      placeholder="Your brand tagline"
                    />
                  </div>

                  <div>
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={localBranding.supportEmail || ''}
                      onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                      placeholder="support@yourcompany.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <select
                      id="fontFamily"
                      className="w-full p-2 border rounded-md"
                      value={localBranding.fontFamily || 'Inter'}
                      onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Poppins">Poppins</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Color Palette</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={localBranding.primaryColor || '#3b82f6'}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded border"
                      />
                      <Input
                        value={localBranding.primaryColor || '#3b82f6'}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Secondary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={localBranding.secondaryColor || '#64748b'}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="w-10 h-10 rounded border"
                      />
                      <Input
                        value={localBranding.secondaryColor || '#64748b'}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={localBranding.accentColor || '#06b6d4'}
                        onChange={(e) => handleInputChange('accentColor', e.target.value)}
                        className="w-10 h-10 rounded border"
                      />
                      <Input
                        value={localBranding.accentColor || '#06b6d4'}
                        onChange={(e) => handleInputChange('accentColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Text Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={localBranding.textColor || '#1e293b'}
                        onChange={(e) => handleInputChange('textColor', e.target.value)}
                        className="w-10 h-10 rounded border"
                      />
                      <Input
                        value={localBranding.textColor || '#1e293b'}
                        onChange={(e) => handleInputChange('textColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Background Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={localBranding.backgroundColor || '#ffffff'}
                        onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                        className="w-10 h-10 rounded border"
                      />
                      <Input
                        value={localBranding.backgroundColor || '#ffffff'}
                        onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Brand Assets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Logo Upload</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {localBranding.logoUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={localBranding.logoUrl} 
                            alt="Logo preview" 
                            className="h-12 mx-auto"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                          >
                            Change Logo
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                          <Button 
                            variant="outline"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                          >
                            Upload Logo
                          </Button>
                        </div>
                      )}
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'logo');
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="logoUrl">Logo URL (Alternative)</Label>
                    <Input
                      id="logoUrl"
                      type="url"
                      value={localBranding.logoUrl || ''}
                      onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <Label htmlFor="faviconUrl">Favicon URL</Label>
                    <Input
                      id="faviconUrl"
                      type="url"
                      value={localBranding.faviconUrl || ''}
                      onChange={(e) => handleInputChange('faviconUrl', e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Custom CSS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="customCss">Custom CSS Code</Label>
                    <Textarea
                      id="customCss"
                      value={localBranding.customCss || ''}
                      onChange={(e) => handleInputChange('customCss', e.target.value)}
                      placeholder="/* Add your custom CSS here */"
                      className="font-mono text-sm min-h-[200px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Legal Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="termsOfServiceUrl">Terms of Service URL</Label>
                    <Input
                      id="termsOfServiceUrl"
                      value={localBranding.termsOfServiceUrl || ''}
                      onChange={(e) => handleInputChange('termsOfServiceUrl', e.target.value)}
                      placeholder="https://yourcompany.com/terms"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="privacyPolicyUrl">Privacy Policy URL</Label>
                    <Input
                      id="privacyPolicyUrl"
                      value={localBranding.privacyPolicyUrl || ''}
                      onChange={(e) => handleInputChange('privacyPolicyUrl', e.target.value)}
                      placeholder="https://yourcompany.com/privacy"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[600px] overflow-auto">
                <BrandPreview branding={localBranding} viewMode={previewMode} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}