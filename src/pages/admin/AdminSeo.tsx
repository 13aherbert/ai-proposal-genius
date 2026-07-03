import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Search, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useSEO } from "@/hooks/use-seo";

interface Row { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number; }
interface Overview {
  startDate: string; endDate: string;
  totals?: { rows?: Row[]; error?: string };
  queries?: { rows?: Row[]; error?: string };
  pages?: { rows?: Row[]; error?: string };
  byDate?: { rows?: Row[]; error?: string };
}

const SITE = "https://optirfp.ai/";

export default function AdminSeo() {
  useSEO({
    noindex: true, title: "SEO Analytics | OptiRFP Admin", description: "Google Search Console analytics for optirfp.ai" });
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(28);

  const checkSites = async () => {
    const { data, error } = await supabase.functions.invoke("gsc-analytics", { body: { action: "sites" } });
    if (error) { setVerified(false); return; }
    const sites = (data?.siteEntry ?? []) as Array<{ siteUrl: string }>;
    setVerified(sites.some((s) => s.siteUrl === SITE));
  };

  const load = async (d = days) => {
    setLoading(true); setError(null);
    const { data, error } = await supabase.functions.invoke("gsc-analytics", { body: { action: "overview", days: d } });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data?.error) { setError(data.error); return; }
    setData(data);
  };

  const verify = async () => {
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke("gsc-analytics", { body: { action: "verify" } });
    setVerifying(false);
    if (error || data?.ok === false) {
      toast.error(`Verification failed: ${data?.error ?? error?.message ?? "unknown"}`, {
        description: "Make sure the site is published and the meta tag is live on optirfp.ai.",
      });
      return;
    }
    toast.success("optirfp.ai verified and added to Search Console");
    setVerified(true);
    load();
  };

  useEffect(() => { (async () => { await checkSites(); load(); })(); }, []);

  const totalsRow = data?.totals?.rows?.[0];
  const trendData = (data?.byDate?.rows ?? []).map((r) => ({
    date: r.keys?.[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Search className="h-7 w-7" /> SEO Analytics</h1>
          <p className="text-muted-foreground mt-1">Google Search Console data for optirfp.ai</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 28, 90].map((d) => (
            <Button key={d} variant={days === d ? "default" : "outline"} size="sm"
              onClick={() => { setDays(d); load(d); }}>{d}d</Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Verification status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {verified === true && <><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Site verified</>}
            {verified === false && <><AlertCircle className="h-5 w-5 text-yellow-500" /> Site not verified</>}
            {verified === null && <><Loader2 className="h-5 w-5 animate-spin" /> Checking…</>}
          </CardTitle>
          <CardDescription>
            {verified
              ? "optirfp.ai is registered in Google Search Console and analytics are flowing."
              : "Publish the app first so Google can read the meta tag from optirfp.ai, then click Verify."}
          </CardDescription>
        </CardHeader>
        {verified === false && (
          <CardContent className="flex gap-2">
            <Button onClick={verify} disabled={verifying}>
              {verifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</> : "Verify optirfp.ai"}
            </Button>
            <Button variant="outline" asChild>
              <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">
                Search Console <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        )}
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-base text-destructive">Error</CardTitle></CardHeader>
          <CardContent><pre className="text-xs whitespace-pre-wrap">{error}</pre></CardContent>
        </Card>
      )}

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Clicks", value: totalsRow?.clicks ?? 0, fmt: (v: number) => v.toLocaleString() },
          { label: "Impressions", value: totalsRow?.impressions ?? 0, fmt: (v: number) => v.toLocaleString() },
          { label: "CTR", value: totalsRow?.ctr ?? 0, fmt: (v: number) => `${(v * 100).toFixed(2)}%` },
          { label: "Avg position", value: totalsRow?.position ?? 0, fmt: (v: number) => v.toFixed(1) },
        ].map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2"><CardDescription>{m.label}</CardDescription></CardHeader>
            <CardContent><div className="text-2xl font-bold">{loading ? "—" : m.fmt(m.value)}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Trend */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trend</CardTitle>
            <CardDescription>{data?.startDate} → {data?.endDate}</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Line yAxisId="l" type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line yAxisId="r" type="monotone" dataKey="impressions" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <RowsTable title="Top queries" rows={data?.queries?.rows ?? []} keyLabel="Query" loading={loading} />
        <RowsTable title="Top pages" rows={data?.pages?.rows ?? []} keyLabel="Page" loading={loading} isUrl />
      </div>
    </div>
  );
}

function RowsTable({ title, rows, keyLabel, loading, isUrl }: {
  title: string; rows: Row[]; keyLabel: string; loading: boolean; isUrl?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription><Badge variant="secondary">{rows.length} rows</Badge></CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>
        ) : (
          <div className="overflow-auto max-h-[420px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{keyLabel}</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Impr</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Pos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => {
                  const k = r.keys?.[0] ?? "";
                  return (
                    <TableRow key={i}>
                      <TableCell className="max-w-[260px] truncate" title={k}>
                        {isUrl ? (
                          <a href={k} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            {k.replace(/^https?:\/\/[^/]+/, "")}
                          </a>
                        ) : k}
                      </TableCell>
                      <TableCell className="text-right">{r.clicks}</TableCell>
                      <TableCell className="text-right">{r.impressions}</TableCell>
                      <TableCell className="text-right">{(r.ctr * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{r.position.toFixed(1)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
