
import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const getMatches = (query: string): boolean => {
    // Prevent SSR issues
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  useEffect(() => {
    const matchMedia = window.matchMedia(query);
    
    // Handle change
    const handleChange = () => {
      setMatches(matchMedia.matches);
    };
    
    // Set up event listener
    matchMedia.addEventListener("change", handleChange);
    
    // Check on mount (in case matches is false to start)
    handleChange();
    
    // Clean up
    return () => {
      matchMedia.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
