import { OrganizationDashboard } from "@/components/organization/OrganizationDashboard";
import { useSEO } from "@/hooks/use-seo";

export default function Organization() {
  useSEO({ title: "Organization — OptiRFP", description: "Manage your OptiRFP organization, members, and settings." });
  return <OrganizationDashboard />;
}
