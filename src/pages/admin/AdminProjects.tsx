import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Search, Trash2, Archive, ArrowRightLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface OrgProject {
  project_id: string;
  title: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  client_name: string | null;
}

export default function AdminProjects() {
  const { organization } = useCurrentOrganization();
  const [projects, setProjects] = useState<OrgProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProjects = async () => {
    if (!organization?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("project_id, title, status, user_id, created_at, updated_at, client_name")
      .eq("organization_id", organization.id)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);
      toast.error("Failed to load projects");
    } else {
      setProjects(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [organization?.id]);

  const handleArchive = async (projectId: string) => {
    const { error } = await supabase
      .from("projects")
      .update({ status: "archived" })
      .eq("project_id", projectId);
    if (error) toast.error("Failed to archive project");
    else {
      toast.success("Project archived");
      fetchProjects();
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("project_id", projectId);
    if (error) toast.error("Failed to delete project");
    else {
      toast.success("Project deleted");
      fetchProjects();
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.client_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "draft": return "secondary";
      case "archived": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project Management</h1>
        <p className="text-muted-foreground">All projects across your organization.</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No projects found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((project) => (
                  <TableRow key={project.project_id}>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>{project.client_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Archive"
                          onClick={() => handleArchive(project.project_id)}
                          disabled={project.status === "archived"}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          onClick={() => handleDelete(project.project_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
