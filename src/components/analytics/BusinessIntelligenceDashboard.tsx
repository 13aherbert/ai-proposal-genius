import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useCurrentOrganization } from '@/hooks/use-current-organization';

interface AnalyticsData {
  metric_date: string;
  projects_created: number;
  active_users: number;
  avg_engagement: number;
  total_revenue: number;
}

interface Insight {
  id: string;
  insight_type: string;
  insight_category: string;
  insight_title: string;
  insight_description: string;
  confidence_score: number;
  is_actionable: boolean;
  action_suggested?: string;
  created_at: string;
}

export function BusinessIntelligenceDashboard() {
  const { session } = useAuth();
  const { data: currentOrgId } = useCurrentOrganization(session?.user || null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (currentOrgId) {
      fetchAnalyticsData();
      fetchInsights();
    }
  }, [currentOrgId, timeRange]);

  const fetchAnalyticsData = async () => {
    if (!currentOrgId) return;
    
    try {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('organization_metrics_summary')
        .select('*')
        .eq('organization_id', currentOrgId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      if (error) throw error;
      setAnalyticsData(data || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const fetchInsights = async () => {
    if (!currentOrgId) return;
    
    try {
      const { data, error } = await supabase
        .from('organization_insights')
        .select('*')
        .eq('organization_id', currentOrgId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
    setLoading(false);
  };

  const dismissInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('organization_insights')
        .update({ is_dismissed: true })
        .eq('id', insightId);

      if (error) throw error;
      setInsights(insights.filter(insight => insight.id !== insightId));
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  };

  const getMetricTrend = (data: AnalyticsData[], metric: keyof AnalyticsData) => {
    if (data.length < 2) return 0;
    const recent = data[data.length - 1][metric] as number;
    const previous = data[data.length - 2][metric] as number;
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  };

  const totalUsers = analyticsData.reduce((sum, item) => Math.max(sum, item.active_users), 0);
  const totalProjects = analyticsData.reduce((sum, item) => sum + item.projects_created, 0);
  const avgEngagement = analyticsData.length > 0 
    ? analyticsData.reduce((sum, item) => sum + item.avg_engagement, 0) / analyticsData.length 
    : 0;

  const usersTrend = getMetricTrend(analyticsData, 'active_users');
  const projectsTrend = getMetricTrend(analyticsData, 'projects_created');
  const engagementTrend = getMetricTrend(analyticsData, 'avg_engagement');

  const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'prediction': return <Activity className="h-4 w-4" />;
      case 'recommendation': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getInsightColor = (category: string) => {
    switch (category) {
      case 'usage': return 'bg-blue-500';
      case 'growth': return 'bg-green-500';
      case 'churn': return 'bg-red-500';
      case 'revenue': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-8 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold">{totalUsers}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-500" />
                <div className={`flex items-center ${usersTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {usersTrend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">{Math.abs(usersTrend).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projects Created</p>
                <p className="text-3xl font-bold">{totalProjects}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-green-500" />
                <div className={`flex items-center ${projectsTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {projectsTrend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">{Math.abs(projectsTrend).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Engagement</p>
                <p className="text-3xl font-bold">{avgEngagement.toFixed(1)}%</p>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-yellow-500" />
                <div className={`flex items-center ${engagementTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {engagementTrend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">{Math.abs(engagementTrend).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Analytics Overview</h3>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Metrics</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="insights">Business Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Creation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric_date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="projects_created" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Score</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric_date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avg_engagement" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Users Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric_date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="active_users" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Intelligence Insights</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered insights and recommendations for your organization
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No insights available. Check back later for AI-generated recommendations.
                  </p>
                ) : (
                  insights.map(insight => (
                    <div key={insight.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${getInsightColor(insight.insight_category)}`}>
                            {getInsightIcon(insight.insight_type)}
                          </div>
                          <div>
                            <h4 className="font-semibold">{insight.insight_title}</h4>
                            <p className="text-sm text-muted-foreground">{insight.insight_description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {(insight.confidence_score * 100).toFixed(0)}% confidence
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissInsight(insight.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                      {insight.is_actionable && insight.action_suggested && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm">
                            <strong>Recommended Action:</strong> {insight.action_suggested}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}