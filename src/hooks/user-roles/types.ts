
export type UserRole = 'admin' | 'user' | 'system_admin';

export interface UserRoleState {
  isAdmin: boolean;
  isUser: boolean;
  isCheckingRoles: boolean;
  roleCheckError: string | null;
  showAdminButton: boolean;
}

export interface UserRoleRefs {
  rolesInitialized: boolean;
  adminStatus: boolean;
  userStatus: boolean;
  checkingInProgress: boolean;
  lastNetworkErrorTime: number | null;
  lastCheckedTime: number | null;
  lastForceCheckTime?: number | null;
  forceUpdate: number;
  timeout: number | null;
}
