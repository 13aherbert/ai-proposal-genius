
export interface UserRoleState {
  isAdmin: boolean;
  isBetaTester: boolean;
  isUser: boolean;
  isDeveloper: boolean;
  isCheckingRoles: boolean;
  roleCheckError: string | null;
  showAdminButton: boolean;
  showBetaBadge: boolean;
  showDeveloperTools: boolean;
}

export interface UserRoleRefs {
  rolesInitialized: boolean;
  adminStatus: boolean;
  betaTesterStatus: boolean;
  userStatus: boolean;
  developerStatus: boolean;
  checkingInProgress: boolean;
  lastNetworkErrorTime: number | null;
  forceUpdate: number;
  timeout: number | null;
}
