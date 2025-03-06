
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { withRetry, isNetworkError, getNetworkErrorMessage } from "@/utils/network";

interface ProfileData {
  username: string;
  first_name: string;
  last_name: string;
  business_name: string;
  birthday: string;
}

interface UseProfileReturn {
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

export function useProfile(): UseProfileReturn {
  const { session } = useAuth();
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
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const isFetchingRef = useRef(false);
  const fetchAttemptsRef = useRef(0);
  const isComponentMountedRef = useRef(true);

  // Listen for network reconnection events
  useEffect(() => {
    const handleNetworkReconnect = () => {
      console.log("Network reconnected - retrying profile fetch if needed");
      if (fetchError) {
        setTimeout(() => {
          if (isComponentMountedRef.current) {
            handleRetryFetch();
          }
        }, 1000);
      }
    };

    window.addEventListener('networkReconnected', handleNetworkReconnect);
    
    return () => {
      window.removeEventListener('networkReconnected', handleNetworkReconnect);
    };
  }, [fetchError]);

  useEffect(() => {
    isComponentMountedRef.current = true;
    
    return () => {
      isComponentMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (session?.user?.id && !isFetchingRef.current) {
      fetchProfile();
    }
  }, [session]);

  useEffect(() => {
    if (!isLoadingProfile) {
      const hasChanges = 
        profileData.username !== initialValues.username ||
        profileData.first_name !== initialValues.first_name ||
        profileData.last_name !== initialValues.last_name ||
        profileData.business_name !== initialValues.business_name ||
        profileData.birthday !== initialValues.birthday;
      
      setHasChanges(hasChanges);
      
      if (hasChanges) {
        setSaveSuccess(false);
      }
    }
  }, [profileData, isLoadingProfile, initialValues]);

  const updateProfileData = useCallback((field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleRetryFetch = useCallback(() => {
    if (!isFetchingRef.current) {
      console.log("Manually retrying profile fetch");
      fetchAttemptsRef.current = 0;
      setFetchError(null);
      fetchProfile();
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    if (isFetchingRef.current) return;
    
    if (fetchAttemptsRef.current >= 3) {
      console.log("Maximum retry attempts reached, giving up");
      toast.error("Couldn't load profile after multiple attempts", {
        description: "Please check your connection and try again later."
      });
      setFetchError("Maximum retry attempts reached. Please check your internet connection and try again.");
      setIsLoadingProfile(false);
      return;
    }
    
    try {
      setIsFetching(true);
      isFetchingRef.current = true;
      fetchAttemptsRef.current++;
      
      console.log(`Fetching profile data (attempt ${fetchAttemptsRef.current})`);
      
      const result = await withRetry(
        async () => {
          return await supabase
            .from('profiles')
            .select('username, first_name, last_name, business_name, birthday')
            .eq('profile_id', session.user.id)
            .maybeSingle();
        },
        2, // Reduce max retries
        3000 // Increase base delay
      );
      
      if (!isComponentMountedRef.current) return;
      
      if (result.error) {
        console.error('Error fetching profile:', result.error);
        const errorMessage = isNetworkError(result.error) 
          ? getNetworkErrorMessage(result.error) 
          : result.error.message;
        setFetchError(errorMessage);
        
        if (!isLoadingProfile) {
          toast.error("Error loading profile", {
            description: errorMessage
          });
        }
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
      } else {
        console.log("No profile found, creating one...");
        await createProfile();
      }
    } catch (error) {
      if (!isComponentMountedRef.current) return;
      
      console.error('Error fetching profile:', error);
      const errorMessage = isNetworkError(error) 
        ? getNetworkErrorMessage(error) 
        : "Please try refreshing the page.";
      
      setFetchError(errorMessage);
      
      if (!isLoadingProfile) {
        toast.error("Failed to load profile", {
          description: errorMessage
        });
      }
    } finally {
      if (isComponentMountedRef.current) {
        setIsLoadingProfile(false);
        setIsFetching(false);
        isFetchingRef.current = false;
      }
    }
  }, [session]);

  const createProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      console.log("Creating new profile for user:", session.user.id);
      const { error } = await supabase
        .from('profiles')
        .insert({
          profile_id: session.user.id,
          username: session.user.email,
          first_name: '',
          last_name: '',
          business_name: '',
          birthday: null
        });
      
      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }
      
      console.log("Profile created successfully");
      updateProfileData("username", session.user.email || "");
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error("Failed to create profile", {
        description: "Please try refreshing the page.",
      });
    }
  }, [session, updateProfileData]);

  const saveProfile = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) return false;
    
    setIsLoading(true);
    try {
      console.log("Updating profile with:", profileData);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          username: profileData.username || null,
          first_name: profileData.first_name || null,
          last_name: profileData.last_name || null,
          business_name: profileData.business_name || null,
          birthday: profileData.birthday || null
        })
        .eq('profile_id', session.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      setInitialValues({...profileData});
      setSaveSuccess(true);
      setHasChanges(false);
      
      toast.success("Profile updated successfully", {
        description: "Your account information has been saved.",
        duration: 3000,
      });
      
      setTimeout(() => {
        if (isComponentMountedRef.current) {
          setSaveSuccess(false);
        }
      }, 3000);
      
      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      const errorMessage = isNetworkError(error)
        ? getNetworkErrorMessage(error)
        : error.message || "Please try again later.";
      
      toast.error("Failed to update profile", {
        description: errorMessage,
      });
      return false;
    } finally {
      if (isComponentMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [profileData, session]);

  return {
    profileData,
    isLoadingProfile,
    fetchError,
    updateProfileData,
    saveProfile,
    handleRetryFetch,
    initialValues,
    hasChanges,
    saveSuccess,
    isLoading,
    isFetching
  };
}
