import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSEO } from "@/hooks/use-seo";
import { formatDistanceToNow } from "date-fns";

type Submission = {
  id: string;
  ticket_id: string;
  type: string;
  severity: string;
  status: string;
  name: string | null;
  email: string | null;
  company: string | null;
  message: string;
  related_error_message: string | null;
  created_at: string;
};

const STATUSES = ["open", "in_progress", "resolved"] as const;

export default function AdminSupport() {
  useSEO({
    noindex: true, title: "Support Inbox — Admin", description: "Triage user feedback and support tickets." });
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("open");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_feedback_submissions" as any)
      .select("*")
      .eq("status", statusFilter)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error(error.message);
    } else {
      setItems((data ?? []) as unknown as Submission[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("user_feedback_submissions" as any)
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked as ${status.replace("_", " ")}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support inbox</h1>
          <p className="text-sm text-muted-foreground">User feedback, bug reports, and contact form messages.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s.replace("_", " ")}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nothing here. Inbox zero.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card key={it.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{it.ticket_id}</span>
                      <Badge variant="outline" className="capitalize">{it.type}</Badge>
                      <Badge variant={it.severity === "high" ? "destructive" : "secondary"} className="capitalize">
                        {it.severity}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {it.name || "Anonymous"}{it.email ? ` <${it.email}>` : ""}{it.company ? ` · ${it.company}` : ""}
                      {" · "}
                      {formatDistanceToNow(new Date(it.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {it.status !== "in_progress" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(it.id, "in_progress")}>
                        In progress
                      </Button>
                    )}
                    {it.status !== "resolved" && (
                      <Button size="sm" onClick={() => updateStatus(it.id, "resolved")}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{it.message}</p>
                {it.related_error_message && (
                  <p className="mt-3 p-2 rounded bg-muted text-xs font-mono text-destructive">
                    Error: {it.related_error_message}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
