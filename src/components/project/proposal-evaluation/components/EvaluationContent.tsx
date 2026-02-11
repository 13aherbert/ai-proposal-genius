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
    <ScrollArea className="max-h-[60vh] sm:h-[500px] w-full rounded-md border bg-background p-3 sm:p-6">
      <div className="prose prose-gray max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 mt-4 sm:mt-6 text-foreground">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base sm:text-lg font-medium mb-2 mt-3 sm:mt-4 text-brand-green">{children}</h3>
            ),
            p: ({ children }) => {
              const content = String(children);
              const textClass = content.includes('Medium') ? 'text-yellow-600' : 
                               content.includes('Weak') ? 'text-red-600' : 'text-foreground';
              return <p className={`mb-4 leading-relaxed ${textClass}`}>{children}</p>;
            },
            ul: ({ children }) => (
              <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
            ),
            li: ({ children }) => {
              const content = String(children);
              const textClass = content.includes('Medium') ? 'text-yellow-600' : 
                               content.includes('Weak') ? 'text-red-600' : 'text-foreground';
              return <li className={textClass}>{children}</li>;
            },
            strong: ({ children }) => {
              const content = String(children);
              const textClass = content.includes('Medium') ? 'text-yellow-600' : 
                               content.includes('Weak') ? 'text-red-600' : 'text-foreground';
              return <strong className={`font-semibold ${textClass}`}>{children}</strong>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </ScrollArea>
  );
}
