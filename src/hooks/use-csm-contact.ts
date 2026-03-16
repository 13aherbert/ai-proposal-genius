import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { useSubscription } from "@/hooks/use-subscription";
import { normalizePlanType } from "@/hooks/subscription/feature-access";

interface CSMContact {
  name: string;
  email: string;
  calendlyUrl: string;
  phone: string | null;
}

const DEFAULTS: CSMContact = {
  name: "Your OptiRFP CSM",
  email: "csm@optirfp.ai",
  calendlyUrl: "https://calendly.com/optirfp-enterprise",
  phone: null,
};

export function useCSMContact() {
  const { organization, loading: orgLoading } = useCurrentOrganization();
  const { data: subscriptionData } = useSubscription();
  const planType = normalizePlanType(subscriptionData?.plan_type);

  const isEnterprise =
    planType === "enterprise" ||
    organization?.subscription_tier === "enterprise";

  const csm: CSMContact = {
    name: (organization as any)?.csm_name || DEFAULTS.name,
    email: (organization as any)?.csm_email || DEFAULTS.email,
    calendlyUrl: (organization as any)?.csm_calendly_url || DEFAULTS.calendlyUrl,
    phone: (organization as any)?.csm_phone || DEFAULTS.phone,
  };

  return {
    csm,
    isEnterprise,
    loading: orgLoading,
  };
}
