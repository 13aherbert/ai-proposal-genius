import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DashboardHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h1 className="text-2xl md:text-3xl font-bold text-white">
        Welcome to OptiRFP
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