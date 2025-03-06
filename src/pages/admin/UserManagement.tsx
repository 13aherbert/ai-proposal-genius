
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, XCircle } from "lucide-react";
import { UserProfile, UserRole } from "@/services/admin/types";
import { adminService } from "@/services/admin";

interface UserManagementProps {
  users: UserProfile[];
  isLoadingUsers: boolean;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  editingUserId: string | null;
  startEditingUser: (userId: string) => void;
  stopEditingUser: (refresh?: boolean) => Promise<void>;
  handleAssignRole: () => Promise<void>;
  handleRemoveRole: (userId: string, role: UserRole) => Promise<void>;
  handleUpdateSubscription: () => Promise<void>;
  loadUsers: () => Promise<void>;
}

/**
 * UserManagement component handles the admin interface for managing users,
 * their roles, and subscriptions.
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
  loadUsers,
}: UserManagementProps) {
  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    
    if (user.email && user.email.toLowerCase().includes(query)) {
      return true;
    }
    
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().trim();
    if (fullName && fullName.includes(query)) {
      return true;
    }
    
    if (user.businessName && user.businessName.toLowerCase().includes(query)) {
      return true;
    }
    
    return false;
  });

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage user roles and subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="user-select">Select User</Label>
                <Select onValueChange={setSelectedUserId} value={selectedUserId}>
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.userId} value={user.userId}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-select">Assign Role</Label>
                <div className="flex space-x-2">
                  <Select onValueChange={value => setSelectedRole(value as UserRole)} value={selectedRole}>
                    <SelectTrigger id="role-select" className="flex-1">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="beta_tester">Beta Tester</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssignRole}>Assign</Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="plan-select">Update Subscription</Label>
                <div className="grid gap-2">
                  <div className="flex space-x-2">
                    <Select onValueChange={setSelectedPlan} value={selectedPlan}>
                      <SelectTrigger id="plan-select" className="flex-1">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Select onValueChange={setSelectedStatus} value={selectedStatus}>
                      <SelectTrigger id="status-select" className="flex-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trialing">Trialing</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="past_due">Past Due</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                        <SelectItem value="incomplete">Incomplete</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleUpdateSubscription}>Update</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <UserInvitationCard />
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>User List</CardTitle>
              <CardDescription>All users and their roles</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email / User Name</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <TableRow key={user.userId}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.businessName || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map(role => (
                              <Badge 
                                key={role} 
                                variant={role === 'admin' ? 'destructive' : 'default'} 
                                className="flex items-center gap-1"
                              >
                                {role}
                                <button 
                                  onClick={() => handleRemoveRole(user.userId, role)} 
                                  className="ml-1 hover:text-destructive-foreground"
                                >
                                  <XCircle className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.subscription ? (
                          <Badge variant={user.subscription.plan === 'pro' ? 'outline' : 'secondary'}>
                            {user.subscription.plan} ({user.subscription.status})
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No subscription</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => startEditingUser(user.userId)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      {searchQuery.trim() ? "No users found matching your search" : "No users found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {searchQuery.trim() ? `Found ${filteredUsers.length} user(s)` : `Total: ${users.length} user(s)`}
          </div>
          <Button variant="outline" onClick={loadUsers}>
            Refresh List
          </Button>
        </CardFooter>
      </Card>
      
      {/* User Edit Dialog */}
      {users.map(user => (
        <UserEditDialog
          key={user.userId}
          user={user}
          isOpen={editingUserId === user.userId}
          onClose={stopEditingUser}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          loadUsers={loadUsers}
        />
      ))}
    </>
  );
}

/**
 * Component for inviting new beta testers
 */
function UserInvitationCard() {
  const [inviteEmail, setInviteEmail] = React.useState('');
  
  const handleSendInvitation = async () => {
    if (!inviteEmail) {
      return;
    }
    if (!inviteEmail.includes('@')) {
      return;
    }
    const result = await adminService.createBetaInvitation(inviteEmail);
    if (result) {
      setInviteEmail('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Beta Tester</CardTitle>
        <CardDescription>Send beta program invitations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="invite-email">Email Address</Label>
          <div className="flex space-x-2">
            <Input 
              id="invite-email" 
              placeholder="email@example.com" 
              value={inviteEmail} 
              onChange={e => setInviteEmail(e.target.value)} 
            />
            <Button onClick={handleSendInvitation}>Invite</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Dialog for editing a user's roles and subscription
 */
function UserEditDialog({
  user,
  isOpen,
  onClose,
  selectedRole,
  setSelectedRole,
  selectedPlan,
  setSelectedPlan,
  selectedStatus,
  setSelectedStatus,
  loadUsers,
}: {
  user: UserProfile;
  isOpen: boolean;
  onClose: (refresh?: boolean) => Promise<void>;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  loadUsers: () => Promise<void>;
}) {
  // Set initial values when the dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedPlan(user.subscription?.plan || 'starter');
      setSelectedStatus(user.subscription?.status || 'active');
    }
  }, [isOpen, user, setSelectedPlan, setSelectedStatus]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User: {user.email}</DialogTitle>
          <DialogDescription>
            Update user roles and subscription
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Assign Role</Label>
            <div className="flex space-x-2">
              <Select onValueChange={value => setSelectedRole(value as UserRole)} defaultValue="beta_tester">
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="beta_tester">Beta Tester</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={async () => {
                const success = await adminService.assignRole(user.userId, selectedRole);
                if (success) {
                  await loadUsers();
                }
              }}>
                Assign
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Update Subscription Plan</Label>
            <div className="flex space-x-2">
              <Select 
                onValueChange={setSelectedPlan}
                value={selectedPlan}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Subscription Status</Label>
            <div className="flex space-x-2">
              <Select 
                onValueChange={setSelectedStatus}
                value={selectedStatus}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={async () => {
                const success = await adminService.updateSubscriptionPlan(user.userId, selectedPlan, selectedStatus);
                if (success) {
                  await loadUsers();
                }
              }}>
                Update
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onClose(true)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
