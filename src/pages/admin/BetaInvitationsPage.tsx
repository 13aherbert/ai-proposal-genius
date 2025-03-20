
import React from 'react';
import { BetaInvitations } from './BetaInvitations';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/**
 * Wrapper component for the BetaInvitations page that provides necessary props
 */
export default function BetaInvitationsPage() {
  const {
    isAdmin,
    isLoading,
    invitations,
    isLoadingInvitations,
    loadInvitations
  } = useAdminDashboard();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="container max-w-7xl mx-auto my-8">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Loading admin dashboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="container max-w-7xl mx-auto my-8">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p>You do not have permission to access this page.</p>
          </div>
        </CardContent>
      </Card>
    );
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
              <CardTitle>Beta Invitations</CardTitle>
              <CardDescription>
                Manage beta program invitations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BetaInvitations
            invitations={invitations}
            isLoadingInvitations={isLoadingInvitations}
            loadInvitations={loadInvitations}
          />
        </CardContent>
      </Card>
    </div>
  );
}
