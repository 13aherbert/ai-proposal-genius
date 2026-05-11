import React, { useEffect, useMemo, useState } from 'react';
import { UserProfile, UserRole } from "@/services/admin/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Crown, User, Trash2, Edit, Check, X, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { adminService } from "@/services/admin";
import { toast } from "sonner";

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
  reloadUsers: () => Promise<void>;
}

const PLAN_OPTIONS = ['starter', 'growth', 'business', 'enterprise'] as const;
const STATUS_OPTIONS = ['active', 'inactive', 'cancelled'] as const;

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'system_admin': return <Crown className="h-3 w-3 text-purple-600" />;
    case 'admin': return <Shield className="h-3 w-3 text-red-600" />;
    default: return <User className="h-3 w-3 text-gray-600" />;
  }
};

const getRoleBadgeVariant = (role: UserRole) =>
  role === 'system_admin' || role === 'admin' ? 'destructive' : 'outline';

const formatDate = (s: string | null) => {
  if (!s) return { display: '-', tooltip: 'No date available' };
  try { const d = new Date(s); return { display: format(d, 'MMM d, yyyy'), tooltip: format(d, 'PPpp') }; }
  catch { return { display: '-', tooltip: 'Invalid date' }; }
};
const formatRelativeDate = (s: string | null) => {
  if (!s) return { display: '-', tooltip: 'No activity recorded' };
  try { const d = new Date(s); return { display: formatDistanceToNow(d, { addSuffix: true }), tooltip: format(d, 'PPpp') }; }
  catch { return { display: '-', tooltip: 'Invalid date' }; }
};

