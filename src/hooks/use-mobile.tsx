
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : undefined
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Use a more efficient event listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Modern browsers: use the newer API
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleResize);
    } else {
      // Fallback for older browsers
      window.addEventListener("resize", handleResize);
    }
    
    // Set initial value
    handleResize();
    
    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", handleResize);
      } else {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return !!isMobile;
}
