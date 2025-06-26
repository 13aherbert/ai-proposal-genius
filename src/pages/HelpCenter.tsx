
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SelfServiceHelp } from "@/components/solo-user/SelfServiceHelp";

export default function HelpCenter() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Help Center</h1>
      </div>
      
      <SelfServiceHelp />
    </div>
  );
}
