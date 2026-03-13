import { useState, useCallback } from "react";
import { useSubscriptionFeatures, type FeatureName } from "./use-subscription-features";

const FEATURE_REQUIRED_PLAN: Partial<Record<FeatureName, string>> = {
  opportunity_search: "Growth",
  evaluation: "Business",
  api_access: "Business",
  team_collaboration: "Growth",
  design_studio: "Business",
  data_export: "Growth",
  white_labeling: "Enterprise",
  advanced_analytics: "Business",
  priority_support: "Business",
};

export function useFeatureGate(feature: FeatureName) {
  const { hasFeature, plan } = useSubscriptionFeatures();
  const [showModal, setShowModal] = useState(false);

  const isLocked = !hasFeature(feature);
  const requiredPlan = FEATURE_REQUIRED_PLAN[feature] || "Business";

  const showGate = useCallback(() => {
    setShowModal(true);
  }, []);

  const hideGate = useCallback(() => {
    setShowModal(false);
  }, []);

  return {
    isLocked,
    requiredPlan,
    showGate,
    hideGate,
    showModal,
    setShowModal,
    plan,
  };
}
