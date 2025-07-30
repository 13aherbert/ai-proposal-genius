import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOrganizationUsage } from '@/hooks/useOrganizationUsage';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Users, FolderOpen, Database, Activity, Zap } from 'lucide-react';

export function UsageAnalytics() {
  const [user, setUser] = React.useState<any>(null);
  const { data: currentOrgId } = useCurrentOrganization(user);
  const { usage, loading } = useOrganizationUsage(currentOrgId);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
                </div>
                <div className="h-2 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No usage data available.</p>
        </CardContent>
      </Card>
    );
  }

  const maxProjects = 3; // Default limit
  const maxUsers = 5; // Default limit

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Usage Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Active Users */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Active Users</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usage.active_users} / {maxUsers}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(usage.active_users, maxUsers)} 
              className="h-2"
            />
          </div>

          {/* Projects */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-green-500" />
                <span className="font-medium">Projects</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usage.projects_created} / {maxProjects}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(usage.projects_created, maxProjects)} 
              className="h-2"
            />
          </div>

          {/* Knowledge Entries */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Knowledge Entries</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usage.knowledge_entries}
              </span>
            </div>
            <Progress 
              value={Math.min(usage.knowledge_entries / 100 * 100, 100)} 
              className="h-2"
            />
          </div>

          {/* Storage Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Storage</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatBytes(usage.storage_used)}
              </span>
            </div>
            <Progress 
              value={Math.min(usage.storage_used / (1024 * 1024 * 1024) * 100, 100)} // 1GB limit for demo
              className="h-2"
            />
          </div>

          {/* API Calls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">API Calls (30 days)</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usage.api_calls.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={Math.min(usage.api_calls / 10000 * 100, 100)} // 10k limit for demo
              className="h-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}