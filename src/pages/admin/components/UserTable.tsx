
import React from 'react';
import { UserProfile, UserRole } from "@/services/admin/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Crown, User, Trash2, Edit, Check, X } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface UserTableProps {
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
}

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'system_admin':
      return <Crown className="h-3 w-3 text-purple-600" />;
    case 'admin':
      return <Shield className="h-3 w-3 text-red-600" />;
    case 'user':
      return <User className="h-3 w-3 text-gray-600" />;
    default:
      return <User className="h-3 w-3 text-gray-600" />;
  }
};

const getRoleBadgeVariant = (role: UserRole) => {
  switch (role) {
    case 'system_admin':
      return 'destructive';
    case 'admin':
      return 'destructive';
    case 'user':
      return 'outline';
    default:
      return 'outline';
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return { display: '-', tooltip: 'No date available' };
  
  try {
    const date = new Date(dateString);
    return {
      display: format(date, 'MMM d, yyyy'),
      tooltip: format(date, 'PPpp')
    };
  } catch {
    return { display: '-', tooltip: 'Invalid date' };
  }
};

const formatRelativeDate = (dateString: string | null) => {
  if (!dateString) return { display: '-', tooltip: 'No activity recorded' };
  
  try {
    const date = new Date(dateString);
    return {
      display: formatDistanceToNow(date, { addSuffix: true }),
      tooltip: format(date, 'PPpp')
    };
  } catch {
    return { display: '-', tooltip: 'Invalid date' };
  }
};

export function UserTable({
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
  handleDeleteUser
}: UserTableProps) {
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
    <TooltipProvider>
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const createdDate = formatDate(user.createdAt);
              const lastActiveDate = formatRelativeDate(user.lastActivityAt);
              
              return (
                <TableRow key={user.userId} className={selectedUserId === user.userId ? "bg-muted/50" : ""}>
                  <TableCell>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {user.businessName || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant={getRoleBadgeVariant(role)} className="flex items-center gap-1 text-xs">
                          {getRoleIcon(role)}
                          {role === 'system_admin' ? 'System Admin' : 
                           role.charAt(0).toUpperCase() + role.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingUserId === user.userId ? (
                      <div className="flex gap-1 items-center">
                        <Select value={selectedPlan || ""} onValueChange={setSelectedPlan}>
                          <SelectTrigger className="w-20 h-7 text-xs">
                            <SelectValue placeholder="Plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trial">Trial</SelectItem>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={selectedStatus || ""} onValueChange={setSelectedStatus}>
                          <SelectTrigger className="w-20 h-7 text-xs">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleSubscriptionUpdate} size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button onClick={stopEditingUser} size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm">
                        {user.subscription ? (
                          <div>
                            <span className="font-medium">{user.subscription.plan}</span>
                            <span className="text-muted-foreground"> ({user.subscription.status})</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No subscription</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm text-muted-foreground cursor-help">
                          {createdDate.display}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{createdDate.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm text-muted-foreground cursor-help">
                          {lastActiveDate.display}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{lastActiveDate.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setSelectedUserId(selectedUserId === user.userId ? null : user.userId)}
                        variant={selectedUserId === user.userId ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                      >
                        Roles
                      </Button>
                      
                      <Button
                        onClick={() => editingUserId === user.userId ? stopEditingUser() : startEditingUser(user.userId)}
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="h-7 w-7 p-0">
                            <Trash2 className="h-3 w-3" />
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Role Management Section */}
        {selectedUserId && (
          <div className="border rounded-lg p-4 bg-muted/20">
            <h3 className="font-medium mb-3">Role Management</h3>
            <div className="flex gap-2 items-center">
              <Select value={selectedRole || ""} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_admin">System Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
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
          </div>
        )}

        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No users found.
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
