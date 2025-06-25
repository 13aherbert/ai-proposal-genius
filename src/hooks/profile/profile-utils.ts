
import { supabase } from "@/integrations/supabase/client";
import { ProfileData } from "./types";
import { withRetry } from "@/utils/network";
import { isNetworkError, getNetworkErrorMessage } from "@/utils/network/error-detection";
import { toast } from "sonner";

/**
 * Fetches a user's profile data from Supabase
 */
export const fetchProfileFromSupabase = async (userId: string) => {
  console.log("Executing Supabase query to fetch profile");
  return await supabase
    .from('profiles')
    .select('username, first_name, last_name, business_name, birthday, industry')
    .eq('profile_id', userId)
    .maybeSingle();
};

/**
 * Creates a new profile for a user in Supabase
 */
export const createProfileInSupabase = async (userId: string, email: string | undefined) => {
  console.log("Creating new profile for user:", userId);
  const { error, data } = await supabase
    .from('profiles')
    .insert({
      profile_id: userId,
      username: email,
      first_name: '',
      last_name: '',
      business_name: '',
      birthday: null,
      industry: null
    });
  
  console.log("Profile creation result:", { error, data });
  
  if (error) {
    console.error('Error creating profile:', error);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('Error details:', error.details);
    throw error;
  }
  
  console.log("Profile created successfully");
  return {
    username: email || "",
    first_name: "",
    last_name: "",
    business_name: "",
    birthday: "",
    industry: ""
  };
};

/**
 * Updates a user's profile in Supabase
 */
export const updateProfileInSupabase = async (userId: string, profileData: ProfileData) => {
  console.log("Updating profile with:", profileData);
  
  const { error, data } = await supabase
    .from('profiles')
    .update({ 
      username: profileData.username || null,
      first_name: profileData.first_name || null,
      last_name: profileData.last_name || null,
      business_name: profileData.business_name || null,
      birthday: profileData.birthday || null,
      industry: profileData.industry as any || null
    })
    .eq('profile_id', userId);

  console.log("Profile update result:", { error, data });
  
  if (error) {
    console.error('Error updating profile:', error);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('Error details:', error.details);
    throw error;
  }
  
  return true;
};

/**
 * Handles profile fetch errors and returns appropriate error messages
 */
export const handleProfileError = (error: any, isLoadingProfile: boolean, profileData?: ProfileData) => {
  console.error('Error fetching/updating profile:', error);
  
  // Log detailed error information for debugging
  if (error instanceof Error) {
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
  }
  console.log('Is network error?', isNetworkError(error));
  
  // Determine if we should show an error message
  const shouldShowErrorMessage = !profileData || !profileData.username;
  
  if (shouldShowErrorMessage) {
    const errorMessage = isNetworkError(error) 
      ? getNetworkErrorMessage(error) 
      : error?.message || "Please try refreshing the page.";
    
    if (!isLoadingProfile) {
      toast.error("Failed to load profile", {
        description: errorMessage
      });
    }
    
    return errorMessage;
  }
  
  return null;
};

/**
 * Utility function to determine if profile data has changed
 */
export const hasProfileChanges = (profileData: ProfileData, initialValues: ProfileData): boolean => {
  return (
    profileData.username !== initialValues.username ||
    profileData.first_name !== initialValues.first_name ||
    profileData.last_name !== initialValues.last_name ||
    profileData.business_name !== initialValues.business_name ||
    profileData.birthday !== initialValues.birthday
  );
};
