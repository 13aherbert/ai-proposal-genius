import { useState, useEffect } from 'react';
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

export function useOrganizationMembers(organizationId?: string | null) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    fetchMembers();
  }, [organizationId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          profiles!organization_members_user_id_fkey (
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId!)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      // Flatten the profile data
      const flattenedMembers = (data || []).map(member => ({
        ...member,
        permissions: member.permissions as Record<string, any>,
        first_name: (member.profiles as any)?.first_name,
        last_name: (member.profiles as any)?.last_name,
        username: (member.profiles as any)?.username,
        avatar_url: (member.profiles as any)?.avatar_url
      })) as OrganizationMember[];

      setMembers(flattenedMembers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, role: OrganizationMember['role']) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;
      await fetchMembers(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update member role');
    }
  };

  const updateMemberPermissions = async (memberId: string, permissions: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ permissions })
        .eq('id', memberId);

      if (error) throw error;
      await fetchMembers(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update member permissions');
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      await fetchMembers(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  return {
    members,
    loading,
    error,
    fetchMembers,
    updateMemberRole,
    updateMemberPermissions,
    removeMember
  };
}