
import { DocsViewer } from "@/components/documentation/DocsViewer";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

const Documentation = () => {
  const { docId = "onboarding" } = useParams<{ docId?: string }>();
  const navigate = useNavigate();
  const titleText = docId.charAt(0).toUpperCase() + docId.slice(1);

  useSEO({
    title: `${titleText} | OptiRFP Documentation`,
    description: `OptiRFP documentation — ${titleText.toLowerCase()} guide and reference.`,
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Documentation</h1>
      </div>
      <DocsViewer />
    </div>
  );
};

export default Documentation;
