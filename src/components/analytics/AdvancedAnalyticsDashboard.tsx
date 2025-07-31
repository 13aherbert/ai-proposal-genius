import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusinessIntelligenceDashboard } from './BusinessIntelligenceDashboard';
import { CustomReportBuilder } from './CustomReportBuilder';
import { UsageAnalytics } from '../organization/UsageAnalytics';
import { BarChart3, FileText, TrendingUp, Users, Download, Calendar, Target, Zap } from 'lucide-react';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DashboardMetrics {
  totalProjects: number;
  activeUsers: number;
  avgEngagement: number;
  monthlyGrowth: number;
  projectCompletionRate: number;
  featureAdoptionRate: number;
}

export function AdvancedAnalyticsDashboard() {
  const { organization } = useCurrentOrganization();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProjects: 0,
    activeUsers: 0,
    avgEngagement: 0,
    monthlyGrowth: 0,
    projectCompletionRate: 0,
    featureAdoptionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (organization?.id) {
      fetchDashboardMetrics();
    }
  }, [organization?.id, timeRange]);

  const fetchDashboardMetrics = async () => {
    if (!organization?.id) return;
    
    try {
      // Fetch consolidated metrics for the dashboard
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: analyticsData, error } = await supabase
        .from('organization_analytics')
        .select('*')
        .eq('organization_id', organization.id)
        .gte('metric_date', startDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Calculate aggregated metrics
      const totalProjects = analyticsData?.filter(d => d.metric_type === 'projects_created')
        .reduce((sum, item) => sum + item.metric_value, 0) || 0;
      
      const avgActiveUsers = analyticsData?.filter(d => d.metric_type === 'active_users')
        .reduce((sum, item, _, arr) => sum + item.metric_value / arr.length, 0) || 0;
      
      const avgEngagement = analyticsData?.filter(d => d.metric_type === 'avg_engagement_score')
        .reduce((sum, item, _, arr) => sum + item.metric_value / arr.length, 0) || 0;

      setMetrics({
        totalProjects,
        activeUsers: Math.round(avgActiveUsers),
        avgEngagement: Math.round(avgEngagement),
        monthlyGrowth: 12.5, // This would be calculated from historical data
        projectCompletionRate: 85, // This would come from project status data
        featureAdoptionRate: 73 // This would come from feature usage analytics
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    }
    setLoading(false);
  };

  const exportDashboardData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-organization-report', {
        body: {
          organizationId: organization?.id,
          reportType: 'dashboard_export',
          format: 'xlsx',
          timeRange
        }
      });

      if (error) throw error;
      toast.success('Dashboard data exported successfully');
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      toast.error('Failed to export dashboard data');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics & Intelligence</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics, business intelligence, and custom reporting for your organization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportDashboardData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Intelligence</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Usage</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                    <p className="text-3xl font-bold">{loading ? '-' : metrics.totalProjects}</p>
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{metrics.monthlyGrowth}% this month
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-3xl font-bold">{loading ? '-' : metrics.activeUsers}</p>
                    <p className="text-sm text-blue-600 flex items-center mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      {metrics.avgEngagement}% engagement
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                    <p className="text-3xl font-bold">{loading ? '-' : metrics.projectCompletionRate}%</p>
                    <p className="text-sm text-purple-600 flex items-center mt-1">
                      <Target className="h-3 w-3 mr-1" />
                      {metrics.featureAdoptionRate}% feature adoption
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Usage Analytics</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Track project creation, user activity, and feature adoption
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-medium">Business Intelligence</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered insights and trend analysis
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Custom Reports</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Generate branded reports in multiple formats
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Performance</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor system performance and optimization
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-dashed rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="text-center space-y-2">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h4 className="font-medium">Generate Report</h4>
                    <p className="text-sm text-muted-foreground">
                      Create a custom report with your selected metrics
                    </p>
                  </div>
                </div>
                
                <div className="p-4 border border-dashed rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="text-center space-y-2">
                    <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h4 className="font-medium">View Insights</h4>
                    <p className="text-sm text-muted-foreground">
                      Explore AI-generated business insights
                    </p>
                  </div>
                </div>
                
                <div className="p-4 border border-dashed rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="text-center space-y-2">
                    <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Export your analytics data for external analysis
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence">
          <BusinessIntelligenceDashboard />
        </TabsContent>

        <TabsContent value="reports">
          <CustomReportBuilder />
        </TabsContent>

        <TabsContent value="usage">
          <UsageAnalytics />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  System performance, optimization insights, and operational efficiency
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">127ms</div>
                    <div className="text-sm text-muted-foreground">Avg Response</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">2.3s</div>
                    <div className="text-sm text-muted-foreground">Page Load</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">94</div>
                    <div className="text-sm text-muted-foreground">Performance Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database Performance</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full w-5/6"></div>
                        </div>
                        <span className="text-sm text-green-600">85%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Response Time</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full w-4/5"></div>
                        </div>
                        <span className="text-sm text-blue-600">92%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Storage Efficiency</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full w-3/4"></div>
                        </div>
                        <span className="text-sm text-purple-600">78%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Optimization Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="font-medium text-sm">Database Optimization</div>
                      <div className="text-xs text-muted-foreground">Consider indexing frequently queried columns</div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="font-medium text-sm">Cache Efficiency</div>
                      <div className="text-xs text-muted-foreground">Implement caching for static assets</div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <div className="font-medium text-sm">User Experience</div>
                      <div className="text-xs text-muted-foreground">Optimize image loading for mobile devices</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}