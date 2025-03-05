
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, UserPlus, Users, Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { adminService, UserProfile, UserRole, BetaInvitation } from "@/services/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<BetaInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('beta_tester');
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Checking admin access...");
        const isAdminUser = await adminService.isAdmin();
        console.log("Admin check result:", isAdminUser);
        setIsAdmin(isAdminUser);
        
        if (isAdminUser) {
          // Load initial data
          await Promise.all([
            loadUsers(),
            loadInvitations()
          ]);
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        setError('Failed to verify admin access. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminAccess();
  }, []);
  
  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      console.log("Loading users...");
      const usersList = await adminService.getAllUsers();
      console.log("Loaded users:", usersList);
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  const loadInvitations = async () => {
    try {
      setIsLoadingInvitations(true);
      const invitationsList = await adminService.getBetaInvitations();
      console.log("Loaded invitations:", invitationsList);
      setInvitations(invitationsList);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast.error("Failed to load beta invitations");
    } finally {
      setIsLoadingInvitations(false);
    }
  };
  
  const handleSendInvitation = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    if (!inviteEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    const result = await adminService.createBetaInvitation(inviteEmail);
    if (result) {
      setInviteEmail('');
      await loadInvitations();
    }
  };
  
  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast.error("Please select a user and role");
      return;
    }
    
    const success = await adminService.assignRole(selectedUserId, selectedRole);
    if (success) {
      await loadUsers();
    }
  };
  
  const handleRemoveRole = async (userId: string, role: UserRole) => {
    const success = await adminService.removeRole(userId, role);
    if (success) {
      await loadUsers();
    }
  };
  
  const handleUpdateSubscription = async () => {
    if (!selectedUserId || !selectedPlan) {
      toast.error("Please select a user and plan");
      return;
    }
    
    const success = await adminService.updateSubscriptionPlan(selectedUserId, selectedPlan);
    if (success) {
      // Ensure the user list is refreshed
      await loadUsers();
    }
  };
  
  const handleCancelInvitation = async (invitationId: string) => {
    const success = await adminService.cancelBetaInvitation(invitationId);
    if (success) {
      await loadInvitations();
    }
  };
  
  const copyInviteLink = (inviteCode: string) => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/beta?invite=${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied to clipboard");
  };

  const handleDialogClose = async (refresh: boolean = false) => {
    setDialogOpen(false);
    if (refresh) {
      await loadUsers();
    }
  };

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
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="invitations">Beta Invitations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
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
                    <Select 
                      onValueChange={setSelectedUserId}
                      value={selectedUserId}
                    >
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
                      <Select 
                        onValueChange={(value) => setSelectedRole(value as UserRole)}
                        value={selectedRole}
                      >
                        <SelectTrigger id="role-select" className="flex-1">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="beta_tester">Beta Tester</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAssignRole}>Assign</Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="plan-select">Update Subscription</Label>
                    <div className="flex space-x-2">
                      <Select 
                        onValueChange={setSelectedPlan}
                        value={selectedPlan}
                      >
                        <SelectTrigger id="plan-select" className="flex-1">
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleUpdateSubscription}>Update</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
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
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <Button onClick={handleSendInvitation}>Invite</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>User List</CardTitle>
              <CardDescription>All users and their roles</CardDescription>
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
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map(user => (
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
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">Edit</Button>
                              </DialogTrigger>
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
                                      <Select 
                                        onValueChange={(value) => setSelectedRole(value as UserRole)}
                                        defaultValue="beta_tester"
                                      >
                                        <SelectTrigger className="flex-1">
                                          <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="admin">Admin</SelectItem>
                                          <SelectItem value="beta_tester">Beta Tester</SelectItem>
                                          <SelectItem value="user">User</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button 
                                        onClick={async () => {
                                          const success = await adminService.assignRole(user.userId, selectedRole);
                                          if (success) {
                                            await loadUsers();
                                          }
                                        }}
                                      >
                                        Assign
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label>Update Subscription</Label>
                                    <div className="flex space-x-2">
                                      <Select 
                                        onValueChange={setSelectedPlan}
                                        defaultValue={user.subscription?.plan || "trial"}
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
                                      <Button 
                                        onClick={async () => {
                                          const success = await adminService.updateSubscriptionPlan(user.userId, selectedPlan);
                                          if (success) {
                                            // Refresh the user list when a subscription is updated inside the dialog
                                            await loadUsers();
                                          }
                                        }}
                                      >
                                        Update
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                
                                <DialogFooter>
                                  <Button variant="outline" type="button" onClick={() => handleDialogClose(true)}>
                                    Close
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={loadUsers}>
                Refresh List
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Beta Invitations</CardTitle>
              <CardDescription>Manage beta testing program invitations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInvitations ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.length > 0 ? (
                      invitations.map(invitation => (
                        <TableRow key={invitation.id}>
                          <TableCell>{invitation.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invitation.status === 'pending' ? 'outline' :
                                invitation.status === 'accepted' ? 'default' :
                                'secondary'
                              }
                            >
                              {invitation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(invitation.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {new Date(invitation.expires_at).toLocaleDateString()}
                            {new Date(invitation.expires_at) < new Date() && (
                              <Badge variant="destructive" className="ml-2">Expired</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {invitation.status === 'pending' && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => copyInviteLink(invitation.invite_code)}
                                  >
                                    Copy Link
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleCancelInvitation(invitation.id)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No invitations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex space-x-2 w-full">
                <Input 
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSendInvitation}>
                  <UserPlus className="h-4 w-4 mr-2" /> Invite
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
