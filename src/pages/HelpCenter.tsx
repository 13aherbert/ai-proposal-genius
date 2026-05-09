import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SelfServiceHelp } from "@/components/solo-user/SelfServiceHelp";
import { useSEO } from "@/hooks/use-seo";

export default function HelpCenter() {
  const navigate = useNavigate();
  useSEO({
    title: "Help Center — OptiRFP Support & Documentation",
    description: "Find answers, guides, and step-by-step tutorials for using OptiRFP to win more RFPs.",
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Help Center</h1>
      </div>
      <SelfServiceHelp />
    </div>
  );
}
