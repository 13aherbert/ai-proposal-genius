
import React from 'react';
import { UserProfile, UserRole } from "@/services/admin/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, ShieldCheck, Crown, User, Trash2, Edit, Check, X } from "lucide-react";

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

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'system_admin':
      return <Crown className="h-4 w-4 text-purple-600" />;
    case 'admin':
      return <Shield className="h-4 w-4 text-red-600" />;
    case 'beta_tester':
      return <ShieldCheck className="h-4 w-4 text-blue-600" />;
    case 'user':
      return <User className="h-4 w-4 text-gray-600" />;
    default:
      return <User className="h-4 w-4 text-gray-600" />;
  }
};

const getRoleBadgeVariant = (role: UserRole) => {
  switch (role) {
    case 'system_admin':
      return 'destructive';
    case 'admin':
      return 'destructive';
    case 'beta_tester':
      return 'secondary';
    case 'user':
      return 'outline';
    default:
      return 'outline';
  }
};

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

  const handleRoleAction = async (userId: string, role: UserRole, action: 'assign' | 'remove') => {
    if (action === 'assign') {
      const success = await handleAssignRole(userId, role);
      if (success) {
        setSelectedUserId(null);
        setSelectedRole(null);
      }
    } else {
      const success = await handleRemoveRole(userId, role);
      if (success) {
        setSelectedUserId(null);
        setSelectedRole(null);
      }
    }
  };

  const handleSubscriptionUpdate = async () => {
    if (selectedUserId && selectedPlan && selectedStatus) {
      await handleUpdateSubscription(selectedUserId, selectedPlan, selectedStatus);
      stopEditingUser();
      setSelectedUserId(null);
      setSelectedPlan(null);
      setSelectedStatus(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Role Management Section */}
      {selectedUserId && (
        <Card>
          <CardHeader>
            <CardTitle>Role Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-center">
              <Select value={selectedRole || ""} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_admin">System Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="beta_tester">Beta Tester</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => selectedRole && handleRoleAction(selectedUserId, selectedRole, 'assign')}
                disabled={!selectedRole}
                size="sm"
              >
                Assign Role
              </Button>
              <Button 
                onClick={() => selectedRole && handleRoleAction(selectedUserId, selectedRole, 'remove')}
                disabled={!selectedRole}
                variant="outline"
                size="sm"
              >
                Remove Role
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Management Section */}
      {editingUserId && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-center">
              <Select value={selectedPlan || ""} onValueChange={setSelectedPlan}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
               <Select value={selectedStatus || ""} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSubscriptionUpdate} size="sm">
                <Check className="h-4 w-4 mr-1" />
                Update
              </Button>
              <Button onClick={stopEditingUser} variant="outline" size="sm">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.userId} className={selectedUserId === user.userId ? "ring-2 ring-primary" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                  
                  {user.businessName && (
                    <p className="text-sm text-muted-foreground">{user.businessName}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} variant={getRoleBadgeVariant(role)} className="flex items-center gap-1">
                        {getRoleIcon(role)}
                        {role === 'system_admin' ? 'System Admin' : 
                         role === 'beta_tester' ? 'Beta Tester' : 
                         role.charAt(0).toUpperCase() + role.slice(1)}
                      </Badge>
                    ))}
                  </div>
                  
                  {user.subscription && (
                    <div className="text-sm text-muted-foreground">
                      Plan: {user.subscription.plan} ({user.subscription.status})
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedUserId(selectedUserId === user.userId ? null : user.userId)}
                    variant={selectedUserId === user.userId ? "default" : "outline"}
                    size="sm"
                  >
                    Roles
                  </Button>
                  
                  <Button
                    onClick={() => editingUserId === user.userId ? stopEditingUser() : startEditingUser(user.userId)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {user.firstName} {user.lastName}? 
                          This action cannot be undone and will permanently delete their account and all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.userId)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users found.
        </div>
      )}
    </div>
  );
}
