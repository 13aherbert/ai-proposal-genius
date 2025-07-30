import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OrganizationPermissions {
  projects: string[];
  knowledge_base: string[];
  team_management: string[];
  billing: string[];
  settings: string[];
  analytics: string[];
  api_access: string[];
  branding: string[];
}

export function useOrganizationPermissions(organizationId?: string | null) {
  const [permissions, setPermissions] = useState<OrganizationPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    fetchPermissions();
  }, [organizationId]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organizationId) {
        throw new Error('User not authenticated or no organization selected');
      }

      const { data, error } = await supabase.rpc('get_user_organization_permissions', {
        user_id_param: user.id,
        org_id_param: organizationId
      });

      if (error) throw error;
      setPermissions((data as unknown as OrganizationPermissions) || {
        projects: [],
        knowledge_base: [],
        team_management: [],
        billing: [],
        settings: [],
        analytics: [],
        api_access: [],
        branding: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (resource: keyof OrganizationPermissions, action: string): boolean => {
    if (!permissions) return false;
    return permissions[resource]?.includes(action) || false;
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    refetch: fetchPermissions
  };
}