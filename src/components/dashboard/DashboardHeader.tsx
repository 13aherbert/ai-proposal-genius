
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";

export const DashboardHeader = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  // Get the user's first name from metadata
  const firstName = session?.user?.user_metadata?.first_name || "";

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h1 className="text-2xl md:text-3xl font-bold text-white">
        Welcome to OptiRFP{firstName ? `, ${firstName}` : ""}
      </h1>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={() => navigate("/upload-rfp")} 
          className="w-full sm:w-auto bg-white text-brand-green border border-brand-green hover:bg-brand-green hover:text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate("/account-settings")}
          className="w-full sm:w-auto bg-white text-brand-green border border-brand-green hover:bg-brand-green hover:text-white"
        >
          <Settings className="h-4 w-4 mr-2" />
          Account
        </Button>
      </div>
    </header>
  );
};
