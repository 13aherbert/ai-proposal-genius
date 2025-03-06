
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAdminDashboard } from "./admin/hooks/useAdminDashboard";
import { UserManagement } from "./admin/UserManagement";
import { BetaInvitations } from "./admin/BetaInvitations";

/**
 * AdminDashboard provides an interface for administrators to manage users,
 * their roles, subscriptions, and beta program invitations.
 */
export default function AdminDashboard() {
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
    loadUsers,
    invitations,
    isLoadingInvitations,
    loadInvitations
  } = useAdminDashboard();

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

  // Access denied state
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            You don't have permission to access the admin dashboard.
            If you believe this is an error, please ensure your account has the admin role assigned.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
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
