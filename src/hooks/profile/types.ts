
export interface ProfileData {
  username: string;
  first_name: string;
  last_name: string;
  business_name: string;
  birthday: string;
  industry?: string;
  organization_size?: string;
  use_case?: string;
  job_title?: string;
  onboarding_segment?: string;
}

export interface UseProfileReturn {
  profileData: ProfileData;
  isLoadingProfile: boolean;
  fetchError: string | null;
  updateProfileData: (field: keyof ProfileData, value: string) => void;
  saveProfile: () => Promise<boolean>;
  handleRetryFetch: () => void;
  initialValues: ProfileData;
  hasChanges: boolean;
  saveSuccess: boolean;
  isLoading: boolean;
  isFetching: boolean;
}
