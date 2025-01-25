import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ProposalSection } from "../useProposalSections";
import ReactMarkdown from "react-markdown";

interface CompiledViewProps {
  sections: ProposalSection[];
}

export function CompiledView({ sections }: CompiledViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMarkdown(!showMarkdown)}
          >
            {showMarkdown ? "Show Raw" : "Show Formatted"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showMarkdown ? (
          <div 
            className={`prose dark:prose-invert max-w-none border rounded-md p-4 bg-background overflow-y-auto ${
              isExpanded ? "min-h-[500px]" : "min-h-[200px]"
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ReactMarkdown>{compiledContent}</ReactMarkdown>
          </div>
        ) : (
          <Textarea
            value={compiledContent}
            readOnly
            className={`resize-none ${isExpanded ? "min-h-[500px]" : "min-h-[200px]"}`}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        )}
      </CardContent>
    </Card>
  );
}