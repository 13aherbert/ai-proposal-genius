import React, { useMemo, useState } from 'react';
import { UserProfile, UserRole } from "@/services/admin/types";
import { UserTable } from "./UserTable";
import { UserStatsCards } from "./UserStatsCards";
import { UserFilters, RoleFilter, PlanFilter, StatusFilter } from "./UserFilters";

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
  reloadUsers: () => Promise<void>;
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
  setSearchQuery,
  reloadUsers,
}: UserListProps) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter((user) => {
      if (q) {
        const hit =
          user.email?.toLowerCase().includes(q) ||
          user.firstName?.toLowerCase().includes(q) ||
          user.lastName?.toLowerCase().includes(q) ||
          user.businessName?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (roleFilter !== 'all' && !user.roles?.includes(roleFilter)) return false;

      const planRaw = user.subscription?.plan?.toLowerCase() ?? null;
      if (planFilter !== 'all') {
        if (planFilter === 'none') {
          if (planRaw) return false;
        } else if (planRaw !== planFilter) {
          return false;
        }
      }

      if (statusFilter !== 'all') {
        const s = user.subscription?.status?.toLowerCase() ?? null;
        if (s !== statusFilter) return false;
      }
      return true;
    });
  }, [users, searchQuery, roleFilter, planFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <UserStatsCards users={users} />

      <UserFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        planFilter={planFilter}
        setPlanFilter={setPlanFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        resultCount={filteredUsers.length}
        totalCount={users.length}
      />

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
        reloadUsers={reloadUsers}
      />
    </div>
  );
}
