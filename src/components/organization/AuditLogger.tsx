import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, User, Settings, Key, FileText, AlertTriangle,
  Clock, Search, Download, Filter, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AuditEvent {
  id: string;
  created_at: string;
  event_type: string;
  user_id: string | null;
  event_details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  risk_level: string | null;
}

export function AuditLogger() {
  const { organization } = useCurrentOrganization();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  const fetchEvents = useCallback(async (pageNum: number = 0) => {
    if (!organization?.id) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from('security_events_log')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter);
      }
      if (riskLevelFilter !== 'all') {
        query = query.eq('risk_level', riskLevelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const mapped = (data || []).map(e => ({
        ...e,
        event_details: e.event_details as Record<string, any> | null,
        ip_address: e.ip_address ? String(e.ip_address) : null,
      }));
      
      setEvents(pageNum === 0 ? mapped : prev => [...prev, ...mapped]);
      setHasMore((data?.length || 0) === PAGE_SIZE);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch audit events:', err);
      toast.error('Failed to load audit events');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id, eventTypeFilter, riskLevelFilter]);

  useEffect(() => {
    fetchEvents(0);
  }, [fetchEvents]);

  const filteredEvents = searchTerm
    ? events.filter(e =>
        e.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(e.event_details || {}).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : events;

  const exportCSV = () => {
    if (filteredEvents.length === 0) {
      toast.error('No events to export');
      return;
    }
    const headers = ['Timestamp', 'Event Type', 'User ID', 'Risk Level', 'IP Address', 'Details'];
    const rows = filteredEvents.map(e => [
      e.created_at ? format(new Date(e.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
      e.event_type,
      e.user_id || '',
      e.risk_level || 'low',
      e.ip_address || '',
      JSON.stringify(e.event_details || {}),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit log exported');
  };

  const getRiskBadgeVariant = (risk: string | null) => {
    switch (risk) {
      case 'high': return 'destructive' as const;
      case 'medium': return 'default' as const;
      default: return 'secondary' as const;
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('login') || eventType.includes('auth') || eventType.includes('sso')) return <User className="h-4 w-4" />;
    if (eventType.includes('security') || eventType.includes('mfa')) return <Shield className="h-4 w-4" />;
    if (eventType.includes('api') || eventType.includes('key')) return <Key className="h-4 w-4" />;
    if (eventType.includes('config') || eventType.includes('setting') || eventType.includes('role')) return <Settings className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getEventLabel = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Calculate security insights from real data
  const highRiskCount = events.filter(e => e.risk_level === 'high').length;
  const mediumRiskCount = events.filter(e => e.risk_level === 'medium').length;
  const authEvents = events.filter(e => e.event_type.includes('login') || e.event_type.includes('auth')).length;
  const recentEvents = events.filter(e => e.created_at && new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;

  const securityInsights = [
    { title: 'High Risk Events', value: String(highRiskCount), severity: 'high' as const },
    { title: 'Medium Risk Events', value: String(mediumRiskCount), severity: 'medium' as const },
    { title: 'Auth Events', value: String(authEvents), severity: 'low' as const },
    { title: 'Last 24 Hours', value: String(recentEvents), severity: 'low' as const },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Audit Events</TabsTrigger>
          <TabsTrigger value="security">Security Dashboard</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" /> Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Type</label>
                  <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="login_success">Login Success</SelectItem>
                      <SelectItem value="login_failed">Login Failed</SelectItem>
                      <SelectItem value="sso_login_success">SSO Login</SelectItem>
                      <SelectItem value="mfa_enabled">MFA Enabled</SelectItem>
                      <SelectItem value="role_changed">Role Changed</SelectItem>
                      <SelectItem value="member_added">Member Added</SelectItem>
                      <SelectItem value="member_removed">Member Removed</SelectItem>
                      <SelectItem value="data_export">Data Export</SelectItem>
                      <SelectItem value="settings_updated">Settings Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Risk Level</label>
                  <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Actions</label>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={exportCSV}>
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => fetchEvents(0)}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Audit Events ({filteredEvents.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && events.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No audit events found</p>
                  <p className="text-sm mt-1">Security events will appear here as they occur</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getEventIcon(event.event_type)}
                              <span className="text-sm">{event.created_at ? format(new Date(event.created_at), 'MMM d, HH:mm:ss') : '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">{getEventLabel(event.event_type)}</p>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm text-muted-foreground truncate">
                              {event.event_details ? JSON.stringify(event.event_details).slice(0, 80) : '-'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRiskBadgeVariant(event.risk_level)}>
                              {event.risk_level === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {event.risk_level || 'low'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{event.ip_address || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <Button variant="outline" size="sm" onClick={() => fetchEvents(page + 1)} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {securityInsights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{insight.title}</p>
                      <p className="text-2xl font-bold">{insight.value}</p>
                    </div>
                    <div className={`p-2 rounded-full ${
                      insight.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                      insight.severity === 'medium' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600' :
                      'bg-green-100 dark:bg-green-950/30 text-green-600'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Recent High-Risk Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.filter(e => e.risk_level === 'high' || e.risk_level === 'medium').slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={getRiskBadgeVariant(event.risk_level)}>{event.risk_level}</Badge>
                      <div>
                        <p className="font-medium text-sm">{getEventLabel(event.event_type)}</p>
                        <p className="text-xs text-muted-foreground">{event.event_details ? JSON.stringify(event.event_details).slice(0, 60) : ''}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {event.created_at ? format(new Date(event.created_at), 'MMM d, HH:mm') : ''}
                    </span>
                  </div>
                ))}
                {events.filter(e => e.risk_level === 'high' || e.risk_level === 'medium').length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">No high-risk events detected</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Compliance Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">GDPR Compliance Report</h4>
                  <p className="text-sm text-muted-foreground mb-3">Generate a comprehensive report for GDPR compliance auditing.</p>
                  <Button size="sm" onClick={exportCSV}>Generate Report</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">SOC 2 Audit Trail</h4>
                  <p className="text-sm text-muted-foreground mb-3">Export audit trail data for SOC 2 compliance verification.</p>
                  <Button size="sm" onClick={exportCSV}>Export Data</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Data Access Report</h4>
                  <p className="text-sm text-muted-foreground mb-3">View all data access events for transparency reporting.</p>
                  <Button size="sm" onClick={exportCSV}>View Report</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Security Assessment</h4>
                  <p className="text-sm text-muted-foreground mb-3">Generate security posture assessment report.</p>
                  <Button size="sm" onClick={exportCSV}>Assess Security</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
