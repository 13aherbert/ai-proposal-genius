
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";
import { ApiDocsContent } from "@/components/api-docs/ApiDocsContent";

export default function ApiDocs() {
  const { subscription, loading } = useSubscription();

  const hasApiAccess =
    subscription?.plan_type === "enterprise" ||
    subscription?.plan_type === "pro" ||
    subscription?.plan_type === "white_label";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasApiAccess) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Lock className="h-7 w-7 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">API Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              The API is available on Pro and Enterprise plans. Upgrade to get programmatic access to your organization's data.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/subscription">
                <Button>View Plans</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      <ApiDocsContent />
    </div>
  );
}
