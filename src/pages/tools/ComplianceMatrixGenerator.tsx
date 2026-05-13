import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";
import { Download, Trash2 } from "lucide-react";

interface Row {
  id: string;
  section: string;
  requirement: string;
  owner: string;
  status: string;
}

const KEYWORD_RE = /\b(shall|must|will|should|is required to|are required to)\b/i;

function extractRequirements(text: string): Row[] {
  // Split on sentence boundaries while keeping reasonable chunks
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z(])/);
  const seen = new Set<string>();
  const rows: Row[] = [];
  sentences.forEach((s, i) => {
    const trimmed = s.trim();
    if (trimmed.length < 15 || trimmed.length > 600) return;
    if (!KEYWORD_RE.test(trimmed)) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const sectionMatch = trimmed.match(/^(\d+(?:\.\d+)*)\s/);
    rows.push({
      id: `r-${i}`,
      section: sectionMatch ? sectionMatch[1] : "",
      requirement: trimmed,
      owner: "",
      status: "Not started",
    });
  });
  return rows;
}

function toCsv(rows: Row[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["#", "Section", "Requirement", "Owner", "Status"].map(esc).join(",");
  const body = rows
    .map((r, i) => [String(i + 1), r.section, r.requirement, r.owner, r.status].map(esc).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export default function ComplianceMatrixGenerator() {
  const tool = getTool("compliance-matrix-generator")!;
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  const extract = () => setRows(extractRequirements(text));

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  const downloadCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compliance-matrix.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = useMemo(() => ({ total: rows.length }), [rows]);

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Paste the RFP body text into the box (PDF copy-paste works).",
        "Click Extract to pull every shall/must/will sentence into a matrix.",
        "Assign owners and statuses, then export to CSV.",
      ]}
      whyItMatters={
        <>
          <p>
            Federal and state evaluators score compliance before they score quality. A missing requirement is an automatic point deduction — sometimes an automatic disqualification.
          </p>
          <p>
            Building a compliance matrix on day one ensures every imperative gets an owner and a response section. Most teams find 20–40% more requirements than they spotted on first read.
          </p>
        </>
      }
    >
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the full RFP text here…"
        className="min-h-[200px] font-mono text-xs"
        aria-label="RFP text input"
      />
      <div className="flex items-center gap-3 mt-4">
        <Button onClick={extract} disabled={!text.trim()}>Extract requirements</Button>
        {rows.length > 0 && (
          <>
            <span className="text-sm text-muted-foreground">{counts.total} requirements found</span>
            <Button variant="outline" size="sm" onClick={downloadCsv} className="ml-auto">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </>
        )}
      </div>

      {rows.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-2 w-10">#</th>
                <th className="py-2 pr-2 w-20">Section</th>
                <th className="py-2 pr-2">Requirement</th>
                <th className="py-2 pr-2 w-32">Owner</th>
                <th className="py-2 pr-2 w-32">Status</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-b align-top">
                  <td className="py-2 pr-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 pr-2">
                    <Input value={r.section} onChange={(e) => updateRow(r.id, { section: e.target.value })} className="h-8" />
                  </td>
                  <td className="py-2 pr-2 text-sm">{r.requirement}</td>
                  <td className="py-2 pr-2">
                    <Input value={r.owner} onChange={(e) => updateRow(r.id, { owner: e.target.value })} className="h-8" placeholder="Owner" />
                  </td>
                  <td className="py-2 pr-2">
                    <Input value={r.status} onChange={(e) => updateRow(r.id, { status: e.target.value })} className="h-8" />
                  </td>
                  <td className="py-2">
                    <Button variant="ghost" size="icon" onClick={() => removeRow(r.id)} aria-label="Remove row">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ToolPageLayout>
  );
}
