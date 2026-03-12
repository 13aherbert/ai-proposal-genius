import { useEffect } from "react";

/**
 * Redirects /pricing to the homepage pricing section.
 */
export default function PricingRedirect() {
  useEffect(() => {
    window.location.replace("/#pricing");
  }, []);
  return null;
}
