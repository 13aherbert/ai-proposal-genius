
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
  forceUpdate: number;
  timeout: number | null;
}
