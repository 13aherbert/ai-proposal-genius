import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type ErrorLog = {
  id: string;
  severity: string;
  source: string;
  message: string;
  context: any;
  url: string | null;
  user_agent: string | null;
  user_id: string | null;
  created_at: string;
};

const SEVERITY_COLORS: Record<string, "destructive" | "secondary" | "default"> = {
  critical: "destructive",
  error: "destructive",
  warning: "secondary",
  info: "default",
};

export default function AdminErrorLogs() {
  const qc = useQueryClient();
  const [severity, setSeverity] = useState<string>("all");
  const [source, setSource] = useState<string>("all");

  const { data: logs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-error-logs", severity, source],
    queryFn: async () => {
      let q = supabase.from("error_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (severity !== "all") q = q.eq("severity", severity);
      if (source !== "all") q = q.eq("source", source);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ErrorLog[];
    },
  });

  const deleteOld = useMutation({
    mutationFn: async () => {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from("error_logs").delete().lt("created_at", cutoff);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cleared logs older than 30 days");
      qc.invalidateQueries({ queryKey: ["admin-error-logs"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to clear logs"),
  });

  const sources = Array.from(new Set(logs.map((l) => l.source)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Error Logs</h1>
          <p className="text-sm text-muted-foreground">Frontend & edge function failures (most recent 200)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => deleteOld.mutate()} disabled={deleteOld.isPending}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear &gt; 30d
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="w-48">
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-56">
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No error logs match your filters. 🎉</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={SEVERITY_COLORS[log.severity] ?? "secondary"}>{log.severity}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.source}</TableCell>
                    <TableCell className="max-w-md truncate" title={log.message}>{log.message}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={log.url ?? ""}>
                      {log.url ?? "—"}
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
