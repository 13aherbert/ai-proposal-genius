
export type UserRole = 'admin' | 'beta_tester' | 'user';

export interface UserRoleState {
  isAdmin: boolean;
  isBetaTester: boolean;
  isUser: boolean;
  isCheckingRoles: boolean;
  roleCheckError: string | null;
  showAdminButton: boolean;
  showBetaBadge: boolean;
}

export interface UserRoleRefs {
  rolesInitialized: boolean;
  adminStatus: boolean;
  betaTesterStatus: boolean;
  userStatus: boolean;
  checkingInProgress: boolean;
  lastNetworkErrorTime: number | null;
  lastCheckedTime: number | null;
  lastForceCheckTime?: number | null; // New field to track force check timing separately
  forceUpdate: number;
  timeout: number | null;
}
