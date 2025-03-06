import { useState, useCallback, useRef, useEffect } from "react";
import { ProfileData } from "./types";
import { 
  fetchProfileFromSupabase, 
  createProfileInSupabase,
  updateProfileInSupabase,
  handleProfileError
} from "./profile-utils";
import { toast } from "sonner";
import { withRetry } from "@/utils/network";

export const useProfileOperations = (
  userId: string | undefined,
  userEmail: string | undefined,
  isComponentMounted: React.MutableRefObject<boolean>
) => {
  const [profileData, setProfileData] = useState<ProfileData>({
    username: "",
    first_name: "",
    last_name: "",
    business_name: "",
    birthday: ""
  });
  const [initialValues, setInitialValues] = useState<ProfileData>({
    username: "",
    first_name: "",
    last_name: "",
    business_name: "",
    birthday: ""
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const isFetchingRef = useRef(false);
  const fetchAttemptsRef = useRef(0);
  const lastSuccessfulFetchRef = useRef<Date | null>(null);

  const updateProfileData = useCallback((field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const createProfile = useCallback(async () => {
    if (!userId) {
      console.log("No user session available for profile creation");
      return;
    }
    
    try {
      const newProfile = await createProfileInSupabase(userId, userEmail);
      updateProfileData("username", userEmail || "");
      lastSuccessfulFetchRef.current = new Date();
      return newProfile;
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error("Failed to create profile", {
        description: "Please try refreshing the page.",
      });
      throw error;
    }
  }, [userId, userEmail, updateProfileData]);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      console.log("No user session available for profile fetch");
      return;
    }
    if (isFetchingRef.current) {
      console.log("Profile fetch already in progress, skipping");
      return;
    }
    
    if (lastSuccessfulFetchRef.current && (new Date().getTime() - lastSuccessfulFetchRef.current.getTime() < 10000)) {
      console.log("Successful fetch was recent, skipping redundant fetch");
      setIsLoadingProfile(false);
      setFetchError(null);
      return;
    }
    
    if (fetchAttemptsRef.current >= 3) {
      console.log("Maximum retry attempts reached, giving up");
      if (!profileData.username) {
        toast.error("Couldn't load profile after multiple attempts", {
          description: "Please check your connection and try again later."
        });
      } else {
        console.log("Profile data already loaded, not showing error toast");
        setFetchError(null);
      }
      setIsLoadingProfile(false);
      return;
    }
    
    try {
      setIsFetching(true);
      isFetchingRef.current = true;
      fetchAttemptsRef.current++;
      
      console.log(`Fetching profile data (attempt ${fetchAttemptsRef.current}) for user ID: ${userId}`);
      
      const result = await withRetry(
        async () => fetchProfileFromSupabase(userId),
        2,
        3000
      );
      
      if (!isComponentMounted.current) {
        console.log("Component unmounted during fetch, abandoning");
        return;
      }
      
      console.log("Profile fetch result:", result);
      
      if (result.error) {
        console.error('Error fetching profile:', result.error);
        console.log('Error code:', result.error.code);
        console.log('Error message:', result.error.message);
        console.log('Error details:', result.error.details);
        
        const errorMessage = handleProfileError(result.error, isLoadingProfile);
        setFetchError(errorMessage);
        return;
      }
      
      if (result.data) {
        console.log("Profile data loaded successfully:", result.data);
        const profileData = {
          username: result.data.username || "",
          first_name: result.data.first_name || "",
          last_name: result.data.last_name || "",
          business_name: result.data.business_name || "",
          birthday: result.data.birthday || ""
        };
        
        setProfileData(profileData);
        setInitialValues(profileData);
        setFetchError(null);
        lastSuccessfulFetchRef.current = new Date();
      } else {
        console.log("No profile found, creating one...");
        await createProfile();
      }
    } catch (error) {
      if (!isComponentMounted.current) {
        console.log("Component unmounted during fetch error handling, abandoning");
        return;
      }
      
      const errorMessage = handleProfileError(error, isLoadingProfile, profileData);
      setFetchError(errorMessage);
    } finally {
      if (isComponentMounted.current) {
        setIsLoadingProfile(false);
        setIsFetching(false);
        isFetchingRef.current = false;
        console.log("Profile fetch operation completed");
      }
    }
  }, [userId, profileData, isLoadingProfile, createProfile, isComponentMounted]);

  const saveProfile = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      console.log("No user session available for profile save");
      return false;
    }
    
    setIsLoading(true);
    try {
      await updateProfileInSupabase(userId, profileData);

      setInitialValues({...profileData});
      setSaveSuccess(true);
      lastSuccessfulFetchRef.current = new Date();
      
      toast.success("Profile updated successfully", {
        description: "Your account information has been saved.",
        duration: 3000,
      });
      
      setTimeout(() => {
        if (isComponentMounted.current) {
          setSaveSuccess(false);
        }
      }, 3000);
      
      return true;
    } catch (error: any) {
      handleProfileError(error, false);
      return false;
    } finally {
      if (isComponentMounted.current) {
        setIsLoading(false);
        console.log("Profile save operation completed");
      }
    }
  }, [profileData, userId, isComponentMounted]);

  const handleRetryFetch = useCallback(() => {
    if (!isFetchingRef.current) {
      console.log("Manually retrying profile fetch");
      fetchAttemptsRef.current = 0;
      setFetchError(null);
      fetchProfile();
    } else {
      console.log("Fetch already in progress, not retrying");
    }
  }, [fetchProfile]);

  return {
    profileData,
    setProfileData,
    initialValues,
    setInitialValues,
    isLoadingProfile,
    setIsLoadingProfile,
    isLoading,
    isFetching,
    fetchError,
    setFetchError,
    saveSuccess,
    setSaveSuccess,
    updateProfileData,
    fetchProfile,
    saveProfile,
    handleRetryFetch,
    fetchAttemptsRef
  };
};
