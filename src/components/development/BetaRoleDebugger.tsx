
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminService } from "@/services/admin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

export function BetaRoleDebugger() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [directQueryResult, setDirectQueryResult] = useState<any>(null);
  const [serviceResult, setServiceResult] = useState<boolean | null>(null);
  const [invitationResult, setInvitationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailForInvitation, setEmailForInvitation] = useState<string>("");
  const [lastRoleCheckTime, setLastRoleCheckTime] = useState<string | null>(null);
  const [fixingRole, setFixingRole] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setUserId(session.user.id);
      // Try to get the user's email from session
      if (session.user.email) {
        setEmailForInvitation(session.user.email);
      }
    } else {
      setUserId(null);
    }
  }, [session]);

  const runDirectQuery = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use our dedicated beta tester role check function
      const { data, error } = await supabase.rpc('check_beta_tester_role', {
        user_id_param: userId
      });
      
      if (error) throw error;
      
      // Format the response to match our expected structure
      const formattedResult = data ? [{ exists: true, role: 'beta_tester' }] : [];
      
      setDirectQueryResult(formattedResult);
      setLastRoleCheckTime(new Date().toLocaleTimeString());
      console.log("Beta tester check result:", data, formattedResult);
    } catch (err) {
      console.error("Direct query error:", err);
      // Properly format the error message based on type
      if (typeof err === 'object' && err !== null) {
        if ('message' in err) {
          setError((err as Error).message);
        } else {
          // For Supabase errors or other structured errors
          setError(JSON.stringify(err, null, 2));
        }
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const checkServiceMethod = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await adminService.isBetaTester();
      setServiceResult(result);
      setLastRoleCheckTime(new Date().toLocaleTimeString());
      console.log("Service method result:", result);
    } catch (err) {
      console.error("Service method error:", err);
      // Properly format the error message based on type
      if (typeof err === 'object' && err !== null) {
        if ('message' in err) {
          setError((err as Error).message);
        } else {
          // For Supabase errors or other structured errors
          setError(JSON.stringify(err, null, 2));
        }
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const checkPendingInvitation = async () => {
    if (!emailForInvitation) {
      setError("Please enter an email address");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("get-pending-invitation", {
        body: { email: emailForInvitation }
      });
      
      if (error) throw error;
      
      setInvitationResult(data);
      console.log("Pending invitation result:", data);
    } catch (err) {
      console.error("Invitation check error:", err);
      // Properly format the error message
      if (typeof err === 'object' && err !== null) {
        if ('message' in err) {
          setError((err as Error).message);
        } else {
          setError(JSON.stringify(err, null, 2));
        }
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const fixBetaTesterRole = async () => {
    if (!userId) return;
    
    setFixingRole(true);
    setError(null);
    
    try {
      console.log("Attempting to assign beta_tester role to user:", userId);
      
      // Direct assignment using the RPC function 
      const { data, error } = await supabase.rpc(
        'assign_user_role',
        {
          _user_id: userId,
          _role: 'beta_tester',
          _created_by: userId
        }
      );
      
      if (error) {
        throw error;
      }
      
      console.log("Role assignment result:", data);
      
      // Verify the assignment was successful
      await runDirectQuery();
      
      if (directQueryResult && directQueryResult.length > 0) {
        console.log("Role assignment verified successfully");
      } else {
        console.log("Role was assigned but verification failed, retrying check");
        setTimeout(runDirectQuery, 1000);
      }
    } catch (err) {
      console.error("Error fixing beta tester role:", err);
      if (typeof err === 'object' && err !== null) {
        if ('message' in err) {
          setError((err as Error).message);
        } else {
          setError(JSON.stringify(err, null, 2));
        }
      } else {
        setError(String(err));
      }
    } finally {
      setFixingRole(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Beta Role Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="font-medium">User ID:</div>
          <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
            {userId || "Not logged in"}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={runDirectQuery} disabled={loading || !userId}>
            Test Direct Query
          </Button>
          <Button onClick={checkServiceMethod} disabled={loading || !userId}>
            Test Service Method
          </Button>
          {directQueryResult && directQueryResult.length === 0 && (
            <Button 
              onClick={fixBetaTesterRole} 
              disabled={fixingRole || !userId}
              variant="destructive"
            >
              {fixingRole ? <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-1 h-4 w-4" />}
              Fix Missing Role
            </Button>
          )}
        </div>
        
        {lastRoleCheckTime && (
          <div className="text-xs text-gray-500">
            Last checked: {lastRoleCheckTime}
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <div className="font-medium mb-2">Check Pending Invitation:</div>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={emailForInvitation}
              onChange={(e) => setEmailForInvitation(e.target.value)}
              placeholder="Email address"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button onClick={checkPendingInvitation} disabled={loading || !emailForInvitation}>
              Check
            </Button>
          </div>
        </div>
        
        {loading && <div className="text-center">Loading...</div>}
        
        {error && (
          <div className="p-3 bg-red-50 text-red-800 rounded-md overflow-auto">
            <div className="font-medium mb-1">Error:</div>
            <pre className="whitespace-pre-wrap break-words text-sm">{error}</pre>
          </div>
        )}

        {directQueryResult !== null && (
          <div className="space-y-2">
            <div className="font-medium">Direct Query Results:</div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="mb-2 flex items-center">
                <span className="mr-2">Beta Tester Role:</span>
                {directQueryResult.length > 0 ? (
                  <Badge variant="default" className="bg-green-500 flex items-center">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    No
                  </Badge>
                )}
              </div>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(directQueryResult, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {serviceResult !== null && (
          <div className="space-y-2">
            <div className="font-medium">Service Method Result:</div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="mb-2 flex items-center">
                <span className="mr-2">Is Beta Tester:</span>
                {serviceResult ? (
                  <Badge variant="default" className="bg-green-500 flex items-center">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    No
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
        
        {invitationResult !== null && (
          <div className="space-y-2">
            <div className="font-medium">Pending Invitation Results:</div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="mb-2 flex items-center">
                <span className="mr-2">Found:</span>
                {Array.isArray(invitationResult) && invitationResult.length > 0 ? (
                  <Badge variant="default" className="bg-green-500 flex items-center">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    No
                  </Badge>
                )}
              </div>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(invitationResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
