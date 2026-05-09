import { WhiteLabelDashboard } from '@/components/organization/WhiteLabelDashboard';
import { useSEO } from '@/hooks/use-seo';

export default function WhiteLabel() {
  useSEO({
    title: "White Label RFP Software — OptiRFP for Agencies",
    description: "Deliver branded RFP response services to your clients with OptiRFP's white label platform.",
  });
  return <WhiteLabelDashboard />;
}
