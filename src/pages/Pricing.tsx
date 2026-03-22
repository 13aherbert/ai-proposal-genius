import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Redirects /pricing to the homepage pricing section.
 */
export default function PricingRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
    setTimeout(() => {
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [navigate]);

  return null;
}
