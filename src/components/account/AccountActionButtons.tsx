
import { Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="flex justify-start">
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
    </div>
  );
}
