import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Lead = {
  id: string;
  company_name: string;
  email: string;
  requested_tier: "enterprise" | "white_label";
};

interface Props {
  lead: Lead;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}

export function ConvertLeadDialog({ lead, open, onOpenChange, onSuccess }: Props) {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [orgName, setOrgName] = useState(lead.company_name);
  const [orgId, setOrgId] = useState("");
  const [tier, setTier] = useState<"enterprise" | "white_label">(lead.requested_tier);
  const [seatLimit, setSeatLimit] = useState("25");
  const [projectLimit, setProjectLimit] = useState("-1");
  const [billingModel, setBillingModel] = useState<"flat_rate" | "per_user" | "usage_based">("flat_rate");
  const [customPrice, setCustomPrice] = useState("");
  const [csmName, setCsmName] = useState("");
  const [csmEmail, setCsmEmail] = useState("");
  const [csmCalendly, setCsmCalendly] = useState("");
  const [csmPhone, setCsmPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        lead_id: lead.id,
        tier,
        seat_limit: Number(seatLimit) || 25,
        project_limit: Number(projectLimit) || -1,
        billing_model: billingModel,
      };
      if (mode === "new") body.new_org_name = orgName;
      else body.organization_id = orgId;
      if (customPrice) body.custom_price = Number(customPrice);
      if (csmName) body.csm_name = csmName;
      if (csmEmail) body.csm_email = csmEmail;
      if (csmCalendly) body.csm_calendly_url = csmCalendly;
      if (csmPhone) body.csm_phone = csmPhone;

      const { error } = await supabase.functions.invoke("admin-provision-enterprise", { body });
      if (error) throw error;
      toast.success(`Provisioned ${tier === "white_label" ? "White-Label" : "Enterprise"} for ${orgName || "organization"}`);
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || "Failed to provision");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Provision {tier === "white_label" ? "White-Label" : "Enterprise"} for {lead.company_name}</DialogTitle>
          <DialogDescription>Lead: {lead.email}</DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "new" | "existing")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">Create new organization</TabsTrigger>
            <TabsTrigger value="existing">Use existing organization</TabsTrigger>
          </TabsList>
          <TabsContent value="new" className="space-y-2 pt-2">
            <Label>Organization name</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </TabsContent>
          <TabsContent value="existing" className="space-y-2 pt-2">
            <Label>Organization ID (UUID)</Label>
            <Input value={orgId} onChange={(e) => setOrgId(e.target.value)} placeholder="00000000-…" />
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Tier</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as "enterprise" | "white_label")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="white_label">White-Label</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Billing model</Label>
            <Select value={billingModel} onValueChange={(v) => setBillingModel(v as never)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="flat_rate">Flat rate</SelectItem>
                <SelectItem value="per_user">Per user</SelectItem>
                <SelectItem value="usage_based">Usage-based</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Seat limit</Label>
            <Input type="number" value={seatLimit} onChange={(e) => setSeatLimit(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Project limit (-1 = unlimited)</Label>
            <Input type="number" value={projectLimit} onChange={(e) => setProjectLimit(e.target.value)} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Custom price (USD, optional)</Label>
            <Input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="1499" />
          </div>
        </div>

        <div className="space-y-2 border-t pt-3">
          <Label className="text-sm font-semibold">Customer Success Manager (optional)</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="CSM name" value={csmName} onChange={(e) => setCsmName(e.target.value)} />
            <Input placeholder="CSM email" type="email" value={csmEmail} onChange={(e) => setCsmEmail(e.target.value)} />
            <Input placeholder="Calendly URL" value={csmCalendly} onChange={(e) => setCsmCalendly(e.target.value)} />
            <Input placeholder="Phone" value={csmPhone} onChange={(e) => setCsmPhone(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || (mode === "new" ? !orgName : !orgId)}>
            {submitting ? "Provisioning..." : "Provision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
