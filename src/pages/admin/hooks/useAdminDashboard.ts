
import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/admin';
import { BetaInvitation, UserProfile, UserRole } from '@/services/admin/types';
import { toast } from 'sonner';

/**
 * Custom hook that manages state and operations for the Admin Dashboard
 */
export function useAdminDashboard() {
  // Authentication and permission state
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // User management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Beta invitation state
  const [invitations, setInvitations] = useState<BetaInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState<boolean>(false);

  /**
   * Check if current user has admin permissions
   */
  const checkAdminPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const isAdminResult = await adminService.isAdmin();
      
      if (!isAdminResult) {
        setError('You do not have admin permissions');
      }
      setIsAdmin(isAdminResult);
    } catch (e) {
      console.error('Error checking admin permission:', e);
      setError('Error checking permissions');
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load users from the API
   */
  const loadUsers = useCallback(async () => {
    try {
      if (!isAdmin) return;
      
      setIsLoadingUsers(true);
      const userData = await adminService.getAllUsers();
      setUsers(userData);
      console.log('Loaded users:', userData);
    } catch (e) {
      console.error('Error loading users:', e);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isAdmin]);

  /**
   * Load beta invitations from the API
   */
  const loadInvitations = useCallback(async () => {
    try {
      if (!isAdmin) return;
      
      setIsLoadingInvitations(true);
      const invitationData = await adminService.getBetaInvitations();
      setInvitations(invitationData);
      console.log('Loaded invitations:', invitationData);
    } catch (e) {
      console.error('Error loading invitations:', e);
      toast.error('Failed to load beta invitations');
    } finally {
      setIsLoadingInvitations(false);
    }
  }, [isAdmin]);

  /**
   * Start editing a user
   */
  const startEditingUser = useCallback((userId: string) => {
    setEditingUserId(userId);
    setSelectedUserId(userId);
    setSelectedRole(null);
    setSelectedPlan(null);
    setSelectedStatus(null);
  }, []);

  /**
   * Stop editing a user
   */
  const stopEditingUser = useCallback(() => {
    setEditingUserId(null);
    setSelectedRole(null);
    setSelectedPlan(null);
    setSelectedStatus(null);
  }, []);

  /**
   * Assign a role to a user
   */
  const handleAssignRole = useCallback(async (userId: string, role: UserRole) => {
    try {
      const success = await adminService.assignRole(userId, role);
      
      if (success) {
        await loadUsers();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error assigning role:', e);
      toast.error('Failed to assign role');
      return false;
    }
  }, [loadUsers]);

  /**
   * Remove a role from a user
   */
  const handleRemoveRole = useCallback(async (userId: string, role: UserRole) => {
    try {
      if (role === 'user') {
        toast.error('Cannot remove the basic user role');
        return false;
      }
      
      const success = await adminService.removeRole(userId, role);
      
      if (success) {
        await loadUsers();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error removing role:', e);
      toast.error('Failed to remove role');
      return false;
    }
  }, [loadUsers]);

  /**
   * Update a user's subscription
   */
  const handleUpdateSubscription = useCallback(async (userId: string, plan: string, status: string) => {
    try {
      const success = await adminService.updateSubscriptionPlan(userId, plan, status);
      
      if (success) {
        await loadUsers();
        setSelectedPlan(null);
        setSelectedStatus(null);
      }
    } catch (e) {
      console.error('Error updating subscription:', e);
      toast.error('Failed to update subscription');
    }
  }, [loadUsers]);

  // Initialize the dashboard
  useEffect(() => {
    checkAdminPermission();
  }, [checkAdminPermission]);

  // Load data when admin status changes
  useEffect(() => {
    if (isAdmin && !isLoading) {
      loadUsers();
      loadInvitations();
    }
  }, [isAdmin, isLoading, loadUsers, loadInvitations]);

  return {
    // Auth state
    isAdmin,
    isLoading,
    error,
    
    // User management
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
    
    // Beta invitations
    invitations,
    isLoadingInvitations,
    loadInvitations
  };
}
