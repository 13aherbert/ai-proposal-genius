
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminService } from "@/services/admin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/badge";

export function BetaRoleDebugger() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [directQueryResult, setDirectQueryResult] = useState<any>(null);
  const [serviceResult, setServiceResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setUserId(session.user.id);
    } else {
      setUserId(null);
    }
  }, [session]);

  const runDirectQuery = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use our new dedicated beta tester role check function
      const { data, error } = await supabase.rpc('check_beta_tester_role', {
        user_id_param: userId
      });
      
      if (error) throw error;
      
      // Format the response to match our expected structure
      const formattedResult = data ? [{ exists: true, role: 'beta_tester' }] : [];
      
      setDirectQueryResult(formattedResult);
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
              <div className="mb-2">
                Found: {directQueryResult.length > 0 ? (
                  <Badge variant="default" className="bg-green-500">Yes</Badge>
                ) : (
                  <Badge variant="destructive">No</Badge>
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
              <div className="mb-2">
                Is Beta Tester: {serviceResult ? (
                  <Badge variant="default" className="bg-green-500">Yes</Badge>
                ) : (
                  <Badge variant="destructive">No</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
