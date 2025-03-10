
import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/admin';
import { UserProfile, UserRole, BetaInvitation } from '@/services/admin/types';
import { useUserRoles } from '@/hooks/user-roles';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function useAdminDashboard() {
  // Role checks
  const { isAdmin: userRolesAdmin, forceRoleCheck } = useUserRoles();
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // User management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Beta invitations state
  const [invitations, setInvitations] = useState<BetaInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  
  // Check admin status using multiple methods for reliability
  const checkAdminStatus = useCallback(async () => {
    try {
      console.log("useAdminDashboard - Checking admin status");
      
      // Method 1: Use userRoles hook value
      const fromUserRolesHook = userRolesAdmin;
      console.log("Admin status from userRoles hook:", fromUserRolesHook);
      
      // Method 2: Direct RPC call (most reliable)
      const { data: rpcResult, error: rpcError } = await supabase.rpc('is_admin');
      console.log("Admin status from direct RPC:", { result: rpcResult, error: rpcError });
      
      // Method 3: Admin service method
      const fromAdminService = await adminService.isAdmin();
      console.log("Admin status from adminService:", fromAdminService);
      
      // Use the most reliable result (direct RPC)
      const isAdminUser = !!rpcResult;
      
      setIsAdmin(isAdminUser);
      return isAdminUser;
    } catch (err) {
      console.error('Error checking admin status:', err);
      return false;
    }
  }, [userRolesAdmin]);
  
  // Load user data on initial render
  useEffect(() => {
    const initialize = async () => {
      try {
        // First check if the user has admin role
        const adminCheck = await checkAdminStatus();
        console.log("Initial admin check result:", adminCheck);
        
        if (!adminCheck) {
          setIsLoading(false);
          return;
        }
        
        // Load initial data
        await loadUsers();
        await loadInvitations();
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing admin dashboard:', err);
        setError('Failed to load admin dashboard. Please try again later.');
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);
  
  // Re-check admin status when userRolesAdmin changes
  useEffect(() => {
    if (!isLoading) {
      checkAdminStatus();
    }
  }, [userRolesAdmin, isLoading, checkAdminStatus]);
  
  // Load users data
  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const usersList = await adminService.getAllUsers();
      setUsers(usersList);
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);
  
  // Load beta invitations data
  const loadInvitations = useCallback(async () => {
    setIsLoadingInvitations(true);
    try {
      const invitationsList = await adminService.getBetaInvitations();
      setInvitations(invitationsList);
    } catch (err) {
      console.error('Error loading invitations:', err);
      toast.error('Failed to load beta invitations');
    } finally {
      setIsLoadingInvitations(false);
    }
  }, []);
  
  // Handle user editing
  const startEditingUser = useCallback((userId: string) => {
    setEditingUserId(userId);
  }, []);
  
  const stopEditingUser = useCallback(() => {
    setEditingUserId(null);
    setSelectedRole(null);
    setSelectedPlan(null);
    setSelectedStatus(null);
  }, []);
  
  // Role management handlers
  const handleAssignRole = useCallback(async (userId: string, role: UserRole) => {
    try {
      const success = await adminService.assignRole(userId, role);
      if (success) {
        await loadUsers();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error assigning role:', err);
      toast.error('Failed to assign role');
      return false;
    }
  }, [loadUsers]);
  
  const handleRemoveRole = useCallback(async (userId: string, role: UserRole) => {
    try {
      const success = await adminService.removeRole(userId, role);
      if (success) {
        await loadUsers();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error removing role:', err);
      toast.error('Failed to remove role');
      return false;
    }
  }, [loadUsers]);
  
  // Subscription management handler
  const handleUpdateSubscription = useCallback(async (userId: string, plan: string, status: string) => {
    try {
      const success = await adminService.updateSubscriptionPlan(userId, plan, status);
      if (success) {
        await loadUsers();
      }
    } catch (err) {
      console.error('Error updating subscription:', err);
      toast.error('Failed to update subscription');
    }
  }, [loadUsers]);
  
  // Delete user handler
  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      const success = await adminService.deleteUserAccount(userId);
      if (success) {
        toast.success('User account deleted successfully');
        await loadUsers();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user account');
    }
  }, [loadUsers]);
  
  return {
    isAdmin,
    isLoading,
    error,
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
    handleDeleteUser,
    loadUsers,
    invitations,
    isLoadingInvitations,
    loadInvitations,
    checkAdminStatus
  };
}

export default useAdminDashboard;
