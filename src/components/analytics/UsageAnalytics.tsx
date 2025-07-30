import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Users, FileText, TrendingUp, Download } from 'lucide-react';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface UsageMetric {
  metric_type: string;
  metric_value: number;
  metric_date: string;
  metric_category: string;
}

interface UsageData {
  date: string;
  projects_created: number;
  knowledge_entries: number;
  active_users: number;
  avg_engagement: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const UsageAnalytics = () => {
  const { organization: currentOrganization } = useCurrentOrganization();
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [totalMetrics, setTotalMetrics] = useState({
    totalProjects: 0,
    totalKnowledge: 0,
    totalUsers: 0,
    avgEngagement: 0
  });

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchUsageData();
    }
  }, [currentOrganization?.id, timeRange]);

  const fetchUsageData = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const { data: metricsData, error } = await supabase
        .from('organization_analytics')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      if (error) throw error;

      // Transform data for charts
      const dataByDate = new Map<string, Partial<UsageData>>();
      
      metricsData?.forEach((metric) => {
        const dateKey = metric.metric_date;
        if (!dataByDate.has(dateKey)) {
          dataByDate.set(dateKey, { date: dateKey });
        }
        
        const dayData = dataByDate.get(dateKey)!;
        switch (metric.metric_type) {
          case 'projects_created':
            dayData.projects_created = metric.metric_value;
            break;
          case 'knowledge_entries_created':
            dayData.knowledge_entries = metric.metric_value;
            break;
          case 'active_users':
            dayData.active_users = metric.metric_value;
            break;
          case 'avg_engagement_score':
            dayData.avg_engagement = metric.metric_value;
            break;
        }
      });

      const chartData = Array.from(dataByDate.values()).map(data => ({
        date: data.date || '',
        projects_created: data.projects_created || 0,
        knowledge_entries: data.knowledge_entries || 0,
        active_users: data.active_users || 0,
        avg_engagement: data.avg_engagement || 0
      }));

      setUsageData(chartData);

      // Calculate totals
      const totals = chartData.reduce((acc, day) => ({
        totalProjects: acc.totalProjects + day.projects_created,
        totalKnowledge: acc.totalKnowledge + day.knowledge_entries,
        totalUsers: Math.max(acc.totalUsers, day.active_users),
        avgEngagement: acc.avgEngagement + day.avg_engagement
      }), { totalProjects: 0, totalKnowledge: 0, totalUsers: 0, avgEngagement: 0 });

      setTotalMetrics({
        ...totals,
        avgEngagement: chartData.length > 0 ? totals.avgEngagement / chartData.length : 0
      });

    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Projects', value: totalMetrics.totalProjects },
    { name: 'Knowledge Entries', value: totalMetrics.totalKnowledge },
    { name: 'Active Users', value: totalMetrics.totalUsers }
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Usage Analytics</h2>
          <p className="text-muted-foreground">
            Monitor your organization's platform usage and engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{totalMetrics.totalProjects}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Knowledge Entries</p>
                <p className="text-2xl font-bold">{totalMetrics.totalKnowledge}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{totalMetrics.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Engagement</p>
                <p className="text-2xl font-bold">{totalMetrics.avgEngagement.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Usage Trends</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="distribution">Usage Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity Trends</CardTitle>
              <CardDescription>
                Projects and knowledge entries created over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="projects_created" fill="hsl(var(--primary))" name="Projects Created" />
                  <Bar dataKey="knowledge_entries" fill="hsl(var(--secondary))" name="Knowledge Entries" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Metrics</CardTitle>
              <CardDescription>
                Active users and engagement scores over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="active_users" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Active Users"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avg_engagement" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    name="Avg Engagement %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Distribution</CardTitle>
              <CardDescription>
                Breakdown of activity types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};