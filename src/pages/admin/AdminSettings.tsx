import { OrganizationSettings } from "@/components/organization/OrganizationSettings";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const handleDeleteOrg = () => {
    toast.info("Organization deletion is handled through support. Please contact support@optirfp.ai");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization's configuration.</p>
      </div>

      <OrganizationSettings />

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your entire organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Delete Organization</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this organization and all its data.
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteOrg}>
              Delete Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
