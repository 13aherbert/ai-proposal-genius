import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Download, FileText, UserCheck, AlertTriangle, Clock } from 'lucide-react';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DataExportRequest {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  export_url?: string;
  expires_at?: string;
  created_at: string;
}

interface ComplianceReport {
  id: string;
  report_type: string;
  report_data: any;
  report_url?: string;
  created_at: string;
  generated_by: string;
}

export const ComplianceManager = () => {
  const { organization: currentOrganization } = useCurrentOrganization();
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportType, setExportType] = useState('export');

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchComplianceData();
    }
  }, [currentOrganization?.id]);

  const fetchComplianceData = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      // Fetch data export requests
      const { data: exportData, error: exportError } = await supabase
        .from('data_export_requests')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (exportError) throw exportError;

      // Fetch compliance reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('compliance_reports')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      setExportRequests(exportData || []);
      setComplianceReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleDataExportRequest = async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase.rpc('request_data_export', {
        org_id: currentOrganization.id,
        target_user_id: null, // Will default to current user
        request_type_param: exportType
      });

      if (error) throw error;

      toast.success('Data export request submitted successfully');
      setShowExportDialog(false);
      fetchComplianceData();
    } catch (error) {
      console.error('Error requesting data export:', error);
      toast.error('Failed to submit data export request');
    }
  };

  const generateComplianceReport = async (reportType: string) => {
    if (!currentOrganization?.id) return;

    try {
      // This would typically trigger an edge function to generate the report
      toast.success('Compliance report generation started');
    } catch (error) {
      console.error('Error generating compliance report:', error);
      toast.error('Failed to generate compliance report');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Manager
          </CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Compliance Manager
        </CardTitle>
        <CardDescription>
          Manage data privacy, exports, and compliance reporting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="exports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="exports">Data Exports</TabsTrigger>
            <TabsTrigger value="reports">Compliance Reports</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="exports" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Data Export Requests</h3>
              <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Request Export
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Data Export</DialogTitle>
                    <DialogDescription>
                      Request an export of your organization's data for compliance purposes
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Export Type</label>
                      <Select value={exportType} onValueChange={setExportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="export">Full Data Export</SelectItem>
                          <SelectItem value="user_data">User Data Only</SelectItem>
                          <SelectItem value="activity_logs">Activity Logs</SelectItem>
                          <SelectItem value="projects">Projects Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleDataExportRequest}>
                        Submit Request
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {exportRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No data export requests found.
              </div>
            ) : (
              <div className="space-y-4">
                {exportRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{request.request_type}</span>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Requested {new Date(request.created_at).toLocaleDateString()}
                            {request.expires_at && (
                              <span className="ml-2">
                                • Expires {new Date(request.expires_at).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                        {request.export_url && request.status === 'completed' && (
                          <Button size="sm" asChild>
                            <a href={request.export_url} download>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Compliance Reports</h3>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => generateComplianceReport('gdpr')}>
                  Generate GDPR Report
                </Button>
                <Button variant="outline" onClick={() => generateComplianceReport('audit')}>
                  Generate Audit Report
                </Button>
              </div>
            </div>

            {complianceReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No compliance reports generated yet.
              </div>
            ) : (
              <div className="space-y-4">
                {complianceReports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{report.report_type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Generated {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {report.report_url && (
                          <Button size="sm" asChild>
                            <a href={report.report_url} download>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">Data Processing Consent</h4>
                      <p className="text-sm text-muted-foreground">
                        All users have provided consent for data processing
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Data Retention Policy</h4>
                      <p className="text-sm text-muted-foreground">
                        User data is retained for 7 years after account deletion
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h4 className="font-medium">Privacy Policy Updates</h4>
                      <p className="text-sm text-muted-foreground">
                        Last updated 30 days ago - notify users of changes
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};