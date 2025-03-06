
import { Save, LogOut, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AccountActionButtonsProps {
  hasChanges: boolean;
  saveSuccess: boolean;
  isLoading: boolean;
  isLoadingProfile: boolean;
  handleSave: () => Promise<void>;
}

export function AccountActionButtons({
  hasChanges,
  saveSuccess,
  isLoading,
  isLoadingProfile,
  handleSave
}: AccountActionButtonsProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <Button 
        onClick={handleSave} 
        disabled={isLoading || isLoadingProfile || !hasChanges}
        className={`w-full sm:w-auto transition-all ${saveSuccess ? 'bg-green-600 hover:bg-green-700' : ''}`}
      >
        {saveSuccess ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Saved
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </>
        )}
      </Button>
      <Button 
        variant="destructive" 
        onClick={handleLogout}
        className="w-full sm:w-auto"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Log Out
      </Button>
    </div>
  );
}
