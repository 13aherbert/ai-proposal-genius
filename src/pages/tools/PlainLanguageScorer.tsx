import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";

const JARGON = [
  "leverage", "leveraging", "synergize", "synergy", "synergies", "world-class",
  "best-of-breed", "cutting-edge", "robust solution", "robust", "seamless",
  "turnkey", "best-in-class", "value-add", "value add", "holistic", "paradigm",
  "next-generation", "next-gen", "game-changer", "game changer", "bandwidth",
  "circle back", "low-hanging fruit", "deep dive", "move the needle",
  "boil the ocean", "thought leader", "thought leadership", "mission-critical",
  "ecosystem", "disruptive", "transformative", "scalable solution",
];

const PASSIVE_PARTICIPLE = /\b(am|is|are|was|were|be|been|being|will be|has been|have been|had been)\s+(\w+ed|\w+en|done|gone|made|seen|known|given|taken|written|driven|delivered|implemented|provided|approved|completed|performed|conducted|developed)\b/gi;

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const cleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const m = cleaned.match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ");
}

interface Stats {
  words: number;
  sentences: number;
  syllables: number;
  complexWords: number; // ≥3 syllables, not proper noun/compound
  passiveCount: number;
  jargonHits: { term: string; count: number }[];
  flesch: number;
  fk: number;
  fog: number;
  avgWordsPerSentence: number;
  passivePct: number;
}

function compute(raw: string): Stats | null {
  const text = stripHtml(raw).trim();
  if (!text) return null;
  const sentences = text.split(/[.!?]+(?=\s|$)/).map((s) => s.trim()).filter(Boolean);
  const wordsArr = text.match(/\b[\p{L}'-]+\b/gu) || [];
  const words = wordsArr.length;
  if (words === 0 || sentences.length === 0) return null;
  const syl: number = wordsArr.reduce<number>((s, w) => s + syllables(w), 0);
  const complex: number = wordsArr.filter((w) => syllables(w) >= 3 && !/^[A-Z]/.test(w)).length;
  const flesch = 206.835 - 1.015 * (words / sentences.length) - 84.6 * (syl / words);
  const fk = 0.39 * (words / sentences.length) + 11.8 * (syl / words) - 15.59;
  const fog = 0.4 * (words / sentences.length + 100 * (complex / words));
  const passiveCount = (text.match(PASSIVE_PARTICIPLE) || []).length;
  const lower = text.toLowerCase();
  const jargonHits: { term: string; count: number }[] = JARGON
    .map((t) => {
      const re = new RegExp(`\\b${t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "gi");
      const count = (lower.match(re) || []).length;
      return { term: t, count };
    })
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count);
  return {
    words,
    sentences: sentences.length,
    syllables: syl,
    complexWords: complex,
    passiveCount,
    jargonHits,
    flesch: Math.round(flesch * 10) / 10,
    fk: Math.round(fk * 10) / 10,
    fog: Math.round(fog * 10) / 10,
    avgWordsPerSentence: Math.round((words / sentences.length) * 10) / 10,
    passivePct: Math.round((passiveCount / sentences.length) * 1000) / 10,
  };
}

function fleschBand(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "Plain — 7th grade or easier", color: "text-emerald-600" };
  if (score >= 60) return { label: "Standard — 8th–9th grade", color: "text-emerald-600" };
  if (score >= 50) return { label: "Fairly difficult — 10th–12th grade", color: "text-amber-600" };
  if (score >= 30) return { label: "Difficult — college", color: "text-orange-600" };
  return { label: "Very difficult — graduate / legal", color: "text-red-600" };
}

function gradeBand(grade: number): { label: string; color: string } {
  if (grade <= 8) return { label: "Plain Writing Act compliant", color: "text-emerald-600" };
  if (grade <= 10) return { label: "Acceptable for most federal evaluators", color: "text-emerald-600" };
  if (grade <= 12) return { label: "Above target — consider simplifying", color: "text-amber-600" };
  return { label: "Too dense — rewrite recommended", color: "text-red-600" };
}

export default function PlainLanguageScorer() {
  const tool = getTool("plain-language-scorer")!;
  const [text, setText] = useState("");
  const stats = useMemo(() => compute(text), [text]);

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Paste any proposal text, draft section, or executive summary.",
        "Read your Flesch Reading Ease, Flesch-Kincaid grade, and Gunning Fog scores.",
        "Cut the flagged jargon, shorten the longest sentences, and rerun. Target ≤10th grade.",
      ]}
      whyItMatters={
        <>
          <p>
            The federal Plain Writing Act of 2010 requires agencies to write clearly — and most evaluators apply the same standard to proposals. Texts above 10th-grade level are perceived as evasive, even when the content is strong.
          </p>
          <p>
            Three formulas together — Flesch Reading Ease, Flesch-Kincaid Grade, and Gunning Fog — triangulate readability in seconds. The free OptiRFP tool flags the same jargon list the full editor blocks at write time.
          </p>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="t">Paste your text</Label>
          <Textarea
            id="t"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste proposal text, executive summary, or any draft section…"
            className="min-h-[240px] mt-1.5"
          />
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border rounded-lg p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Flesch Reading Ease</div>
                <div className="text-3xl font-bold tabular-nums">{stats.flesch}</div>
                <div className={`text-xs mt-1 ${fleschBand(stats.flesch).color}`}>{fleschBand(stats.flesch).label}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Flesch-Kincaid Grade</div>
                <div className="text-3xl font-bold tabular-nums">{stats.fk}</div>
                <div className={`text-xs mt-1 ${gradeBand(stats.fk).color}`}>{gradeBand(stats.fk).label}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Gunning Fog</div>
                <div className="text-3xl font-bold tabular-nums">{stats.fog}</div>
                <div className={`text-xs mt-1 ${gradeBand(stats.fog).color}`}>{gradeBand(stats.fog).label}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Words" value={stats.words.toLocaleString()} />
              <Stat label="Sentences" value={stats.sentences.toLocaleString()} />
              <Stat label="Avg words / sentence" value={String(stats.avgWordsPerSentence)} hint={stats.avgWordsPerSentence > 20 ? "Above 20 — split long sentences" : "Healthy"} />
              <Stat label="Passive voice" value={`${stats.passivePct}%`} hint={stats.passivePct > 10 ? "Above 10% — rewrite to active" : "Healthy"} />
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm font-semibold mb-2">Jargon flagged</div>
              {stats.jargonHits.length === 0 ? (
                <div className="text-sm text-muted-foreground">None — clean prose.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {stats.jargonHits.map((h) => (
                    <span key={h.term} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs">
                      <span className="font-medium">{h.term}</span>
                      <span className="opacity-70">×{h.count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ToolPageLayout>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}
