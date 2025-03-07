
import { 
  getBetaInvitations, 
  createBetaInvitation, 
  cancelBetaInvitation, 
  verifyBetaInvitation,
  acceptBetaInvitation,
  resendInvitationEmail
} from './betaService';

import {
  getUsers,
  getUserRoles,
  assignUserRole,
  removeUserRole
} from './userService';

export const adminService = {
  // Beta invitation methods
  getBetaInvitations,
  createBetaInvitation,
  cancelBetaInvitation,
  verifyBetaInvitation,
  acceptBetaInvitation,
  resendInvitationEmail,
  
  // User management methods
  getUsers,
  getUserRoles,
  assignUserRole,
  removeUserRole
};
