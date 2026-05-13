import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");

export default function WordCounter() {
  const tool = getTool("proposal-word-counter")!;
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const clean = stripHtml(text).trim();
    const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
    const chars = clean.length;
    const charsNoSpace = clean.replace(/\s/g, "").length;
    const sentences = clean ? (clean.match(/[.!?]+(?=\s|$)/g) || []).length || 1 : 0;
    const paragraphs = clean ? clean.split(/\n\s*\n/).filter(Boolean).length : 0;
    const readingMinutes = words / 250;
    const pages = words / 500;
    return { words, chars, charsNoSpace, sentences, paragraphs, readingMinutes, pages };
  }, [text]);

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Paste your proposal text or HTML into the text box.",
        "We instantly strip any markup and recalculate every metric.",
        "Use the page and reading-time estimates to pace reviewers.",
      ]}
      whyItMatters={
        <>
          <p>
            Federal and state RFPs almost always cap response length — by page count, word count or both. Going over disqualifies your bid before evaluators ever read your win themes.
          </p>
          <p>
            This proposal word counter strips HTML so numbers from copy-pasted rich text editors (TipTap, Word, Google Docs) match the plain text reviewers actually score.
          </p>
        </>
      }
    >
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your proposal text here…"
        className="min-h-[240px] font-mono text-sm"
        aria-label="Proposal text input"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Stat label="Words" value={stats.words.toLocaleString()} />
        <Stat label="Characters" value={stats.chars.toLocaleString()} />
        <Stat label="No spaces" value={stats.charsNoSpace.toLocaleString()} />
        <Stat label="Sentences" value={stats.sentences.toLocaleString()} />
        <Stat label="Paragraphs" value={stats.paragraphs.toLocaleString()} />
        <Stat label="Pages (~500/pg)" value={stats.pages.toFixed(1)} />
        <Stat label="Read time" value={`${stats.readingMinutes.toFixed(1)} min`} />
        <Stat label="Avg word/sentence" value={stats.sentences ? (stats.words / stats.sentences).toFixed(1) : "0"} />
      </div>
    </ToolPageLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
