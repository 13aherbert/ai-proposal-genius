import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

type LifetimeCode = {
  id: string;
  code: string;
  stripe_price_id: string;
  plan_slug: string;
  max_redemptions: number | null;
  redemption_count: number;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

type Redemption = {
  id: string;
  code_id: string;
  email: string | null;
  amount_paid_cents: number | null;
  currency: string | null;
  redeemed_at: string;
  refunded_at: string | null;
};

export default function AdminLifetime() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const codesQuery = useQuery({
    queryKey: ["admin-lifetime-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifetime_deal_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LifetimeCode[];
    },
  });

  const redemptionsQuery = useQuery({
    queryKey: ["admin-lifetime-redemptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifetime_deal_redemptions")
        .select("id, user_id, code_id, email, currency, amount_paid_cents, redeemed_at, refunded_at")
        .order("redeemed_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Redemption[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("lifetime_deal_codes")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lifetime-codes"] });
      toast.success("Code updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update code"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lifetime Deal Codes</h1>
          <p className="text-muted-foreground">Create promo codes and review redemptions.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New code</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create lifetime deal code</DialogTitle></DialogHeader>
            <CreateCodeForm onCreated={() => { setCreateOpen(false); qc.invalidateQueries({ queryKey: ["admin-lifetime-codes"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Codes</CardTitle></CardHeader>
        <CardContent>
          {codesQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : codesQuery.data && codesQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Stripe price</TableHead>
                  <TableHead>Used / Cap</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codesQuery.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                    <TableCell><Badge variant="secondary">{c.plan_slug}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.stripe_price_id}</TableCell>
                    <TableCell>{c.redemption_count}{c.max_redemptions != null ? ` / ${c.max_redemptions}` : ""}</TableCell>
                    <TableCell className="text-sm">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={c.is_active}
                        onCheckedChange={(v) => toggleActive.mutate({ id: c.id, is_active: v })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No codes yet. Create one to get started.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent redemptions</CardTitle></CardHeader>
        <CardContent>
          {redemptionsQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : redemptionsQuery.data && redemptionsQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Redeemed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptionsQuery.data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.email ?? "—"}</TableCell>
                    <TableCell>
                      {r.amount_paid_cents != null
                        ? `${(r.amount_paid_cents / 100).toFixed(2)} ${(r.currency ?? "usd").toUpperCase()}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{new Date(r.redeemed_at).toLocaleString()}</TableCell>
                    <TableCell>
                      {r.refunded_at
                        ? <Badge variant="destructive">Refunded</Badge>
                        : <Badge variant="default">Active</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No redemptions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateCodeForm({ onCreated }: { onCreated: () => void }) {
  const [code, setCode] = useState("");
  const [stripePriceId, setStripePriceId] = useState("");
  const [planSlug, setPlanSlug] = useState("growth");
  const [maxRedemptions, setMaxRedemptions] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!code.trim() || !stripePriceId.trim()) {
      toast.error("Code and Stripe price ID are required");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("lifetime_deal_codes").insert({
      code: code.trim(),
      stripe_price_id: stripePriceId.trim(),
      plan_slug: planSlug,
      max_redemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : null,
      expires_at: expiresAt || null,
      notes: notes || null,
      is_active: true,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Created code ${code}`);
    onCreated();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Code</Label>
        <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="LTD2026" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Stripe Price ID (one-time)</Label>
        <Input id="price" value={stripePriceId} onChange={(e) => setStripePriceId(e.target.value)} placeholder="price_..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="plan">Plan slug</Label>
          <Input id="plan" value={planSlug} onChange={(e) => setPlanSlug(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cap">Max redemptions (blank = unlimited)</Label>
          <Input id="cap" type="number" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="exp">Expires at (blank = never)</Label>
        <Input id="exp" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button onClick={submit} disabled={submitting} className="w-full">
        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Create code
      </Button>
    </div>
  );
}
