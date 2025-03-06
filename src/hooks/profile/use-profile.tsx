
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { UseProfileReturn, ProfileData } from "./types";
import { useProfileOperations } from "./profile-operations";
import { hasProfileChanges } from "./profile-utils";

export function useProfile(): UseProfileReturn {
  const { session } = useAuth();
  const isComponentMountedRef = useRef(true);
  
  // Set up event listeners for network reconnection
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    const handleNetworkReconnect = () => {
      console.log("Network reconnected - retrying profile fetch if needed");
      if (operations.fetchError) {
        setTimeout(() => {
          if (isComponentMountedRef.current) {
            operations.handleRetryFetch();
          }
        }, 1000);
      }
    };

    window.addEventListener('networkReconnected', handleNetworkReconnect);
    
    return () => {
      isComponentMountedRef.current = false;
      window.removeEventListener('networkReconnected', handleNetworkReconnect);
    };
  }, []);

  const operations = useProfileOperations(
    session?.user?.id,
    session?.user?.email,
    isComponentMountedRef
  );
  
  const [hasChanges, setHasChanges] = useState(false);

  // Reset fetch attempts on new session
  useEffect(() => {
    if (session?.user?.id) {
      console.log("Session detected, initiating profile fetch");
      operations.fetchAttemptsRef.current = 0;
      operations.fetchProfile();
    } else {
      console.log("No session available, skipping profile fetch");
    }
  }, [session, operations]);

  // Track changes between profile data and initial values
  useEffect(() => {
    if (!operations.isLoadingProfile) {
      const changes = hasProfileChanges(operations.profileData, operations.initialValues);
      setHasChanges(changes);
      
      if (changes) {
        operations.setSaveSuccess(false);
      }
    }
  }, [operations.profileData, operations.isLoadingProfile, operations.initialValues]);

  return {
    profileData: operations.profileData,
    isLoadingProfile: operations.isLoadingProfile,
    fetchError: operations.fetchError,
    updateProfileData: operations.updateProfileData,
    saveProfile: operations.saveProfile,
    handleRetryFetch: operations.handleRetryFetch,
    initialValues: operations.initialValues,
    hasChanges,
    saveSuccess: operations.saveSuccess,
    isLoading: operations.isLoading,
    isFetching: operations.isFetching
  };
}