export function UserTable({
  users,
  selectedUserId, setSelectedUserId,
  selectedRole, setSelectedRole,
  selectedPlan, setSelectedPlan,
  selectedStatus, setSelectedStatus,
  editingUserId, startEditingUser, stopEditingUser,
  handleAssignRole, handleRemoveRole, handleUpdateSubscription, handleDeleteUser,
  reloadUsers,
}: UserTableProps) {
  // ---------- Bulk selection ----------
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<UserRole | ''>('');
  const [bulkPlan, setBulkPlan] = useState<string>('');
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkBusy, setBulkBusy] = useState(false);

  // Drop selections that no longer exist in the (filtered) list
  useEffect(() => {
    const visible = new Set(users.map((u) => u.userId));
    setSelectedIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => { if (visible.has(id)) next.add(id); });
      return next.size === prev.size ? prev : next;
    });
  }, [users]);

  const allChecked = users.length > 0 && selectedIds.size === users.length;
  const someChecked = selectedIds.size > 0 && !allChecked;

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(users.map((u) => u.userId)) : new Set());
  };
  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const runBulk = async (
    label: string,
    fn: (id: string) => Promise<unknown>,
  ) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(ids.map(fn));
    const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value === false)).length;
    const ok = ids.length - failed;
    if (failed === 0) toast.success(`${label}: ${ok} user${ok === 1 ? '' : 's'} updated`);
    else if (ok === 0) toast.error(`${label} failed for all ${failed} user${failed === 1 ? '' : 's'}`);
    else toast.warning(`${label}: ${ok} succeeded, ${failed} failed`);
    clearSelection();
    await reloadUsers();
    setBulkBusy(false);
  };

  const onBulkAssignRole = () => {
    if (!bulkRole) return toast.error('Select a role first');
    void runBulk('Assign role', (id) => adminService.assignRole(id, bulkRole));
  };
  const onBulkRemoveRole = () => {
    if (!bulkRole) return toast.error('Select a role first');
    void runBulk('Remove role', (id) => adminService.removeRole(id, bulkRole));
  };
  const onBulkUpdateSubscription = () => {
    if (!bulkPlan || !bulkStatus) return toast.error('Pick a plan and status');
    void runBulk('Update subscription', (id) => adminService.updateSubscriptionPlan(id, bulkPlan, bulkStatus));
  };
  const onBulkDelete = () => {
    void runBulk('Delete users', (id) => adminService.deleteUserAccount(id));
  };

  // ---------- Single-user handlers ----------
  const handleRoleAction = async (userId: string, role: UserRole, action: 'assign' | 'remove') => {
    const success = action === 'assign'
      ? await handleAssignRole(userId, role)
      : await handleRemoveRole(userId, role);
    if (success) { setSelectedUserId(null); setSelectedRole(null); }
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
        {/* Bulk action toolbar */}
        {selectedIds.size > 0 && (
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 backdrop-blur">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>

            <div className="mx-2 h-5 w-px bg-border" />

            <Select value={bulkRole} onValueChange={(v) => setBulkRole(v as UserRole)}>
              <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="system_admin">System Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" disabled={bulkBusy || !bulkRole} onClick={onBulkAssignRole}>Assign role</Button>
            <Button size="sm" variant="outline" disabled={bulkBusy || !bulkRole} onClick={onBulkRemoveRole}>Remove role</Button>

            <div className="mx-2 h-5 w-px bg-border" />

            <Select value={bulkPlan} onValueChange={setBulkPlan}>
              <SelectTrigger className="h-8 w-[120px]"><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="h-8 w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" disabled={bulkBusy || !bulkPlan || !bulkStatus} onClick={onBulkUpdateSubscription}>
              Update subscription
            </Button>

            <div className="ml-auto flex items-center gap-2">
              {bulkBusy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" disabled={bulkBusy}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedIds.size} user{selectedIds.size === 1 ? '' : 's'}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes the selected accounts and all their associated data.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onBulkDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete {selectedIds.size}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                  onCheckedChange={(v) => toggleAll(!!v)}
                  aria-label="Select all"
                />
              </TableHead>
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
              const isSelected = selectedIds.has(user.userId);

              return (
                <TableRow
                  key={user.userId}
                  className={isSelected || selectedUserId === user.userId ? "bg-muted/50" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(v) => toggleOne(user.userId, !!v)}
                      aria-label={`Select ${user.email}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">{user.businessName || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant={getRoleBadgeVariant(role)} className="flex items-center gap-1 text-xs">
                          {getRoleIcon(role)}
                          {role === 'system_admin' ? 'System Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingUserId === user.userId ? (
                      <div className="flex gap-1 items-center">
                        <Select value={selectedPlan || ""} onValueChange={setSelectedPlan}>
                          <SelectTrigger className="w-24 h-7 text-xs"><SelectValue placeholder="Plan" /></SelectTrigger>
                          <SelectContent>
                            {PLAN_OPTIONS.map((p) => (
                              <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={selectedStatus || ""} onValueChange={setSelectedStatus}>
                          <SelectTrigger className="w-24 h-7 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                            ))}
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
                        <span className="text-sm text-muted-foreground cursor-help">{createdDate.display}</span>
                      </TooltipTrigger>
                      <TooltipContent><p>{createdDate.tooltip}</p></TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm text-muted-foreground cursor-help">{lastActiveDate.display}</span>
                      </TooltipTrigger>
                      <TooltipContent><p>{lastActiveDate.tooltip}</p></TooltipContent>
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

        {/* Single-user role management */}
        {selectedUserId && (
          <div className="border rounded-lg p-4 bg-muted/20">
            <h3 className="font-medium mb-3">Role Management</h3>
            <div className="flex gap-2 items-center">
              <Select value={selectedRole || ""} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_admin">System Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => selectedRole && handleRoleAction(selectedUserId, selectedRole, 'assign')} disabled={!selectedRole} size="sm">
                Assign Role
              </Button>
              <Button onClick={() => selectedRole && handleRoleAction(selectedUserId, selectedRole, 'remove')} disabled={!selectedRole} variant="outline" size="sm">
                Remove Role
              </Button>
            </div>
          </div>
        )}

        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No users found.</div>
        )}
      </div>
    </TooltipProvider>
  );
}
