
import { useState, useEffect, useCallback } from 'react';
import { adminService, UserProfile, UserRole, BetaInvitation } from "@/services/admin";
import { toast } from "sonner";

/**
 * Custom hook to manage admin dashboard state and operations
 */
export function useAdminDashboard() {
  // Authentication and loading states
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User management states
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('beta_tester');
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  
  // Beta invitation states
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [invitations, setInvitations] = useState<BetaInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');

  /**
   * Load user list from the API
   */
  const loadUsers = useCallback(async () => {
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
  }, []);

  /**
   * Load beta invitations from the API
   */
  const loadInvitations = useCallback(async () => {
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
  }, []);

  /**
   * Initial load to check admin status and load data
   */
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
          await Promise.all([loadUsers(), loadInvitations()]);
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        setError('Failed to verify admin access. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminAccess();
  }, [loadUsers, loadInvitations]);

  /**
   * Assign a role to the selected user
   */
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

  /**
   * Remove a role from a user
   */
  const handleRemoveRole = async (userId: string, role: UserRole) => {
    const success = await adminService.removeRole(userId, role);
    if (success) {
      await loadUsers();
    }
  };

  /**
   * Update a user's subscription plan
   */
  const handleUpdateSubscription = async () => {
    if (!selectedUserId || !selectedPlan) {
      toast.error("Please select a user and plan");
      return;
    }
    const success = await adminService.updateSubscriptionPlan(selectedUserId, selectedPlan, selectedStatus);
    if (success) {
      await loadUsers();
    }
  };

  /**
   * Handle dialog close with optional refresh
   */
  const handleDialogClose = async (refresh: boolean = false) => {
    setDialogOpen(false);
    if (refresh) {
      await loadUsers();
    }
  };

  return {
    // Authentication and loading states
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
    dialogOpen,
    setDialogOpen,
    handleAssignRole,
    handleRemoveRole,
    handleUpdateSubscription,
    loadUsers,
    
    // Beta invitations
    invitations,
    isLoadingInvitations,
    loadInvitations,
    inviteEmail,
    setInviteEmail,
    
    // Dialog handling
    handleDialogClose
  };
}
