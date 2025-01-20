import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, FolderOpen, BookOpen, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              Welcome to OptiRFP
            </h1>
            <Button onClick={() => navigate("/upload-rfp")} className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              className="bg-secondary/50 backdrop-blur-sm hover:bg-secondary/60 transition-colors cursor-pointer"
              onClick={() => navigate("/upload-rfp")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="h-5 w-5" />
                  Upload RFP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload a new RFP document to start a new project with AI assistance
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary/50 backdrop-blur-sm hover:bg-secondary/60 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Recent Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access and manage your existing RFP response projects
                </p>
              </CardContent>
            </Card>

            <Card 
              className="bg-secondary/50 backdrop-blur-sm hover:bg-secondary/60 transition-colors cursor-pointer"
              onClick={() => navigate("/knowledge-base")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Manage your business knowledge base for AI-powered responses
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
            <Card className="bg-secondary/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">
                  No recent activity to display
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;