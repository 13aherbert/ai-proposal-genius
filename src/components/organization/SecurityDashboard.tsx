import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  Users,
  Activity,
  Lock,
  Globe,
  Smartphone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { useAuth } from "@/components/AuthProvider";
import { format, subDays, isValid } from "date-fns";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

interface SecurityEvent {
  id: string;
  event_type: string;
  event_details: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high';
  ip_address?: string;
  user_agent?: string;
  user_id?: string;
  created_at: string;
}

interface SecurityMetrics {
  totalEvents: number;
  highRiskEvents: number;
  uniqueUsers: number;
  failedLogins: number;
  successfulLogins: number;
  passwordChanges: number;
}

export function SecurityDashboard() {
  const { session } = useAuth();
  const { organization: currentOrganization } = useCurrentOrganization();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    highRiskEvents: 0,
    uniqueUsers: 0,
    failedLogins: 0,
    successfulLogins: 0,
    passwordChanges: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    if (currentOrganization) {
      fetchSecurityData();
    }
  }, [currentOrganization, timeRange]);

  const fetchSecurityData = async () => {
    if (!currentOrganization?.id) return;

    try {
      setIsLoading(true);
      
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), daysAgo);

      // Fetch security events
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_events_log')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;

      const events = eventsData as SecurityEvent[] || [];
      setSecurityEvents(events);

      // Calculate metrics
      const calculatedMetrics: SecurityMetrics = {
        totalEvents: events.length,
        highRiskEvents: events.filter(e => e.risk_level === 'high').length,
        uniqueUsers: new Set(events.map(e => e.user_id).filter(Boolean)).size,
        failedLogins: events.filter(e => e.event_type === 'failed_login').length,
        successfulLogins: events.filter(e => e.event_type === 'login').length,
        passwordChanges: events.filter(e => e.event_type === 'password_change').length
      };

      setMetrics(calculatedMetrics);
    } catch (error: any) {
      console.error('Error fetching security data:', error);
      toast.error("Failed to load security data", {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login':
      case 'sso_login':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'password_change':
        return <Lock className="h-4 w-4 text-blue-600" />;
      case 'logout':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
      default:
        return <Badge variant="outline">{riskLevel}</Badge>;
    }
  };

  const getEventTypeDisplay = (eventType: string) => {
    switch (eventType) {
      case 'login': return 'Login';
      case 'logout': return 'Logout';
      case 'failed_login': return 'Failed Login';
      case 'sso_login': return 'SSO Login';
      case 'password_change': return 'Password Change';
      case 'account_locked': return 'Account Locked';
      default: return eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Generate chart data for the last 7 days
  const getChartData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayEvents = securityEvents.filter(event => {
        const eventDate = new Date(event.created_at);
        return eventDate.toDateString() === date.toDateString();
      });

      days.push({
        date: format(date, 'MMM dd'),
        events: dayEvents.length,
        highRisk: dayEvents.filter(e => e.risk_level === 'high').length,
        logins: dayEvents.filter(e => e.event_type === 'login').length,
        failedLogins: dayEvents.filter(e => e.event_type === 'failed_login').length
      });
    }
    return days;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = getChartData();
  const securityScore = Math.max(0, 100 - (metrics.highRiskEvents * 10) - (metrics.failedLogins * 2));

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold">{securityScore}%</p>
              </div>
              <Shield className={`h-8 w-8 ${securityScore >= 80 ? 'text-green-600' : securityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
            </div>
            <Progress value={securityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{metrics.totalEvents}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last {timeRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk Events</p>
                <p className="text-2xl font-bold text-red-600">{metrics.highRiskEvents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{metrics.uniqueUsers}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Unique users</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Events Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Security Events Trend</CardTitle>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="events" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Total Events"
                />
                <Line 
                  type="monotone" 
                  dataKey="highRisk" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="High Risk Events"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
          <CardDescription>
            Latest security events and activities in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {securityEvents.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No security events</h3>
              <p className="text-muted-foreground">
                No security events have been logged in the selected time period
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {securityEvents.slice(0, 10).map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getEventIcon(event.event_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {getEventTypeDisplay(event.event_type)}
                        </h4>
                        {getRiskBadge(event.risk_level)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{format(new Date(event.created_at), 'PPp')}</span>
                        {event.ip_address && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {event.ip_address}
                          </span>
                        )}
                        {event.user_agent && (
                          <span className="flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            {event.user_agent.includes('Mobile') ? 'Mobile' : 'Desktop'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {securityEvents.length > 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => {
                    toast.info("Full security log view would be implemented here");
                  }}>
                    View All Events ({securityEvents.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}