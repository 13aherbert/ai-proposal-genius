
import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useAdminDashboard } from "./admin/hooks/useAdminDashboard";
import { UserManagement } from "./admin/UserManagement";
import { BetaInvitations } from "./admin/BetaInvitations";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUserRoles } from "@/hooks/user-roles";

/**
 * AdminDashboard provides an interface for administrators to manage users,
 * their roles, subscriptions, and beta program invitations.
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin: directIsAdmin, forceRoleCheck } = useUserRoles();
  const {
    isAdmin,
    isLoading,
    error,
    users,
    isLoadingUsers,
    selectedUserId,
    setSelectedUserId,
    selectedRole,
    setSelectedRole,
    selectedPlan,
    setSelectedPlan,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    editingUserId,
    startEditingUser,
    stopEditingUser,
    handleAssignRole,
    handleRemoveRole,
    handleUpdateSubscription,
    handleDeleteUser,
    loadUsers,
    invitations,
    isLoadingInvitations,
    loadInvitations
  } = useAdminDashboard();

  // Force a role check when the component mounts
  useEffect(() => {
    console.log("AdminDashboard - Forcing role check");
    forceRoleCheck();
  }, [forceRoleCheck]);

  // Debug admin status
  useEffect(() => {
    console.log("AdminDashboard - Admin status:", { 
      directIsAdmin, 
      hookIsAdmin: isAdmin 
    });
  }, [directIsAdmin, isAdmin]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Access denied state - use both admin checks for better reliability
  const hasAccess = isAdmin || directIsAdmin;
  if (!hasAccess) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            You don't have permission to access the admin dashboard.
            If you believe this is an error, please ensure your account has the admin role assigned.
            <div className="mt-4">
              <Button variant="outline" onClick={forceRoleCheck}>
                Retry Permission Check
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/dashboard')} 
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="invitations">Beta Invitations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UserManagement
            users={users}
            isLoadingUsers={isLoadingUsers}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            editingUserId={editingUserId}
            startEditingUser={startEditingUser}
            stopEditingUser={stopEditingUser}
            handleAssignRole={handleAssignRole}
            handleRemoveRole={handleRemoveRole}
            handleUpdateSubscription={handleUpdateSubscription}
            handleDeleteUser={handleDeleteUser}
            loadUsers={loadUsers}
          />
        </TabsContent>
        
        <TabsContent value="invitations">
          <BetaInvitations
            invitations={invitations}
            isLoadingInvitations={isLoadingInvitations}
            loadInvitations={loadInvitations}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
