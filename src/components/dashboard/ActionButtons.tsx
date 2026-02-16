import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ActionButtonsProps = {
  isCheckingRoles: boolean;
  showAdminButton: boolean;
  roleCheckError: string | null;
};

export function ActionButtons({
  isCheckingRoles,
  showAdminButton,
  roleCheckError
}: ActionButtonsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {showAdminButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin')}
        >
          <Shield className="h-4 w-4 mr-2" />
          Admin Dashboard
        </Button>
      )}

      {roleCheckError && !isCheckingRoles && (
        <Badge variant="destructive" className="py-1.5 px-2.5 text-xs">
          <AlertCircle className="h-3.5 w-3.5 mr-1" />
          {roleCheckError}
        </Badge>
      )}
    </div>
  );
}
