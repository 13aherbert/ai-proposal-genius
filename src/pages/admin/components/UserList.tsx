
import React from 'react';
import { UserProfile, UserRole } from "@/services/admin/types";
import { Input } from "@/components/ui/input";
import { UserTable } from "./UserTable";
import { UserStatsCards } from "./UserStatsCards";

interface UserListProps {
  users: UserProfile[];
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole | null) => void;
  selectedPlan: string | null;
  setSelectedPlan: (plan: string | null) => void;
  selectedStatus: string | null;
  setSelectedStatus: (status: string | null) => void;
  editingUserId: string | null;
  startEditingUser: (id: string) => void;
  stopEditingUser: () => void;
  handleAssignRole: (userId: string, role: UserRole) => Promise<boolean>;
  handleRemoveRole: (userId: string, role: UserRole) => Promise<boolean>;
  handleUpdateSubscription: (userId: string, plan: string, status: string) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function UserList({
  users,
  selectedUserId,
  setSelectedUserId,
  selectedRole,
  setSelectedRole,
  selectedPlan,
  setSelectedPlan,
  selectedStatus,
  setSelectedStatus,
  editingUserId,
  startEditingUser,
  stopEditingUser,
  handleAssignRole,
  handleRemoveRole,
  handleUpdateSubscription,
  handleDeleteUser,
  searchQuery,
  setSearchQuery
}: UserListProps) {
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.businessName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* User Statistics Cards */}
      <UserStatsCards users={users} />
      
      {/* Search */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <UserTable
        users={filteredUsers}
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
      />
    </div>
  );
}
