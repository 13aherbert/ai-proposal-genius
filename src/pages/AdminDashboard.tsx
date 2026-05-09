import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, FolderKanban, HardDrive, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { useAuth } from "@/components/AuthProvider";
import { formatDistanceToNow } from "date-fns";
import { useSEO } from "@/hooks/use-seo";

export default function AdminDashboard() {
  useSEO({ title: "Admin Dashboard — OptiRFP", description: "System administration overview for OptiRFP." });
  const { organization } = useCurrentOrganization();
  const { session } = useAuth();
  const { recentActivity, isLoading: activityLoading } = useRecentActivity(session?.user ?? null);
  const [stats, setStats] = useState({ users: 0, projects: 0, storage: "0 MB" });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!organization?.id) return;

    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const [membersRes, projectsRes] = await Promise.all([
          supabase
            .from("organization_members")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organization.id),
          supabase
            .from("projects")
            .select("project_id", { count: "exact", head: true })
            .eq("organization_id", organization.id),
        ]);

        setStats({
          users: membersRes.count ?? 0,
          projects: projectsRes.count ?? 0,
          storage: `${Math.floor(Math.random() * 500 + 50)} MB`, // Placeholder
        });
      } catch (e) {
        console.error("Error fetching admin stats:", e);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [organization?.id]);

  const statCards = [
    { title: "Total Users", value: stats.users, icon: Users, color: "text-primary" },
    { title: "Active Projects", value: stats.projects, icon: FolderKanban, color: "text-accent-foreground" },
    { title: "Storage Used", value: stats.storage, icon: HardDrive, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of {organization?.name || "your organization"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-muted p-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? "…" : stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {activity.type}{activity.isUpdate ? " (updated)" : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
