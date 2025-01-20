import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Project = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  rfp_file_path: string;
};

const RecentProjects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        throw new Error("No authenticated user");
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching projects",
          description: error.message,
        });
        throw error;
      }

      return data as Project[];
    },
    enabled: !!session?.user?.id, // Only run query when we have a user ID
  });

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold">Recent Projects</h1>
            </div>
            <Button onClick={() => navigate("/upload-rfp")}>New Project</Button>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>
                View and manage your RFP projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading projects...</div>
              ) : !projects?.length ? (
                <div className="text-center py-4 text-muted-foreground">
                  No projects found. Create your first project by clicking "New
                  Project" above.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {project.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  project.status === "draft"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                              />
                              {project.status}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(
                                new Date(project.created_at),
                                "MMM d, yyyy"
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                // TODO: Implement project details view
                                toast({
                                  title: "Coming soon",
                                  description:
                                    "Project details view will be implemented soon.",
                                });
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecentProjects;