import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ProposalSection } from "../useProposalSections";

interface CompiledViewProps {
  sections: ProposalSection[];
}

export function CompiledView({ sections }: CompiledViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const compiledContent = sections
    .map((section) => `# ${section.section_title}\n\n${section.content || ""}\n`)
    .join("\n---\n\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiledContent);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Compiled Proposal</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea
          value={compiledContent}
          readOnly
          className={`resize-none ${isExpanded ? "min-h-[500px]" : "min-h-[200px]"}`}
          onClick={() => setIsExpanded(!isExpanded)}
        />
      </CardContent>
    </Card>
  );
}