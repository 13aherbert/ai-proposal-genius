import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile, UserRole } from "@/services/admin/types";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { UserList } from "./components/UserList";

interface UserManagementProps {
  users: UserProfile[];
  isLoadingUsers: boolean;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole | null) => void;
  selectedPlan: string | null;
  setSelectedPlan: (plan: string | null) => void;
  selectedStatus: string | null;
  setSelectedStatus: (status: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  editingUserId: string | null;
  startEditingUser: (id: string) => void;
  stopEditingUser: () => void;
  handleAssignRole: (userId: string, role: UserRole) => Promise<boolean>;
  handleRemoveRole: (userId: string, role: UserRole) => Promise<boolean>;
  handleUpdateSubscription: (userId: string, plan: string, status: string) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  loadUsers: () => Promise<void>;
}

/**
 * Component for managing users, their roles, and subscriptions
 */
export function UserManagement({
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
}: UserManagementProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage users, assign roles, and update subscriptions
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadUsers} disabled={isLoadingUsers}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoadingUsers ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <UserList
            users={users}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            editingUserId={editingUserId}
            startEditingUser={startEditingUser}
            stopEditingUser={stopEditingUser}
            handleAssignRole={handleAssignRole}
            handleRemoveRole={handleRemoveRole}
            handleUpdateSubscription={handleUpdateSubscription}
            handleDeleteUser={handleDeleteUser}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default UserManagement;
