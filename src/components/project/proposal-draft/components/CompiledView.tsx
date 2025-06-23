
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ProposalSection } from "../useProposalSections";
import ReactMarkdown from "react-markdown";

interface CompiledViewProps {
  sections: ProposalSection[];
}

export function CompiledView({ sections }: CompiledViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(true);

  const compiledContent = sections
    .map((section) => section.content || "")
    .join("\n\n---\n\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiledContent);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
                Compiled Proposal
              </CardTitle>
              <CardDescription>
                View and copy your complete proposal
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMarkdown(!showMarkdown)}
                className="bg-brand-green hover:bg-brand-green-dark text-white border-brand-green hover:border-brand-green-dark"
              >
                {showMarkdown ? "Show Raw" : "Show Formatted"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="bg-brand-green hover:bg-brand-green-dark text-white border-brand-green hover:border-brand-green-dark flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
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
    </div>
  );
}
