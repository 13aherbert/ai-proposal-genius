import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Copy, Check, GitBranch } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_INPUT = 12000;

interface Section {
  number: string;
  title: string;
  pages: number;
  questions: string[];
}

export default function ProposalOutlineGenerator() {
  const tool = getTool("proposal-outline-generator")!;
  const [rfp, setRfp] = useState("");
  const [proposalType, setProposalType] = useState<"federal" | "sled" | "commercial">("federal");
  const [pageLimit, setPageLimit] = useState(40);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (rfp.trim().length < 200) {
      toast.error("Paste at least a few paragraphs of RFP text (Sections L & M work best).");
      return;
    }
    setLoading(true);
    setSections([]);
    try {
      const { data, error } = await supabase.functions.invoke("tools-generate-proposal-outline", {
        body: { rfp: rfp.slice(0, MAX_INPUT), proposalType, pageLimit },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSections(Array.isArray(data?.sections) ? data.sections : []);
    } catch (err: any) {
      const msg = err?.message || "Failed to generate outline";
      if (msg.toLowerCase().includes("rate") || msg.includes("429")) {
        toast.error("AI is busy right now. Try again in a moment.");
      } else if (msg.includes("402")) {
        toast.error("AI credits exhausted. Try again later.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const txt = sections
      .map((s) => `${s.number}. ${s.title}  [${s.pages} pages]\n${s.questions.map((q) => `   - ${q}`).join("\n")}`)
      .join("\n\n");
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Paste your RFP text — for long RFPs, paste Sections L (instructions) and M (evaluation) only.",
        "Pick proposal type and total page limit.",
        "Click generate — review the outline, copy it, and start drafting.",
      ]}
      whyItMatters={
        <>
          <p>
            A wrong outline guarantees a low evaluator score. Federal evaluators score in the order Section L asks them to — if your structure doesn't match, they spend their reading time looking for your answers instead of scoring them.
          </p>
          <p>
            This generator builds an outline that mirrors the RFP's instructions and weights pages to evaluation criteria. Inside OptiRFP, the full editor uses the same outline to draft each section with your knowledge base — citation-grade, in minutes.
          </p>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="rfp">RFP text (Sections L &amp; M, or full SOW)</Label>
          <Textarea
            id="rfp"
            value={rfp}
            onChange={(e) => setRfp(e.target.value)}
            placeholder="Paste the Instructions to Offerors (Section L), Evaluation Factors (Section M) and/or Statement of Work…"
            className="min-h-[240px] mt-1.5"
            maxLength={MAX_INPUT}
          />
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {rfp.length.toLocaleString()} / {MAX_INPUT.toLocaleString()} characters
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Proposal type</Label>
            <Select value={proposalType} onValueChange={(v) => setProposalType(v as typeof proposalType)}>
              <SelectTrigger id="type" className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="federal">Federal — FAR-based</SelectItem>
                <SelectItem value="sled">State / Local / Education (SLED)</SelectItem>
                <SelectItem value="commercial">Commercial enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="pl">Total page limit</Label>
            <Input id="pl" type="number" min={5} max={500} value={pageLimit} onChange={(e) => setPageLimit(Math.min(500, Math.max(5, Number(e.target.value) || 40)))} className="mt-1.5" />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={loading || rfp.trim().length < 200} size="lg" className="w-full">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating outline…</> : <><GitBranch className="mr-2 h-4 w-4" /> Generate outline</>}
        </Button>

        {sections.length > 0 && (
          <div className="border rounded-lg bg-card">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="text-sm font-medium">Proposal outline ({sections.length} sections)</span>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <><Check className="h-4 w-4 mr-1" /> Copied</> : <><Copy className="h-4 w-4 mr-1" /> Copy</>}
              </Button>
            </div>
            <ol className="divide-y">
              {sections.map((s, i) => (
                <li key={i} className="p-4">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h4 className="font-semibold">
                      <span className="text-muted-foreground mr-2">{s.number}.</span>
                      {s.title}
                    </h4>
                    <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{s.pages} pg</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {s.questions.map((q, qi) => <li key={qi}>{q}</li>)}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
