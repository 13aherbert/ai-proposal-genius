import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { 
  Shield, 
  User, 
  Settings, 
  Key, 
  FileText, 
  AlertTriangle,
  Clock,
  Search,
  Download,
  Filter
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
  user_agent: string;
  risk_level: 'low' | 'medium' | 'high';
  event_type: string;
}

export function AuditLogger() {
  const { organization } = useCurrentOrganization();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AuditEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Mock audit events - in real implementation, this would come from your backend
  useEffect(() => {
    const mockEvents: AuditEvent[] = [
      {
        id: '1',
        timestamp: '2024-01-15T10:30:00Z',
        user: 'john.doe@company.com',
        action: 'User Login',
        resource: 'Authentication',
        details: 'Successful login from new device',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        risk_level: 'low',
        event_type: 'authentication'
      },
      {
        id: '2',
        timestamp: '2024-01-15T09:45:00Z',
        user: 'admin@company.com',
        action: 'Member Added',
        resource: 'Organization',
        details: 'Added jane.smith@company.com to organization with Editor role',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        risk_level: 'medium',
        event_type: 'user_management'
      },
      {
        id: '3',
        timestamp: '2024-01-15T08:20:00Z',
        user: 'admin@company.com',
        action: 'Permission Changed',
        resource: 'User Permissions',
        details: 'Updated permissions for john.doe@company.com from Viewer to Manager',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        risk_level: 'high',
        event_type: 'security'
      },
      {
        id: '4',
        timestamp: '2024-01-14T16:30:00Z',
        user: 'jane.smith@company.com',
        action: 'API Key Created',
        resource: 'API Management',
        details: 'Created new API key with read-only permissions',
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        risk_level: 'medium',
        event_type: 'api'
      },
      {
        id: '5',
        timestamp: '2024-01-14T14:15:00Z',
        user: 'john.doe@company.com',
        action: 'Settings Updated',
        resource: 'Organization Settings',
        details: 'Updated organization security settings',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        risk_level: 'medium',
        event_type: 'configuration'
      },
      {
        id: '6',
        timestamp: '2024-01-14T11:45:00Z',
        user: 'unknown',
        action: 'Failed Login Attempt',
        resource: 'Authentication',
        details: 'Multiple failed login attempts detected',
        ip_address: '203.0.113.45',
        user_agent: 'curl/7.68.0',
        risk_level: 'high',
        event_type: 'security'
      }
    ];
    setEvents(mockEvents);
    setFilteredEvents(mockEvents);
  }, []);

  // Filter events based on search and filters
  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.event_type === eventTypeFilter);
    }

    if (riskLevelFilter !== 'all') {
      filtered = filtered.filter(event => event.risk_level === riskLevelFilter);
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, eventTypeFilter, riskLevelFilter]);

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'authentication': return <User className="h-4 w-4" />;
      case 'user_management': return <User className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'api': return <Key className="h-4 w-4" />;
      case 'configuration': return <Settings className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const securityInsights = [
    {
      title: 'Failed Login Attempts',
      value: '3',
      trend: '+2 from last week',
      severity: 'high'
    },
    {
      title: 'Permission Changes',
      value: '5',
      trend: '+1 from last week',
      severity: 'medium'
    },
    {
      title: 'New API Keys',
      value: '2',
      trend: 'Same as last week',
      severity: 'low'
    },
    {
      title: 'Login Anomalies',
      value: '1',
      trend: '-1 from last week',
      severity: 'medium'
    }
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
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Type</label>
                  <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="authentication">Authentication</SelectItem>
                      <SelectItem value="user_management">User Management</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="configuration">Configuration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Risk Level</label>
                  <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Events
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Audit Events ({filteredEvents.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.event_type)}
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>{event.user}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.action}</p>
                          <p className="text-sm text-muted-foreground">{event.details}</p>
                        </div>
                      </TableCell>
                      <TableCell>{event.resource}</TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadgeVariant(event.risk_level)}>
                          {event.risk_level === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {event.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{event.ip_address}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {/* Security Insights */}
          <div className="grid gap-4 md:grid-cols-4">
            {securityInsights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{insight.title}</p>
                      <p className="text-2xl font-bold">{insight.value}</p>
                      <p className="text-xs text-muted-foreground">{insight.trend}</p>
                    </div>
                    <div className={`p-2 rounded-full ${
                      insight.severity === 'high' ? 'bg-red-100 text-red-600' :
                      insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Recent Security Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.filter(e => e.event_type === 'security').slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={getRiskBadgeVariant(event.risk_level)}>
                        {event.risk_level}
                      </Badge>
                      <div>
                        <p className="font-medium">{event.action}</p>
                        <p className="text-sm text-muted-foreground">{event.details}</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(event.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Compliance Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">GDPR Compliance Report</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Generate a comprehensive report for GDPR compliance auditing.
                  </p>
                  <Button size="sm">Generate Report</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">SOC 2 Audit Trail</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Export audit trail data for SOC 2 compliance verification.
                  </p>
                  <Button size="sm">Export Data</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Data Access Report</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    View all data access events for transparency reporting.
                  </p>
                  <Button size="sm">View Report</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Security Assessment</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Generate security posture assessment report.
                  </p>
                  <Button size="sm">Assess Security</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}