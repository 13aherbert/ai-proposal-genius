import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, FileText, Calendar, Users, Activity, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { toast } from 'sonner';

interface Report {
  id: string;
  report_name: string;
  report_type: string;
  report_config: any;
  schedule_config: any;
  is_automated: boolean;
  created_at: string;
  last_generated_at?: string;
}

interface ReportOutput {
  id: string;
  report_id: string;
  output_format: string;
  file_url?: string;
  file_size?: number;
  generated_at: string;
  expires_at: string;
}

const REPORT_TYPES = [
  { value: 'usage', label: 'Usage Analytics', icon: Activity },
  { value: 'engagement', label: 'User Engagement', icon: Users },
  { value: 'financial', label: 'Financial Overview', icon: TrendingUp },
  { value: 'custom', label: 'Custom Report', icon: FileText }
];

const METRICS = [
  { id: 'projects_created', label: 'Projects Created', category: 'usage' },
  { id: 'active_users', label: 'Active Users', category: 'engagement' },
  { id: 'avg_engagement', label: 'Average Engagement', category: 'engagement' },
  { id: 'knowledge_entries', label: 'Knowledge Entries', category: 'usage' },
  { id: 'user_sessions', label: 'User Sessions', category: 'engagement' },
  { id: 'feature_adoption', label: 'Feature Adoption', category: 'usage' }
];

const OUTPUT_FORMATS = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'excel', label: 'Excel Spreadsheet' },
  { value: 'csv', label: 'CSV File' },
  { value: 'json', label: 'JSON Data' }
];

export function CustomReportBuilder() {
  const { session } = useAuth();
  const { data: currentOrgId } = useCurrentOrganization(session?.user || null);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportOutputs, setReportOutputs] = useState<ReportOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state for new report
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('30d');
  const [outputFormat, setOutputFormat] = useState('pdf');
  const [isAutomated, setIsAutomated] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly');

  useEffect(() => {
    if (currentOrgId) {
      fetchReports();
      fetchReportOutputs();
    }
  }, [currentOrgId]);

  const fetchReports = async () => {
    if (!currentOrgId) return;
    
    try {
      const { data, error } = await supabase
        .from('organization_reports')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchReportOutputs = async () => {
    if (!currentOrgId) return;
    
    try {
      const { data, error } = await supabase
        .from('organization_report_outputs')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('generated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setReportOutputs(data || []);
    } catch (error) {
      console.error('Error fetching report outputs:', error);
    }
    setLoading(false);
  };

  const createReport = async () => {
    if (!currentOrgId || !session?.user?.id) return;
    
    try {
      const reportConfig = {
        metrics: selectedMetrics,
        dateRange,
        filters: {},
        groupBy: reportType === 'engagement' ? 'user' : 'date'
      };

      const scheduleConfig = isAutomated ? {
        frequency: scheduleFrequency,
        enabled: true,
        nextRun: getNextRunDate(scheduleFrequency)
      } : {};

      const { data, error } = await supabase
        .from('organization_reports')
        .insert({
          organization_id: currentOrgId,
          report_name: reportName,
          report_type: reportType,
          report_config: reportConfig,
          schedule_config: scheduleConfig,
          is_automated: isAutomated,
          created_by: session.user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Report created successfully');
      setReports([data, ...reports]);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report');
    }
  };

  const generateReport = async (reportId: string, format: string = 'pdf') => {
    if (!currentOrgId || !session?.user?.id) return;
    
    setGenerating(true);
    try {
      // In a real implementation, this would call an edge function to generate the report
      const { data, error } = await supabase.functions.invoke('generate-organization-report', {
        body: {
          reportId,
          format,
          organizationId: currentOrgId
        }
      });

      if (error) throw error;

      toast.success('Report generated successfully');
      fetchReportOutputs(); // Refresh outputs
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
    setGenerating(false);
  };

  const getNextRunDate = (frequency: string) => {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
    }
    return now.toISOString();
  };

  const resetForm = () => {
    setReportName('');
    setReportType('');
    setSelectedMetrics([]);
    setDateRange('30d');
    setOutputFormat('pdf');
    setIsAutomated(false);
    setScheduleFrequency('weekly');
  };

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const getRelevantMetrics = () => {
    if (!reportType) return METRICS;
    return METRICS.filter(metric => 
      reportType === 'custom' || metric.category === reportType.replace('_analytics', '')
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-8 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Custom Reports</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Report</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name"
                />
              </div>

              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <type.icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Metrics to Include</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {getRelevantMetrics().map(metric => (
                    <div key={metric.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={metric.id}
                        checked={selectedMetrics.includes(metric.id)}
                        onCheckedChange={() => handleMetricToggle(metric.id)}
                      />
                      <Label htmlFor={metric.id} className="text-sm">{metric.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTPUT_FORMATS.map(format => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="automated"
                    checked={isAutomated}
                    onCheckedChange={setIsAutomated}
                  />
                  <Label htmlFor="automated">Automated Reports</Label>
                </div>

                {isAutomated && (
                  <div className="space-y-2">
                    <Label>Schedule Frequency</Label>
                    <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createReport}
                  disabled={!reportName || !reportType || selectedMetrics.length === 0}
                >
                  Create Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">My Reports</TabsTrigger>
          <TabsTrigger value="outputs">Generated Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reports created yet.</p>
                  <p className="text-sm text-muted-foreground">Create your first custom report to get started.</p>
                </CardContent>
              </Card>
            ) : (
              reports.map(report => (
                <Card key={report.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{report.report_name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{report.report_type}</Badge>
                          {report.is_automated && (
                            <Badge variant="secondary">
                              <Calendar className="h-3 w-3 mr-1" />
                              Automated
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(report.created_at).toLocaleDateString()}
                          {report.last_generated_at && (
                            <> • Last generated {new Date(report.last_generated_at).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {OUTPUT_FORMATS.map(format => (
                          <Button
                            key={format.value}
                            variant="outline"
                            size="sm"
                            onClick={() => generateReport(report.id, format.value)}
                            disabled={generating}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {format.value.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="outputs" className="space-y-4">
          <div className="grid gap-4">
            {reportOutputs.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No generated reports yet.</p>
                  <p className="text-sm text-muted-foreground">Generate reports from the "My Reports" tab.</p>
                </CardContent>
              </Card>
            ) : (
              reportOutputs.map(output => (
                <Card key={output.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge>{output.output_format.toUpperCase()}</Badge>
                          <span className="text-sm font-medium">
                            Report #{output.report_id.slice(0, 8)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Generated {new Date(output.generated_at).toLocaleDateString()}</span>
                          {output.file_size && <span>{formatFileSize(output.file_size)}</span>}
                          <span>Expires {new Date(output.expires_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!output.file_url}
                        onClick={() => output.file_url && window.open(output.file_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}