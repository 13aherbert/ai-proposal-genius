
import { useUserRoles } from "./user-roles";

// Create a function to access user roles directly from localStorage
export const getUserRolesFromStorage = () => {
  try {
    const storedRoles = localStorage.getItem('userRoles');
    if (storedRoles) {
      return JSON.parse(storedRoles);
    }
  } catch (error) {
    console.error("Error reading user roles from localStorage:", error);
  }
  return null;
};

// Enhances the useUserRoles hook with local storage support
const useUserRolesWithFallback = () => {
  const userRolesData = useUserRoles();
  
  // Add the local storage helper to the returned hook
  return {
    ...userRolesData,
    getStoredRoles: getUserRolesFromStorage
  };
};

// Re-export the hook as both named and default export
export { useUserRolesWithFallback as useUserRoles };
export default useUserRolesWithFallback;
