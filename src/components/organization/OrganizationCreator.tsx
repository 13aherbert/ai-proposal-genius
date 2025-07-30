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
          settings: {
            subscription_model: 'flat_rate',
            max_seats: formData.subscription_tier === 'starter' ? 5 : 50,
            white_label_enabled: false,
            sso_enabled: false
          }
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
          status: 'active',
          project_limit: formData.subscription_tier === 'starter' ? 3 : 30,
          member_limit: formData.subscription_tier === 'starter' ? 5 : 50
        });

      if (subError) throw subError;

      // Update user's current organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_organization_id: org.id })
        .eq('profile_id', user.id);

      if (profileError) throw profileError;

      toast.success('Organization created successfully!');
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
              <SelectItem value="basic">Basic ($49/month)</SelectItem>
              <SelectItem value="pro">Pro ($99/month)</SelectItem>
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