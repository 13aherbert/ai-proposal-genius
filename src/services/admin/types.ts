
// User role types
export type UserRole = 'admin' | 'beta_tester' | 'user' | 'system_admin';

// Beta invitation interface
export interface BetaInvitation {
  id: string;
  email: string;
  invite_code: string;
  status: 'pending' | 'accepted' | 'expired' | 'canceled';
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  invited_by: string;
  invitation_email_sent: boolean;
  updated_at?: string;
}

// User profile interface for admin management
export interface UserProfile {
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
  lastActivityAt: string | null;
}

// User role record interface
export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  created_by: string;
  email?: string | null;
}

// Extended user profile with organization details
export interface UserProfileWithOrganizations extends UserProfile {
  organizations: Array<{
    id: string;
    name: string;
    role: string;
    joined_at: string;
  }>;
  projectCount: number;
  knowledgeEntriesCount: number;
  industry?: string;
  organizationSize?: string;
  useCase?: string;
  jobTitle?: string;
}
