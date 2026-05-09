import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'billing_admin';
  permissions: Record<string, any>;
  department?: string;
  title?: string;
  status: string;
  invited_at?: string;
  last_active_at?: string;
  joined_at: string;
  // Profile data
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
}

async function fetchMembersFromDb(organizationId: string): Promise<OrganizationMember[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      id, user_id, organization_id, role, permissions, department, title,
      status, invited_at, last_active_at, joined_at,
      profiles!organization_members_user_id_fkey (
        first_name,
        last_name,
        username,
        avatar_url
      )
    `)
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(member => ({
    ...member,
    permissions: (member as any).permissions as Record<string, any>,
    first_name: (member.profiles as any)?.first_name,
    last_name: (member.profiles as any)?.last_name,
    username: (member.profiles as any)?.username,
    avatar_url: (member.profiles as any)?.avatar_url,
  })) as OrganizationMember[];
}

export function useOrganizationMembers(organizationId?: string | null) {
  const queryClient = useQueryClient();

  const queryKey = ['organization-members', organizationId];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchMembersFromDb(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const members = data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const updateMemberRole = async (
    memberId: string,
    role: OrganizationMember['role']
  ) => {
    const { error: err } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId);
    if (err) throw new Error(err.message);
    await invalidate();
  };

  const updateMemberPermissions = async (
    memberId: string,
    permissions: Record<string, any>
  ) => {
    const { error: err } = await supabase
      .from('organization_members')
      .update({ permissions })
      .eq('id', memberId);
    if (err) throw new Error(err.message);
    await invalidate();
  };

  const removeMember = async (memberId: string) => {
    const { error: err } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);
    if (err) throw new Error(err.message);
    await invalidate();
  };

  return {
    members,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch members') : null,
    fetchMembers: refetch,
    updateMemberRole,
    updateMemberPermissions,
    removeMember,
  };
}
