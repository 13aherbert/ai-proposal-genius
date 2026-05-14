import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Copy, Check, Sparkles } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_INPUT = 8000;

export default function ExecutiveSummaryGenerator() {
  const tool = getTool("executive-summary-generator")!;
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<"formal" | "confident" | "concise">("confident");
  const [targetWords, setTargetWords] = useState(250);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (context.trim().length < 80) {
      toast.error("Please paste at least a few sentences of context.");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("tools-generate-executive-summary", {
        body: { context: context.slice(0, MAX_INPUT), tone, targetWords },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data?.summary || "");
    } catch (err: any) {
      const msg = err?.message || "Failed to generate summary";
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
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Paste any context: an RFP excerpt, your draft proposal, project notes, or bullets.",
        "Pick a tone and target word count.",
        "Click generate — review, edit, and paste it into your proposal.",
      ]}
      whyItMatters={
        <>
          <p>
            The executive summary is the only section senior evaluators always read. Get it wrong and the rest of your proposal gets skimmed; get it right and reviewers walk in expecting to score you well.
          </p>
          <p>
            This generator uses the same AI that powers OptiRFP's full proposal editor. For one-off summaries it's free and instant — for production proposals grounded in your real win themes and capabilities, the full app pulls from your knowledge base for citation-grade accuracy.
          </p>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="ctx">Proposal context</Label>
          <Textarea
            id="ctx"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Paste the RFP scope, your draft response, key win themes, differentiators, customer outcomes — anything the AI should synthesise into the executive summary."
            className="min-h-[220px] mt-1.5"
            maxLength={MAX_INPUT}
          />
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {context.length.toLocaleString()} / {MAX_INPUT.toLocaleString()} characters
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
              <SelectTrigger id="tone" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal — Federal/government</SelectItem>
                <SelectItem value="confident">Confident — Commercial enterprise</SelectItem>
                <SelectItem value="concise">Concise — Technical/IT buyers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target length: {targetWords} words</Label>
            <Slider
              min={150}
              max={400}
              step={25}
              value={[targetWords]}
              onValueChange={(v) => setTargetWords(v[0])}
              className="mt-3"
            />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={loading || context.trim().length < 80} size="lg" className="w-full">
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" /> Generate executive summary</>
          )}
        </Button>

        {output && (
          <div className="border rounded-lg bg-card">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="text-sm font-medium">Generated executive summary</span>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <><Check className="h-4 w-4 mr-1" /> Copied</> : <><Copy className="h-4 w-4 mr-1" /> Copy</>}
              </Button>
            </div>
            <div className="p-5 whitespace-pre-wrap leading-relaxed text-[15px]">{output}</div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
