import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Lightbulb } from "lucide-react";

const SEEN_KEY_PREFIX = "optirfp_feature_tip_seen_";
const SESSION_TIP_KEY = "optirfp_session_tip_shown";

interface FeatureDiscoveryTooltipProps {
  featureId: string;
  message: string;
  learnMoreLabel?: string;
  position?: "top" | "bottom";
  children: React.ReactNode;
}

export function FeatureDiscoveryTooltip({
  featureId,
  message,
  learnMoreLabel = "Learn more →",
  position = "bottom",
  children,
}: FeatureDiscoveryTooltipProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadySeen = localStorage.getItem(SEEN_KEY_PREFIX + featureId);
    const sessionTipShown = sessionStorage.getItem(SESSION_TIP_KEY);
    if (!alreadySeen && !sessionTipShown) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [featureId]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(SEEN_KEY_PREFIX + featureId, "true");
    sessionStorage.setItem(SESSION_TIP_KEY, "true");
  };

  return (
    <div className="relative">
      {children}
      {visible && (
        <div
          className={`absolute z-50 left-0 right-0 ${
            position === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
          }`}
        >
          <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-foreground">{message}</p>
                <button
                  onClick={() => {
                    dismiss();
                    navigate("/subscription");
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {learnMoreLabel}
                </button>
              </div>
              <button
                onClick={dismiss}
                className="p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss tip"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
