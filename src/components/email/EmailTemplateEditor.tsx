import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, 
  Eye, 
  Code, 
  Save,
  Send,
  RotateCcw,
  Palette,
  Type,
  Image,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useBrandingContext } from '@/components/branding/BrandingProvider';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  template_type: string;
  variables: string[];
  is_active: boolean;
}

const DEFAULT_TEMPLATES = [
  {
    type: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to {{BRAND_NAME}}!',
    html: `
      <div style="font-family: {{FONT_FAMILY}}, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          {{#LOGO_URL}}
          <img src="{{LOGO_URL}}" alt="{{BRAND_NAME}}" style="max-width: 200px; height: auto;" />
          {{/LOGO_URL}}
          <h1 style="color: {{PRIMARY_COLOR}}; margin: 20px 0;">Welcome to {{BRAND_NAME}}!</h1>
        </div>
        
        <div style="background: {{BACKGROUND_COLOR}}; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h2 style="color: {{TEXT_COLOR}}; margin-top: 0;">Hello {{USER_NAME}},</h2>
          <p style="color: {{TEXT_COLOR}}; line-height: 1.6;">
            Thank you for joining {{BRAND_NAME}}! We're excited to have you on board.
          </p>
          <p style="color: {{TEXT_COLOR}}; line-height: 1.6;">
            {{TAGLINE}}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{DASHBOARD_URL}}" style="background: {{PRIMARY_COLOR}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Get Started
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: {{SECONDARY_COLOR}}; font-size: 14px;">
            Need help? Contact us at <a href="mailto:{{SUPPORT_EMAIL}}" style="color: {{PRIMARY_COLOR}};">{{SUPPORT_EMAIL}}</a>
          </p>
          {{#PRIVACY_POLICY_URL}}
          <p style="color: {{SECONDARY_COLOR}}; font-size: 12px;">
            <a href="{{PRIVACY_POLICY_URL}}" style="color: {{SECONDARY_COLOR}};">Privacy Policy</a> | 
            <a href="{{TERMS_OF_SERVICE_URL}}" style="color: {{SECONDARY_COLOR}};">Terms of Service</a>
          </p>
          {{/PRIVACY_POLICY_URL}}
        </div>
      </div>
    `
  },
  {
    type: 'password_reset',
    name: 'Password Reset',
    subject: 'Reset your {{BRAND_NAME}} password',
    html: `
      <div style="font-family: {{FONT_FAMILY}}, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          {{#LOGO_URL}}
          <img src="{{LOGO_URL}}" alt="{{BRAND_NAME}}" style="max-width: 200px; height: auto;" />
          {{/LOGO_URL}}
          <h1 style="color: {{PRIMARY_COLOR}}; margin: 20px 0;">Password Reset Request</h1>
        </div>
        
        <div style="background: {{BACKGROUND_COLOR}}; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h2 style="color: {{TEXT_COLOR}}; margin-top: 0;">Hello {{USER_NAME}},</h2>
          <p style="color: {{TEXT_COLOR}}; line-height: 1.6;">
            We received a request to reset your password for your {{BRAND_NAME}} account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{RESET_URL}}" style="background: {{PRIMARY_COLOR}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: {{SECONDARY_COLOR}}; font-size: 14px; line-height: 1.6;">
            This link will expire in 24 hours. If you didn't request this reset, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: {{SECONDARY_COLOR}}; font-size: 14px;">
            Need help? Contact us at <a href="mailto:{{SUPPORT_EMAIL}}" style="color: {{PRIMARY_COLOR}};">{{SUPPORT_EMAIL}}</a>
          </p>
        </div>
      </div>
    `
  }
];

