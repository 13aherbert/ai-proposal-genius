import { useMemo } from "react";
import { countWords } from "@/utils/wordCount";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SectionStatsProps {
  content: string;
  className?: string;
}

function countChars(text: string): number {
  if (!text) return 0;
  return text.replace(/<[^>]*>/g, "").length;
}

export function SectionStats({ content, className }: SectionStatsProps) {
  const stats = useMemo(() => {
    const words = countWords(content);
    const pages = (words / 250).toFixed(1);
    const readMin = Math.max(1, Math.ceil(words / 200));
    const chars = countChars(content);
    return { words, pages, readMin, chars };
  }, [content]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>
            {stats.words.toLocaleString()} words · ~{stats.pages} pages · {stats.readMin} min read
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{stats.chars.toLocaleString()} characters</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
