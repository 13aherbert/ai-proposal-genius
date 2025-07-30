import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building2, Users, Plus } from 'lucide-react';
import { useCurrentOrganization } from '@/hooks/use-current-organization';

interface UserOrganization {
  id: string;
  name: string;
  role: string;
  member_count: number;
  subscription_tier: string;
}

export function OrganizationSwitcher() {
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [loading, setLoading] = useState(false);
  const { organization, refreshOrganization } = useCurrentOrganization();

  useEffect(() => {
    fetchUserOrganizations();
  }, []);

  const fetchUserOrganizations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          organizations!inner (
            id,
            name,
            subscription_tier
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      // Get member counts for each organization
      const orgIds = data.map(item => item.organization_id);
      const { data: memberCounts } = await supabase
        .from('organization_members')
        .select('organization_id')
        .in('organization_id', orgIds)
        .eq('status', 'active');

      const memberCountMap = memberCounts?.reduce((acc, member) => {
        acc[member.organization_id] = (acc[member.organization_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const userOrgs = data.map(item => ({
        id: item.organization_id,
        name: item.organizations.name,
        role: item.role,
        member_count: memberCountMap[item.organization_id] || 0,
        subscription_tier: item.organizations.subscription_tier
      }));

      setOrganizations(userOrgs);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = async (orgId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ current_organization_id: orgId })
        .eq('profile_id', user.id);

      if (error) throw error;

      toast.success('Organization switched successfully!');
      refreshOrganization();
      window.location.reload(); // Refresh to update all contexts
    } catch (error: any) {
      console.error('Error switching organization:', error);
      toast.error('Failed to switch organization');
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      editor: 'bg-yellow-100 text-yellow-800',
      viewer: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge variant="secondary" className={colors[role as keyof typeof colors]}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      starter: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      pro: 'bg-green-100 text-green-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };

    return (
      <Badge variant="outline" className={colors[tier as keyof typeof colors]}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Organizations
        </CardTitle>
        <CardDescription>
          Switch between organizations or create a new one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Organization</label>
          <Select 
            value={organization?.id || ''} 
            onValueChange={switchOrganization}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{org.name}</span>
                    <div className="flex items-center gap-1 ml-2">
                      {getRoleBadge(org.role)}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {organizations.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Your Organizations</label>
            {organizations.map((org) => (
              <div key={org.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{org.name}</span>
                  <div className="flex gap-2">
                    {getRoleBadge(org.role)}
                    {getTierBadge(org.subscription_tier)}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {org.member_count} members
                  </div>
                </div>
                {org.id !== organization?.id && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => switchOrganization(org.id)}
                    className="w-full"
                  >
                    Switch to this organization
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <Button className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create New Organization
        </Button>
      </CardContent>
    </Card>
  );
}