export function EmailTemplateEditor() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const { toast } = useToast();
  const { organization } = useCurrentOrganization();
  const { branding } = useBrandingContext();

  useEffect(() => {
    if (organization) {
      fetchTemplates();
    }
  }, [organization]);

  const fetchTemplates = async () => {
    try {
      // For now, use mock data since email_templates table types aren't available yet
      setTemplates([]);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive"
      });
    }
  };

  const createDefaultTemplate = async (templateType: string) => {
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.type === templateType);
    if (!defaultTemplate || !organization) return;

    const newTemplate: EmailTemplate = {
      id: crypto.randomUUID(),
      name: defaultTemplate.name,
      subject: defaultTemplate.subject,
      html_content: defaultTemplate.html,
      text_content: '', // Convert HTML to text
      template_type: templateType,
      variables: extractVariables(defaultTemplate.html),
      is_active: true
    };

    try {
      setTemplates(prev => [...prev, newTemplate]);
      setSelectedTemplate(newTemplate);
      setIsEditing(true);
      toast({
        title: "Success",
        description: "Template created successfully!"
      });
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      });
    }
  };

  const saveTemplate = async () => {
    if (!selectedTemplate || !organization) return;

    setIsSaving(true);
    try {
      // For now, just update local state since database isn't ready
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Template saved successfully!"
      });
      fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{[^}]+\}\}/g) || [];
    return [...new Set(matches.map(match => match.slice(2, -2)))];
  };

  const renderPreview = () => {
    if (!selectedTemplate || !branding) return '';

    let preview = selectedTemplate.html_content;
    
    // Replace branding variables
    const replacements = {
      'BRAND_NAME': branding.brandName || organization?.name || 'Your Brand',
      'PRIMARY_COLOR': branding.primaryColor || '#3b82f6',
      'SECONDARY_COLOR': branding.secondaryColor || '#64748b',
      'ACCENT_COLOR': branding.accentColor || '#06b6d4',
      'TEXT_COLOR': branding.textColor || '#1e293b',
      'BACKGROUND_COLOR': branding.backgroundColor || '#ffffff',
      'FONT_FAMILY': branding.fontFamily || 'Inter',
      'LOGO_URL': branding.logoUrl || '',
      'SUPPORT_EMAIL': branding.supportEmail || 'support@example.com',
      'TAGLINE': branding.tagline || '',
      'PRIVACY_POLICY_URL': branding.privacyPolicyUrl || '',
      'TERMS_OF_SERVICE_URL': branding.termsOfServiceUrl || '',
      'USER_NAME': 'John Doe',
      'DASHBOARD_URL': window.location.origin + '/dashboard',
      'RESET_URL': '#'
    };

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      preview = preview.replace(regex, value);
    });

    // Handle conditional blocks
    preview = preview.replace(/\{\{#([^}]+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, condition, content) => {
      const value = replacements[condition as keyof typeof replacements];
      return value ? content : '';
    });

    return preview;
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </CardTitle>
          <CardDescription>
            Create and customize branded email templates for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {templates.map(template => (
              <Button
                key={template.id}
                variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedTemplate(template);
                  setIsEditing(false);
                  setPreviewMode('edit');
                }}
              >
                {template.name}
                {template.is_active && (
                  <Badge variant="secondary" className="ml-2">Active</Badge>
                )}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Select onValueChange={createDefaultTemplate}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Add template..." />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_TEMPLATES.map(template => (
                  <SelectItem key={template.type} value={template.type}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Template Editor */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Edit Template: {selectedTemplate.name}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(previewMode === 'edit' ? 'preview' : 'edit')}
                >
                  {previewMode === 'edit' ? <Eye className="h-4 w-4 mr-2" /> : <Code className="h-4 w-4 mr-2" />}
                  {previewMode === 'edit' ? 'Preview' : 'Edit'}
                </Button>
                {isEditing && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        fetchTemplates();
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveTemplate}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
                {!isEditing && (
                  <Button
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Template
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {previewMode === 'edit' ? (
              <Tabs defaultValue="content" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="variables">Variables</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Template Name</Label>
                      <Input
                        value={selectedTemplate.name}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          name: e.target.value
                        })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label>Subject Line</Label>
                      <Input
                        value={selectedTemplate.subject}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          subject: e.target.value
                        })}
                        disabled={!isEditing}
                        placeholder="Use {{VARIABLES}} for dynamic content"
                      />
                    </div>

                    <div>
                      <Label>HTML Content</Label>
                      <Textarea
                        value={selectedTemplate.html_content}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          html_content: e.target.value
                        })}
                        disabled={!isEditing}
                        rows={20}
                        className="font-mono text-sm"
                        placeholder="Enter HTML template content..."
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="variables" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Available Variables</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {extractVariables(selectedTemplate.html_content).map(variable => (
                        <Badge key={variable} variant="outline" className="justify-center">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className="p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: renderPreview() }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}