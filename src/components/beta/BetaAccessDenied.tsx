
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function BetaAccessDenied() {
  return (
    <div className="container mx-auto py-10">
      <Alert variant="destructive" className="max-w-xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Restricted</AlertTitle>
        <AlertDescription>
          You don't have access to the beta program. Please contact the admin team for an invitation.
        </AlertDescription>
      </Alert>
    </div>
  );
}
