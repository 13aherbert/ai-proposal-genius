import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamManagement } from './TeamManagement';
import { UsageAnalytics } from './UsageAnalytics';
import { SecurityDashboard } from './SecurityDashboard';
import { SSOConfiguration } from './SSOConfiguration';
import { SSOSettings } from './SSOSettings';
import { ComplianceManager } from './ComplianceManager';
import { DomainManager } from './DomainManager';
import { ApiManagement } from './ApiManagement';
import { SubscriptionManager } from './SubscriptionManager';
import { AdvancedAnalyticsDashboard } from '../analytics/AdvancedAnalyticsDashboard';
import { EnhancedAnalytics } from './EnhancedAnalytics';
import { OrganizationSettings } from './OrganizationSettings';
import { AuditLogger } from './AuditLogger';
import { UserProvisioning } from './UserProvisioning';
import { WebhookManager } from './WebhookManager';
import { IntegrationManager } from './IntegrationManager';
import { ApiDocumentation } from './ApiDocumentation';
import { SupportTickets } from './SupportTickets';
import { useOrganizationPermissions } from '@/hooks/useOrganizationPermissions';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Settings, Users, BarChart3, Crown, CreditCard, Shield } from 'lucide-react';

export function OrganizationDashboard() {
  const { organization, loading: orgLoading } = useCurrentOrganization();
  const { hasPermission, loading: permissionsLoading } = useOrganizationPermissions(organization?.id);


  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'starter': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'basic': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pro': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'enterprise': return 'bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-300';
      case 'white_label': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (permissionsLoading || !organization) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const canViewSettings = hasPermission('settings', 'view');
  const canViewBilling = hasPermission('billing', 'view');
  const canViewTeam = hasPermission('team_management', 'view_activity');
  const canViewAnalytics = hasPermission('analytics', 'view');
  const canManageSettings = hasPermission('settings', 'manage');

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{organization.name}</h1>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={getTierBadgeColor(organization.subscription_tier)}>
                    <Crown className="h-3 w-3 mr-1" />
                    {organization.subscription_tier}
                  </Badge>
                  {organization.is_white_label && (
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      White Label
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {canViewSettings && (
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Organization Management Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-12">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {canViewTeam && <TabsTrigger value="team">Team</TabsTrigger>}
          {canManageSettings && <TabsTrigger value="provisioning">Provisioning</TabsTrigger>}
          {canViewAnalytics && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          {canViewAnalytics && <TabsTrigger value="advanced-analytics">Enhanced</TabsTrigger>}
          {canViewBilling && <TabsTrigger value="billing">Billing</TabsTrigger>}
          {canManageSettings && <TabsTrigger value="api">API</TabsTrigger>}
          {canManageSettings && <TabsTrigger value="security">Security</TabsTrigger>}
          {canManageSettings && <TabsTrigger value="domains">Domains</TabsTrigger>}
          {canManageSettings && <TabsTrigger value="audit">Audit</TabsTrigger>}
          <TabsTrigger value="support">Support</TabsTrigger>
          {canViewSettings && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{organization.max_users}</div>
                <p className="text-xs text-muted-foreground">
                  Seat limit for organization
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Projects</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{organization.max_projects}</div>
                <p className="text-xs text-muted-foreground">
                  Project limit for organization
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custom Domain</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {organization.custom_domain_enabled ? 'Enabled' : 'Disabled'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Custom domain support
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SSO</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {organization.sso_enabled ? 'Enabled' : 'Disabled'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Single Sign-On status
                </p>
              </CardContent>
            </Card>
          </div>

          {canViewAnalytics && (
            <div className="grid gap-4 md:grid-cols-2">
              <UsageAnalytics />
            </div>
          )}
        </TabsContent>

        {canViewTeam && (
          <TabsContent value="team" className="space-y-4">
            <TeamManagement />
          </TabsContent>
        )}

        {canManageSettings && (
          <TabsContent value="provisioning" className="space-y-4">
            <UserProvisioning />
          </TabsContent>
        )}

        {canViewAnalytics && (
          <TabsContent value="analytics" className="space-y-4">
            <UsageAnalytics />
          </TabsContent>
        )}

        {canViewBilling && (
          <TabsContent value="billing" className="space-y-4">
            <SubscriptionManager />
          </TabsContent>
        )}

        {canViewAnalytics && (
          <TabsContent value="advanced-analytics" className="space-y-4">
            <AdvancedAnalyticsDashboard />
          </TabsContent>
        )}

        {canManageSettings && (
          <TabsContent value="security" className="space-y-4">
            <div className="grid gap-6">
              <SecurityDashboard />
              <SSOConfiguration />
              <SSOSettings />
              <ComplianceManager />
            </div>
          </TabsContent>
        )}

        {canManageSettings && (
          <TabsContent value="domains" className="space-y-4">
            <DomainManager />
          </TabsContent>
        )}

        {canManageSettings && (
          <TabsContent value="api" className="space-y-4">
            <Tabs defaultValue="keys" className="space-y-4">
              <TabsList>
                <TabsTrigger value="keys">API Keys</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="docs">Documentation</TabsTrigger>
              </TabsList>
              <TabsContent value="keys">
                <ApiManagement />
              </TabsContent>
              <TabsContent value="webhooks">
                <WebhookManager />
              </TabsContent>
              <TabsContent value="integrations">
                <IntegrationManager />
              </TabsContent>
              <TabsContent value="docs">
                <ApiDocumentation />
              </TabsContent>
            </Tabs>
          </TabsContent>
        )}

        {canManageSettings && (
          <TabsContent value="audit" className="space-y-4">
            <AuditLogger />
          </TabsContent>
        )}

        <TabsContent value="support" className="space-y-4">
          <SupportTickets />
        </TabsContent>

        {canViewSettings && (
          <TabsContent value="settings" className="space-y-4">
            <OrganizationSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}