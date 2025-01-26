import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DashboardHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-white">
        Welcome to OptiRFP
      </h1>
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate("/upload-rfp")} className="bg-white text-brand-green border border-brand-green hover:bg-brand-green hover:text-white">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate("/account-settings")}
          className="bg-white text-brand-green border border-brand-green hover:bg-brand-green hover:text-white"
        >
          <Settings className="h-4 w-4 mr-2" />
          Account
        </Button>
      </div>
    </header>
  );
};