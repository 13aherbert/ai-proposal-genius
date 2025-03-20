
import React from 'react';
import { UserManagement } from './UserManagement';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Wrapper component for the UserManagement page that provides necessary props
 */
export default function UserManagementPage() {
  const {
    isAdmin,
    isLoading,
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
    loadUsers
  } = useAdminDashboard();

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
    </div>
  );
}
