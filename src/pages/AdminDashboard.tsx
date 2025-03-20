import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-7xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            Manage your application and users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and roles</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => navigate("/admin/users")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  User Accounts
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Beta Program</CardTitle>
                <CardDescription>Manage beta program users and requests</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  className="justify-start" 
                  onClick={() => navigate("/admin/beta-invitations")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Beta Invitations
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start" 
                  onClick={() => navigate("/admin/beta-requests")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Beta Requests
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
