import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useOrganizationMembers, type OrganizationMember } from '@/hooks/useOrganizationMembers';
import { useOrganizationPermissions } from '@/hooks/useOrganizationPermissions';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { MemberInvitation } from './MemberInvitation';
import { PermissionEditor } from './PermissionEditor';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, MoreHorizontal, Shield, Trash2, Building, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TeamManagement() {
  const [user, setUser] = useState<any>(null);
  const { organization } = useCurrentOrganization();
  const { members, loading, updateMemberRole, updateMemberPermissions, removeMember, fetchMembers } = useOrganizationMembers(organization?.id);
  const { hasPermission } = useOrganizationPermissions(organization?.id);
  const { toast } = useToast();
  const [editingMember, setEditingMember] = useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const canManageTeam = hasPermission('team_management', 'invite') || hasPermission('team_management', 'modify_roles');

  const getRoleColor = (role: OrganizationMember['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'editor': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'billing_admin': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRoleUpdate = async (memberId: string, newRole: OrganizationMember['role']) => {
    try {
      await updateMemberRole(memberId, newRole);
      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
      });
      setEditingMember(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId);
      toast({
        title: "Member removed",
        description: "Member has been removed from the organization.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
                <div className="h-6 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
          {canManageTeam && organization?.id && (
            <MemberInvitation 
              organizationId={organization.id} 
              onInviteSent={fetchMembers}
              teamSize={members.length}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback>
                    {(member.first_name?.[0] || '') + (member.last_name?.[0] || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {member.first_name} {member.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {member.username}
                  </div>
                  {member.title && (
                    <div className="text-xs text-muted-foreground">
                      {member.title}
                    </div>
                  )}
                  {member.department && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {member.department}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {editingMember === member.id ? (
                  <div className="flex items-center space-x-2">
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleUpdate(member.id, value as OrganizationMember['role'])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="billing_admin">Billing Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingMember(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <Badge className={getRoleColor(member.role)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {member.role}
                    </Badge>
                    
                    {canManageTeam && member.role !== 'owner' && (
                      <div className="flex items-center space-x-1">
                        <PermissionEditor 
                          member={member} 
                          onPermissionsUpdate={updateMemberPermissions}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingMember(member.id)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {member.first_name} {member.last_name} from the organization? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRemoveMember(member.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}