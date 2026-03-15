import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function OrganizationCreator() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subscription_tier: 'starter'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value)
    }));
  };

  const createOrganization = async () => {
    if (!formData.name.trim()) {
      toast.error('Organization name is required');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          slug: formData.slug,
          subscription_tier: formData.subscription_tier,
          is_white_label: formData.subscription_tier === 'enterprise',
          custom_domain_enabled: formData.subscription_tier === 'enterprise',
          sso_enabled: false,
          max_users: formData.subscription_tier === 'starter' ? 5 : (formData.subscription_tier === 'enterprise' ? 9999 : 50),
          max_projects: formData.subscription_tier === 'starter' ? 3 : (formData.subscription_tier === 'enterprise' ? 9999 : 30),
          settings: {
            subscription_model: formData.subscription_tier === 'enterprise' ? 'custom' : 'flat_rate',
            max_seats: formData.subscription_tier === 'starter' ? 5 : (formData.subscription_tier === 'enterprise' ? 9999 : 50),
            white_label_enabled: formData.subscription_tier === 'enterprise',
            sso_enabled: false,
            custom_pricing: formData.subscription_tier === 'enterprise' ? { enabled: true } : {},
            billing_contact: formData.subscription_tier === 'enterprise' ? '' : null,
            technical_contact: formData.subscription_tier === 'enterprise' ? '' : null
          },
          enterprise_features: formData.subscription_tier === 'enterprise' ? {
            unlimited_projects: true,
            advanced_analytics: true,
            sso_integration: true,
            white_labeling: true,
            api_access: true,
            priority_support: true,
            custom_domains: true,
            audit_logging: true
          } : {}
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          status: 'active'
        });

      if (memberError) throw memberError;

      // Create default subscription
      const { error: subError } = await supabase
        .from('organization_subscriptions')
        .insert({
          organization_id: org.id,
          plan_type: formData.subscription_tier,
          status: formData.subscription_tier === 'enterprise' ? 'active' : 'trial',
          project_limit: formData.subscription_tier === 'starter' ? 3 : (formData.subscription_tier === 'enterprise' ? 9999 : 30),
          member_limit: formData.subscription_tier === 'starter' ? 5 : (formData.subscription_tier === 'enterprise' ? 9999 : 50),
          max_seats: formData.subscription_tier === 'starter' ? 5 : (formData.subscription_tier === 'enterprise' ? 9999 : 50),
          used_seats: 1,
          billing_model: formData.subscription_tier === 'enterprise' ? 'custom' : 'flat_rate',
          features: formData.subscription_tier === 'enterprise' ? {
            unlimited_projects: true,
            advanced_analytics: true,
            api_access: true,
            white_labeling: true,
            priority_support: true,
            sso_integration: true,
            custom_domains: true,
            audit_logging: true,
            team_collaboration: true,
            custom_templates: true
          } : {}
        });

      if (subError) throw subError;

      // Enable enterprise features if enterprise tier
      if (formData.subscription_tier === 'enterprise') {
        const enterpriseFeatures = [
          { feature_name: 'unlimited_projects', is_enabled: true },
          { feature_name: 'advanced_analytics', is_enabled: true },
          { feature_name: 'sso_integration', is_enabled: true },
          { feature_name: 'white_labeling', is_enabled: true },
          { feature_name: 'api_access', is_enabled: true },
          { feature_name: 'priority_support', is_enabled: true },
          { feature_name: 'custom_domains', is_enabled: true },
          { feature_name: 'audit_logging', is_enabled: true },
          { feature_name: 'team_collaboration', is_enabled: true },
          { feature_name: 'custom_templates', is_enabled: true }
        ];

        for (const feature of enterpriseFeatures) {
          await supabase
            .from('organization_features')
            .insert({
              organization_id: org.id,
              ...feature
            });
        }
      }

      // Update user's current organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_organization_id: org.id })
        .eq('profile_id', user.id);

      if (profileError) throw profileError;

      toast.success(`${formData.subscription_tier === 'enterprise' ? 'Enterprise ' : ''}Organization created successfully!`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error(error.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Organization</CardTitle>
        <CardDescription>
          Set up your organization to start collaborating with your team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Acme Corporation"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Organization Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="acme-corp"
          />
          <p className="text-xs text-muted-foreground">
            This will be used in URLs and API endpoints
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tier">Subscription Tier</Label>
          <Select 
            value={formData.subscription_tier} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, subscription_tier: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">Starter (Free)</SelectItem>
              <SelectItem value="growth">Growth ($199/month)</SelectItem>
              <SelectItem value="business">Business ($499/month)</SelectItem>
              <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={createOrganization} 
          disabled={loading || !formData.name.trim()}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Organization
        </Button>
      </CardContent>
    </Card>
  );
}