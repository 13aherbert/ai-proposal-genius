
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { withRetry, isNetworkError, getNetworkErrorMessage } from "@/utils/network-utils";

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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const isFetchingRef = useRef(false);
  const fetchAttemptsRef = useRef(0);

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

  const updateProfileData = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchProfile = async () => {
    if (!session?.user?.id) return;
    if (isFetchingRef.current) return;
    
    if (fetchAttemptsRef.current >= 3) {
      toast.error("Couldn't load profile after multiple attempts", {
        description: "Please check your connection and try again later."
      });
      setFetchError("Maximum retry attempts reached");
      setIsLoadingProfile(false);
      return;
    }
    
    try {
      setIsLoadingProfile(true);
      setFetchError(null);
      isFetchingRef.current = true;
      fetchAttemptsRef.current++;
      
      const result = await withRetry(
        async () => {
          return await supabase
            .from('profiles')
            .select('username, first_name, last_name, business_name, birthday')
            .eq('profile_id', session.user.id)
            .maybeSingle();
        },
        1,
        3000
      );
      
      if (result.error) {
        console.error('Error fetching profile:', result.error);
        const errorMessage = isNetworkError(result.error) ? getNetworkErrorMessage(result.error) : result.error.message;
        setFetchError(errorMessage);
        toast.error("Error loading profile", {
          description: errorMessage
        });
        return;
      }
      
      if (result.data) {
        const profileData = {
          username: result.data.username || "",
          first_name: result.data.first_name || "",
          last_name: result.data.last_name || "",
          business_name: result.data.business_name || "",
          birthday: result.data.birthday || ""
        };
        
        setProfileData(profileData);
        setInitialValues(profileData);
      } else {
        console.log("No profile found, creating one...");
        await createProfile();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      const errorMessage = isNetworkError(error) ? getNetworkErrorMessage(error) : "Please try refreshing the page.";
      setFetchError(errorMessage);
      toast.error("Failed to load profile", {
        description: errorMessage
      });
    } finally {
      setIsLoadingProfile(false);
      isFetchingRef.current = false;
      
      if (fetchError && fetchError.includes("Network error") && fetchAttemptsRef.current < 3) {
        setTimeout(() => {
          if (session?.user?.id) fetchProfile();
        }, 10000);
      }
    }
  };

  const createProfile = async () => {
    if (!session?.user?.id) return;
    
    try {
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
  };

  const saveProfile = async (): Promise<boolean> => {
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
        setSaveSuccess(false);
      }, 3000);
      
      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile", {
        description: error.message || "Please try again later.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryFetch = () => {
    if (!isFetchingRef.current) {
      fetchAttemptsRef.current = 0;
      fetchProfile();
    }
  };

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
    isLoading
  };
}
