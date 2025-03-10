
import React, { useState } from 'react';
import { UserProfile } from "@/services/admin/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Save, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserRoleManager } from "./UserRoleManager";
import { UserSubscriptionManager } from "./UserSubscriptionManager";
import { UserRole } from "@/services/admin/types";
import { DeleteUserDialog } from './DeleteUserDialog';

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

/**
 * Component that displays a list of users with their details and management options
 */
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
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.businessName?.toLowerCase().includes(query) ||
      user.roles.some(role => role.toLowerCase().includes(query)) ||
      user.subscription?.plan.toLowerCase().includes(query) ||
      user.subscription?.status.toLowerCase().includes(query)
    );
  });

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await handleDeleteUser(userToDelete.userId);
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const getUserDisplayName = (user: UserProfile): string => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.businessName || user.email || 'Unknown user';
  };

  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <TableRow key={user.userId} className={selectedUserId === user.userId ? "bg-muted" : ""}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.firstName || user.lastName ? (
                    `${user.firstName || ''} ${user.lastName || ''}`
                  ) : (
                    user.businessName || <span className="text-muted-foreground italic">Not set</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <UserRoleManager
                    userId={user.userId}
                    userRoles={user.roles}
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    handleAssignRole={handleAssignRole}
                    handleRemoveRole={handleRemoveRole}
                    isEditing={editingUserId === user.userId}
                  />
                </TableCell>
                
                <TableCell>
                  <UserSubscriptionManager
                    userId={user.userId}
                    currentPlan={user.subscription?.plan || null}
                    currentStatus={user.subscription?.status || null}
                    selectedPlan={selectedPlan}
                    setSelectedPlan={setSelectedPlan}
                    selectedStatus={selectedStatus}
                    setSelectedStatus={setSelectedStatus}
                    handleUpdateSubscription={handleUpdateSubscription}
                    isEditing={editingUserId === user.userId}
                  />
                </TableCell>
                
                <TableCell>
                  <div className="flex space-x-2">
                    {editingUserId === user.userId ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={stopEditingUser}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Done
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => startEditingUser(user.userId)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => setUserToDelete(user)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                {searchQuery ? 'No users match your search' : 'No users found'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {userToDelete && (
        <DeleteUserDialog
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={confirmDeleteUser}
          userName={getUserDisplayName(userToDelete)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
