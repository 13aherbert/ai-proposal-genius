import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { ConvertLeadDialog } from "@/components/admin/ConvertLeadDialog";
import { Loader2 } from "lucide-react";

type Lead = {
  id: string;
  company_name: string;
  email: string;
  team_size: string | null;
  message: string | null;
  source: string;
  requested_tier: "enterprise" | "white_label";
  status: "new" | "contacted" | "converted" | "rejected";
  converted_org_id: string | null;
  created_at: string;
};

const statusColors: Record<string, string> = {
  new: "default",
  contacted: "secondary",
  converted: "outline",
  rejected: "destructive",
};

export default function AdminLeads() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const qc = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["enterprise-leads", statusFilter],
    queryFn: async () => {
      let q = supabase.from("enterprise_leads").select("*").order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Lead[];
    },
  });

  const updateStatus = async (id: string, status: Lead["status"]) => {
    await supabase.from("enterprise_leads").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["enterprise-leads"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise Leads</h1>
          <p className="text-muted-foreground">Demo requests from Enterprise and White-Label prospects.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>Pipeline ({leads?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !leads?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No leads yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.company_name}</TableCell>
                    <TableCell>{l.email}</TableCell>
                    <TableCell>
                      <Badge variant={l.requested_tier === "white_label" ? "secondary" : "default"}>
                        {l.requested_tier === "white_label" ? "White-Label" : "Enterprise"}
                      </Badge>
                    </TableCell>
                    <TableCell>{l.team_size ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.source}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[l.status] as never}>{l.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {l.status !== "converted" && (
                        <Button size="sm" onClick={() => setConvertLead(l)}>Provision</Button>
                      )}
                      {l.status === "new" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(l.id, "contacted")}>Mark contacted</Button>
                      )}
                      {l.status !== "rejected" && l.status !== "converted" && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(l.id, "rejected")}>Reject</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {convertLead && (
        <ConvertLeadDialog
          lead={convertLead}
          open={!!convertLead}
          onOpenChange={(o) => !o && setConvertLead(null)}
          onSuccess={() => {
            setConvertLead(null);
            qc.invalidateQueries({ queryKey: ["enterprise-leads"] });
          }}
        />
      )}
    </div>
  );
}
