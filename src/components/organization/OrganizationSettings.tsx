import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Building2, Globe, Shield, CreditCard, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationSettingsData {
  name: string;
  slug: string;
  subscription_tier: string;
  is_white_label: boolean;
  custom_domain_enabled: boolean;
  sso_enabled: boolean;
  settings: {
    description?: string;
    max_seats?: number;
    billing_contact?: string;
    technical_contact?: string;
    timezone?: string;
    language?: string;
    notification_preferences?: {
      email_notifications: boolean;
      security_alerts: boolean;
      billing_reminders: boolean;
    };
    security_settings?: {
      enforce_2fa: boolean;
      session_timeout: number;
      password_policy_enabled: boolean;
    };
  };
}

export function OrganizationSettings() {
  const { organization, refreshOrganization } = useCurrentOrganization();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<OrganizationSettingsData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (organization) {
      setSettings({
        name: organization.name,
        slug: organization.slug,
        subscription_tier: organization.subscription_tier,
        is_white_label: organization.is_white_label,
        custom_domain_enabled: organization.custom_domain_enabled,
        sso_enabled: organization.sso_enabled,
        settings: {
          description: (organization.settings as any)?.description || '',
          max_seats: organization.max_users || 5,
          billing_contact: (organization.settings as any)?.billing_contact || '',
          technical_contact: (organization.settings as any)?.technical_contact || '',
          timezone: (organization.settings as any)?.timezone || 'UTC',
          language: (organization.settings as any)?.language || 'en',
          notification_preferences: {
            email_notifications: (organization.settings as any)?.notification_preferences?.email_notifications ?? true,
            security_alerts: (organization.settings as any)?.notification_preferences?.security_alerts ?? true,
            billing_reminders: (organization.settings as any)?.notification_preferences?.billing_reminders ?? true,
          },
          security_settings: {
            enforce_2fa: (organization.settings as any)?.security_settings?.enforce_2fa ?? false,
            session_timeout: (organization.settings as any)?.security_settings?.session_timeout ?? 24,
            password_policy_enabled: (organization.settings as any)?.security_settings?.password_policy_enabled ?? true,
          }
        }
      });
    }
  }, [organization]);

  const handleSave = async () => {
    if (!settings || !organization) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: settings.name,
          settings: settings.settings
        })
        .eq('id', organization.id);

      if (error) throw error;

      await refreshOrganization();
      
      toast({
        title: 'Settings saved',
        description: 'Organization settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic organization information and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                placeholder="Your Organization Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Organization Slug</Label>
              <Input
                id="org-slug"
                value={settings.slug}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                The organization slug cannot be changed after creation
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={settings.settings.description || ''}
              onChange={(e) => setSettings({
                ...settings,
                settings: { ...settings.settings, description: e.target.value }
              })}
              placeholder="Describe your organization..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={settings.settings.timezone} 
                onValueChange={(value) => setSettings({
                  ...settings,
                  settings: { ...settings.settings, timezone: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select 
                value={settings.settings.language} 
                onValueChange={(value) => setSettings({
                  ...settings,
                  settings: { ...settings.settings, language: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Key contacts for billing and technical matters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing-contact">Billing Contact</Label>
              <Input
                id="billing-contact"
                type="email"
                value={settings.settings.billing_contact || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  settings: { ...settings.settings, billing_contact: e.target.value }
                })}
                placeholder="billing@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technical-contact">Technical Contact</Label>
              <Input
                id="technical-contact"
                type="email"
                value={settings.settings.technical_contact || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  settings: { ...settings.settings, technical_contact: e.target.value }
                })}
                placeholder="tech@company.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Configure how your organization receives notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive general notifications via email
              </p>
            </div>
            <Switch
              checked={settings.settings.notification_preferences?.email_notifications}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                settings: {
                  ...settings.settings,
                  notification_preferences: {
                    ...settings.settings.notification_preferences!,
                    email_notifications: checked
                  }
                }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Security Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive critical security notifications
              </p>
            </div>
            <Switch
              checked={settings.settings.notification_preferences?.security_alerts}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                settings: {
                  ...settings.settings,
                  notification_preferences: {
                    ...settings.settings.notification_preferences!,
                    security_alerts: checked
                  }
                }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Billing Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive billing and payment reminders
              </p>
            </div>
            <Switch
              checked={settings.settings.notification_preferences?.billing_reminders}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                settings: {
                  ...settings.settings,
                  notification_preferences: {
                    ...settings.settings.notification_preferences!,
                    billing_reminders: checked
                  }
                }
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security policies for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enforce Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require all members to enable 2FA
              </p>
            </div>
            <Switch
              checked={settings.settings.security_settings?.enforce_2fa}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                settings: {
                  ...settings.settings,
                  security_settings: {
                    ...settings.settings.security_settings!,
                    enforce_2fa: checked
                  }
                }
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
            <Input
              id="session-timeout"
              type="number"
              min="1"
              max="168"
              value={settings.settings.security_settings?.session_timeout || 24}
              onChange={(e) => setSettings({
                ...settings,
                settings: {
                  ...settings.settings,
                  security_settings: {
                    ...settings.settings.security_settings!,
                    session_timeout: parseInt(e.target.value)
                  }
                }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enhanced Password Policy</Label>
              <p className="text-sm text-muted-foreground">
                Enforce strong password requirements
              </p>
            </div>
            <Switch
              checked={settings.settings.security_settings?.password_policy_enabled}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                settings: {
                  ...settings.settings,
                  security_settings: {
                    ...settings.settings.security_settings!,
                    password_policy_enabled: checked
                  }
                }
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscription Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Information
          </CardTitle>
          <CardDescription>
            Current subscription tier and feature access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Current Plan</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{settings.subscription_tier}</Badge>
                {settings.is_white_label && (
                  <Badge variant="secondary">White Label</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm">
              Upgrade Plan
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>Custom Domain: {settings.custom_domain_enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>SSO: {settings.sso_enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Max Seats: {settings.settings.max_seats}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}