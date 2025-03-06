
export interface ProfileData {
  username: string;
  first_name: string;
  last_name: string;
  business_name: string;
  birthday: string;
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
