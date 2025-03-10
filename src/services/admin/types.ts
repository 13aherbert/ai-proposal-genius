
export type UserRole = 'user' | 'admin' | 'beta_tester';

export type UserRoleRecord = {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  created_by: string | null;
  email?: string | null;
};

export type UserProfile = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
  roles: UserRole[];
  subscription: {
    plan: string;
    status: string;
  } | null;
  createdAt: string;
  lastSignIn: string | null;
};

export type BetaInvitation = {
  id: string;
  email: string;
  invite_code: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'canceled';
  created_at: string;
  accepted_at: string | null;
  expires_at: string;
  invitation_email_sent: boolean;
};
