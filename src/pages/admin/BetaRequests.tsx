
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { adminService } from "@/services/admin";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import useUserRoles from "@/hooks/use-user-roles";
import { format, formatDistanceToNow } from "date-fns";

interface BetaRequest {
  id: string;
  email: string;
  name: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  notes: string | null;
}

export default function BetaRequests() {
  const { session } = useAuth();
  const { isAdmin, isCheckingRoles } = useUserRoles();
  const [requests, setRequests] = useState<BetaRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!isCheckingRoles && !isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
      return;
    }

    const loadBetaRequests = async () => {
      try {
        setIsLoading(true);
        const betaRequests = await adminService.getBetaRequests();
        
        const typedRequests = betaRequests.map(request => ({
          ...request,
          status: (request.status || 'pending') as 'pending' | 'approved' | 'rejected'
        }));
        
        setRequests(typedRequests);
        
        const initialNotes: Record<string, string> = {};
        typedRequests.forEach(request => {
          initialNotes[request.id] = request.notes || '';
        });
        setAdminNotes(initialNotes);
      } catch (err) {
        console.error("Error loading beta requests:", err);
        setError("Failed to load beta requests. Please try again later.");
        toast.error("Failed to load beta requests");
      } finally {
        setIsLoading(false);
      }
    };

    if (session && isAdmin) {
      loadBetaRequests();
    }
  }, [session, isAdmin, isCheckingRoles, navigate]);

  const handleNoteChange = (requestId: string, note: string) => {
    setAdminNotes(prev => ({
      ...prev,
      [requestId]: note
    }));
  };

  const handleProcessRequest = async (requestId: string, approved: boolean) => {
    if (!session?.user?.id) return;
    
    try {
      setProcessingId(requestId);
      await adminService.processBetaRequest({
        requestId,
        approved,
        notes: adminNotes[requestId] || null,
        processedBy: session.user.id
      });
      
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: approved ? 'approved' : 'rejected',
              processed_at: new Date().toISOString(),
              processed_by: session.user?.id || null,
              notes: adminNotes[requestId] || null
            } 
          : req
      ));
      
      toast.success(`Request ${approved ? 'approved' : 'rejected'} successfully`);
      
      if (approved) {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          try {
            await adminService.createBetaInvitation(request.email);
            toast.success("Beta invitation sent to " + request.email);
          } catch (inviteError) {
            console.error("Error creating beta invitation:", inviteError);
            toast.error("Error sending beta invitation");
          }
        }
      }
    } catch (err) {
      console.error("Error processing request:", err);
      toast.error("Failed to process request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (!session) {
    return <div className="p-8 text-center">Please sign in to access this page.</div>;
  }

  if (isCheckingRoles) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Checking permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="p-8 text-center">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="container max-w-7xl py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/admin')}
              aria-label="Back to Admin"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Beta Program Requests</CardTitle>
              <CardDescription>
                Review and manage requests to join the beta program
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="py-4 text-center text-destructive">{error}</div>
          ) : requests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No beta requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.email}</TableCell>
                      <TableCell>{request.name || '-'}</TableCell>
                      <TableCell className="max-w-xs overflow-hidden text-ellipsis">
                        {request.reason || '-'}
                      </TableCell>
                      <TableCell title={format(new Date(request.created_at), 'PPpp')}>
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' ? (
                          <span className="text-yellow-500 font-medium">Pending</span>
                        ) : request.status === 'approved' ? (
                          <span className="text-green-500 font-medium">Approved</span>
                        ) : (
                          <span className="text-red-500 font-medium">Rejected</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' ? (
                          <Textarea
                            value={adminNotes[request.id] || ''}
                            onChange={(e) => handleNoteChange(request.id, e.target.value)}
                            placeholder="Add notes..."
                            className="h-20 resize-none"
                            disabled={processingId === request.id}
                          />
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {request.notes || 'No notes'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProcessRequest(request.id, true)}
                              disabled={processingId === request.id}
                              className="flex items-center text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                            >
                              {processingId === request.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProcessRequest(request.id, false)}
                              disabled={processingId === request.id}
                              className="flex items-center text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              {processingId === request.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                              )}
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Processed {request.processed_at ? 
                              formatDistanceToNow(new Date(request.processed_at), { addSuffix: true }) : ''}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
