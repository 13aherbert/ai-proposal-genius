import { useState, useEffect } from 'react';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useOrganizationPermissions } from '@/hooks/useOrganizationPermissions';

export interface EnterpriseFeature {
  id: string;
  name: string;
  description: string;
  category: 'team' | 'security' | 'integration' | 'customization' | 'analytics';
  enabled: boolean;
  configured: boolean;
  priority: 'high' | 'medium' | 'low';
}

export function useEnterpriseFeatures() {
  const { organization } = useCurrentOrganization();
  const { hasPermission } = useOrganizationPermissions(organization?.id);
  const [features, setFeatures] = useState<EnterpriseFeature[]>([]);
  const [loading, setLoading] = useState(true);

  const isEnterprise = organization?.subscription_tier === 'enterprise';

  useEffect(() => {
    if (isEnterprise) {
      loadEnterpriseFeatures();
    } else {
      setLoading(false);
    }
  }, [isEnterprise, organization]);

  const loadEnterpriseFeatures = async () => {
    setLoading(true);
    
    // Define enterprise features with their current status
    const enterpriseFeatures: EnterpriseFeature[] = [
      {
        id: 'unlimited-projects',
        name: 'Unlimited Projects',
        description: 'Create unlimited projects and proposals',
        category: 'team',
        enabled: true,
        configured: true,
        priority: 'high'
      },
      {
        id: 'advanced-analytics',
        name: 'Advanced Analytics',
        description: 'Detailed insights and reporting',
        category: 'analytics',
        enabled: true,
        configured: false,
        priority: 'medium'
      },
      {
        id: 'sso-integration',
        name: 'SSO Integration',
        description: 'Single sign-on with SAML/OAuth providers',
        category: 'security',
        enabled: true,
        configured: !!organization?.sso_enabled,
        priority: 'high'
      },
      {
        id: 'white-labeling',
        name: 'White Labeling',
        description: 'Custom branding and white label options',
        category: 'customization',
        enabled: true,
        configured: !!organization?.is_white_label,
        priority: 'medium'
      },
      {
        id: 'api-access',
        name: 'Full API Access',
        description: 'Complete REST API and webhook access',
        category: 'integration',
        enabled: true,
        configured: false,
        priority: 'medium'
      },
      {
        id: 'priority-support',
        name: 'Priority Support',
        description: '24/7 priority support with dedicated account manager',
        category: 'team',
        enabled: true,
        configured: true,
        priority: 'high'
      },
      {
        id: 'custom-domains',
        name: 'Custom Domains',
        description: 'Use your own domain for the platform',
        category: 'customization',
        enabled: true,
        configured: !!organization?.custom_domain_enabled,
        priority: 'low'
      },
      {
        id: 'audit-logging',
        name: 'Audit Logging',
        description: 'Comprehensive audit logs and compliance reporting',
        category: 'security',
        enabled: true,
        configured: false,
        priority: 'medium'
      },
      {
        id: 'advanced-permissions',
        name: 'Advanced Permissions',
        description: 'Granular role-based access control',
        category: 'security',
        enabled: true,
        configured: false,
        priority: 'high'
      },
      {
        id: 'bulk-operations',
        name: 'Bulk Operations',
        description: 'Bulk user management and data operations',
        category: 'team',
        enabled: true,
        configured: false,
        priority: 'low'
      }
    ];

    setFeatures(enterpriseFeatures);
    setLoading(false);
  };

  const getFeaturesByCategory = (category: EnterpriseFeature['category']) => {
    return features.filter(feature => feature.category === category);
  };

  const getUnconfiguredFeatures = () => {
    return features.filter(feature => feature.enabled && !feature.configured);
  };

  const getHighPriorityFeatures = () => {
    return features.filter(feature => feature.priority === 'high' && !feature.configured);
  };

  const getConfigurationProgress = () => {
    const enabledFeatures = features.filter(f => f.enabled);
    const configuredFeatures = features.filter(f => f.enabled && f.configured);
    return enabledFeatures.length > 0 ? (configuredFeatures.length / enabledFeatures.length) * 100 : 0;
  };

  const hasFeature = (featureId: string) => {
    const feature = features.find(f => f.id === featureId);
    return feature?.enabled || false;
  };

  const isFeatureConfigured = (featureId: string) => {
    const feature = features.find(f => f.id === featureId);
    return feature?.configured || false;
  };

  const canAccessFeature = (featureId: string) => {
    if (!isEnterprise) return false;
    
    // Check if user has permission to access this feature
    const feature = features.find(f => f.id === featureId);
    if (!feature?.enabled) return false;

    // Map features to permission checks
    switch (featureId) {
      case 'advanced-analytics':
        return hasPermission('analytics', 'view');
      case 'sso-integration':
        return hasPermission('settings', 'manage');
      case 'api-access':
        return hasPermission('api_access', 'create');
      case 'white-labeling':
        return hasPermission('branding', 'manage');
      default:
        return true;
    }
  };

  return {
    features,
    loading,
    isEnterprise,
    getFeaturesByCategory,
    getUnconfiguredFeatures,
    getHighPriorityFeatures,
    getConfigurationProgress,
    hasFeature,
    isFeatureConfigured,
    canAccessFeature,
    refreshFeatures: loadEnterpriseFeatures
  };
}