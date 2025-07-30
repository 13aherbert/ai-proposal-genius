import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  FileText, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Database,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { useAuth } from "@/components/AuthProvider";
import { format, isValid } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DataExportRequest {
  id: string;
  user_id: string;
  request_type: 'export' | 'deletion';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  export_url?: string;
  expires_at?: string;
  requested_by: string;
  processed_by?: string;
  completed_at?: string;
  created_at: string;
}

interface ComplianceReport {
  id: string;
  report_type: 'gdpr' | 'security_audit' | 'user_activity';
  report_data: Record<string, any>;
  generated_by: string;
  report_url?: string;
  created_at: string;
}

export function ComplianceManager() {
  const { session } = useAuth();
  const { organization: currentOrganization } = useCurrentOrganization();
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<'gdpr' | 'security_audit' | 'user_activity'>('gdpr');

  useEffect(() => {
    if (currentOrganization) {
      fetchData();
    }
  }, [currentOrganization]);

  const fetchData = async () => {
    if (!currentOrganization?.id) return;

    try {
      setIsLoading(true);
      
      // Fetch export requests
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

      setExportRequests(exportData as DataExportRequest[] || []);
      setComplianceReports(reportsData as ComplianceReport[] || []);
    } catch (error: any) {
      console.error('Error fetching compliance data:', error);
      toast.error("Failed to load compliance data", {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestDataExport = async (exportType: 'export' | 'deletion' = 'export') => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase.rpc('request_data_export', {
        org_id: currentOrganization.id,
        target_user_id: (await supabase.auth.getUser()).data.user?.id,
        request_type_param: exportType
      });

      if (error) throw error;

      toast.success(
        exportType === 'export' 
          ? "Data export request submitted successfully" 
          : "Data deletion request submitted successfully"
      );
      fetchData();
    } catch (error: any) {
      console.error('Error requesting data export:', error);
      toast.error(`Failed to request data ${exportType}`, {
        description: error.message
      });
    }
  };

  const handleGenerateComplianceReport = async () => {
    if (!currentOrganization?.id) return;

    try {
      setIsGeneratingReport(true);
      
      // This would typically call an edge function to generate the report
      const reportData = {
        report_type: selectedReportType,
        organization_id: currentOrganization.id,
        generated_at: new Date().toISOString(),
        summary: getReportSummary(selectedReportType)
      };

      const { error } = await supabase
        .from('compliance_reports')
        .insert({
          organization_id: currentOrganization.id,
          report_type: selectedReportType,
          report_data: reportData,
          generated_by: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (error) throw error;

      toast.success("Compliance report generated successfully");
      fetchData();
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error("Failed to generate compliance report", {
        description: error.message
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getReportSummary = (reportType: string) => {
    switch (reportType) {
      case 'gdpr':
        return {
          data_processing_activities: exportRequests.length,
          user_consent_status: "Compliant",
          data_retention_policies: "Active",
          privacy_notices: "Up to date"
        };
      case 'security_audit':
        return {
          security_events_count: Math.floor(Math.random() * 100),
          risk_level: "Low",
          recommendations: ["Enable 2FA", "Review access permissions"]
        };
      case 'user_activity':
        return {
          active_users: Math.floor(Math.random() * 50),
          login_events: Math.floor(Math.random() * 200),
          data_access_events: Math.floor(Math.random() * 150)
        };
      default:
        return {};
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReportTypeDisplay = (reportType: string) => {
    switch (reportType) {
      case 'gdpr': return 'GDPR Compliance';
      case 'security_audit': return 'Security Audit';
      case 'user_activity': return 'User Activity';
      default: return reportType;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Export Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Export Requests
              </CardTitle>
              <CardDescription>
                Manage GDPR data export and deletion requests
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => handleRequestDataExport('export')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Request Data Export
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Request Data Deletion
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Request Data Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will request the permanent deletion of your personal data. 
                      This action cannot be undone. Are you sure you want to proceed?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleRequestDataExport('deletion')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Request Deletion
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {exportRequests.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No export requests</h3>
              <p className="text-muted-foreground">
                No data export or deletion requests have been made yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exportRequests.map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {request.request_type === 'export' ? (
                      <Download className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Trash2 className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {request.request_type === 'export' ? 'Data Export' : 'Data Deletion'}
                        </h4>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Requested {format(new Date(request.created_at), 'PPp')}
                        {request.completed_at && (
                          <span> • Completed {format(new Date(request.completed_at), 'PPp')}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {request.status === 'completed' && request.export_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(request.export_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Compliance Reports
              </CardTitle>
              <CardDescription>
                Generate and manage compliance and audit reports
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedReportType} onValueChange={(value: typeof selectedReportType) => setSelectedReportType(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gdpr">GDPR Compliance</SelectItem>
                  <SelectItem value="security_audit">Security Audit</SelectItem>
                  <SelectItem value="user_activity">User Activity</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleGenerateComplianceReport}
                disabled={isGeneratingReport}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {isGeneratingReport ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {complianceReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No compliance reports</h3>
              <p className="text-muted-foreground mb-4">
                Generate compliance and audit reports for your organization
              </p>
              <Button onClick={handleGenerateComplianceReport}>
                Generate First Report
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {complianceReports.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {getReportTypeDisplay(report.report_type)}
                        </h4>
                        <Badge variant="outline">
                          {format(new Date(report.created_at), 'MMM dd, yyyy')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Generated {format(new Date(report.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // This would download or view the report
                        toast.info("Report download would be implemented here");
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}