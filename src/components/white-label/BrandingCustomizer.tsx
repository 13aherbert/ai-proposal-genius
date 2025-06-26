
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Palette, Eye, Save } from "lucide-react";
import { toast } from "sonner";

interface BrandingSettings {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  favicon: string;
  customCss: string;
  footerText: string;
}

export function BrandingCustomizer() {
  const [settings, setSettings] = useState<BrandingSettings>({
    companyName: "",
    logoUrl: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#1F2937",
    accentColor: "#10B981",
    favicon: "",
    customCss: "",
    footerText: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleInputChange = (field: keyof BrandingSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save branding settings
      console.log("Saving branding settings:", settings);
      toast.success("Branding settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save branding settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (field: 'logoUrl' | 'favicon') => {
    // TODO: Implement file upload functionality
    toast.info("File upload functionality coming soon");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Branding Customization</h2>
          <p className="text-muted-foreground">
            Customize your white label platform's appearance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? "Edit Mode" : "Preview"}
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <Label htmlFor="footerText">Footer Text</Label>
              <Input
                id="footerText"
                value={settings.footerText}
                onChange={(e) => handleInputChange('footerText', e.target.value)}
                placeholder="© 2024 Your Company. All rights reserved."
              />
            </div>

            <div>
              <Label>Logo Upload</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={settings.logoUrl}
                  onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                  placeholder="Logo URL or upload"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileUpload('logoUrl')}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Favicon Upload</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={settings.favicon}
                  onChange={(e) => handleInputChange('favicon', e.target.value)}
                  placeholder="Favicon URL or upload"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileUpload('favicon')}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Scheme */}
        <Card>
          <CardHeader>
            <CardTitle>Color Scheme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={settings.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  placeholder="#1F2937"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => handleInputChange('accentColor', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={settings.accentColor}
                  onChange={(e) => handleInputChange('accentColor', e.target.value)}
                  placeholder="#10B981"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom CSS */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Custom CSS</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="customCss">Additional CSS Styles</Label>
            <Textarea
              id="customCss"
              value={settings.customCss}
              onChange={(e) => handleInputChange('customCss', e.target.value)}
              placeholder="/* Add your custom CSS here */"
              className="min-h-32 font-mono"
            />
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 border rounded-lg"
              style={{
                backgroundColor: settings.secondaryColor,
                color: settings.primaryColor === settings.secondaryColor ? '#fff' : settings.primaryColor
              }}
            >
              <h3 className="text-xl font-bold mb-2">
                {settings.companyName || "Your Company Name"}
              </h3>
              <div 
                className="w-full h-8 rounded mb-4"
                style={{ backgroundColor: settings.primaryColor }}
              ></div>
              <p style={{ color: settings.accentColor }}>
                This is a preview of your branding customization
              </p>
              <div className="mt-4 text-sm opacity-75">
                {settings.footerText || "Footer text will appear here"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
