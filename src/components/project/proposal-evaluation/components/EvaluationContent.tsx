import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EvaluationContentProps {
  content: string;
}

/**
 * Renders the evaluation content using markdown formatting
 * Displayed in a scrollable area with consistent styling
 */
export function EvaluationContent({ content }: EvaluationContentProps) {
  return (
    <ScrollArea className="h-[500px] w-full rounded-md border bg-gray-50 p-6">
      <div className="prose prose-gray max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mb-4 text-gray-900">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold mb-3 mt-6 text-gray-800">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-medium mb-2 mt-4 text-gray-700">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 leading-relaxed text-gray-600">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="text-gray-600">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-800">{children}</strong>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </ScrollArea>
  );
}