import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Activity, AlertTriangle, CheckCircle, XCircle, Clock, Zap, Globe, Database, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SourceHealth {
  key: string;
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTimeMs: number;
  errorMessage: string | null;
  lastSuccess: string | null;
  apiKeyConfigured: boolean;
  expectedTimeoutMs: number;
}

interface HealthData {
  sources: SourceHealth[];
  checkedAt: string;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  sam_gov: <Globe className="h-5 w-5 text-blue-500" />,
  grants_gov: <Database className="h-5 w-5 text-green-500" />,
  california: <span className="text-lg">🌴</span>,
  texas: <span className="text-lg">⭐</span>,
  new_york: <span className="text-lg">🗽</span>,
};

const STATUS_CONFIG = {
  healthy: { color: "bg-emerald-500", label: "Healthy", icon: CheckCircle, badgeVariant: "default" as const },
  degraded: { color: "bg-yellow-500", label: "Degraded", icon: AlertTriangle, badgeVariant: "secondary" as const },
  down: { color: "bg-red-500", label: "Down", icon: XCircle, badgeVariant: "destructive" as const },
};

export default function SourceStatusDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [enabledSources, setEnabledSources] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("admin_enabled_sources");
    return saved ? JSON.parse(saved) : {
      sam_gov: true, grants_gov: true, california: true, texas: true, new_york: true,
    };
  });

  const fetchHealth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/get-source-health`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      console.error("Failed to fetch source health:", err);
      toast.error("Failed to fetch source health");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Auto-refresh every 60s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const handleManualSync = async (sourceKey: string) => {
    setSyncing(sourceKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/search-opportunities`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sources: [sourceKey], keyword: "", limit: 5 }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const providerStatus = data.providerStatuses?.find((p: any) => p.provider === sourceKey);
      if (providerStatus?.status === "success") {
        toast.success(`${sourceKey} synced successfully (${providerStatus.count} results)`);
      } else {
        toast.warning(`${sourceKey}: ${providerStatus?.message || "No results"}`);
      }
      // Refresh health after sync
      await fetchHealth();
    } catch (err) {
      toast.error(`Sync failed for ${sourceKey}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHealth();
  };

  const toggleSource = (key: string) => {
    const updated = { ...enabledSources, [key]: !enabledSources[key] };
    setEnabledSources(updated);
    localStorage.setItem("admin_enabled_sources", JSON.stringify(updated));
  };

  // Mock chart data based on health
  const chartData = healthData?.sources.map((s) => ({
    name: s.name.split(" ")[0],
    responseTime: s.responseTimeMs,
    status: s.status === "healthy" ? 100 : s.status === "degraded" ? 50 : 0,
  })) || [];

  const overallHealthy = healthData?.sources.filter((s) => s.status === "healthy").length || 0;
  const overallDegraded = healthData?.sources.filter((s) => s.status === "degraded").length || 0;
  const overallDown = healthData?.sources.filter((s) => s.status === "down").length || 0;
  const avgResponseTime = healthData?.sources.length
    ? Math.round(healthData.sources.reduce((sum, s) => sum + s.responseTimeMs, 0) / healthData.sources.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunity Source Health</h1>
          <p className="text-muted-foreground text-sm">
            Monitor API status across all opportunity data sources
            {healthData?.checkedAt && (
              <span className="ml-2 text-xs">
                · Last checked {new Date(healthData.checkedAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-muted-foreground">Healthy</span>
            </div>
            <p className="text-2xl font-bold mt-1">{overallHealthy}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-muted-foreground">Degraded</span>
            </div>
            <p className="text-2xl font-bold mt-1">{overallDegraded}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm text-muted-foreground">Down</span>
            </div>
            <p className="text-2xl font-bold mt-1">{overallDown}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg Response</span>
            </div>
            <p className="text-2xl font-bold mt-1">{avgResponseTime}ms</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {healthData?.sources.some((s) => s.status === "down") && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Critical: Sources Down</p>
              <p className="text-xs text-muted-foreground">
                {healthData.sources.filter((s) => s.status === "down").map((s) => s.name).join(", ")} —{" "}
                {healthData.sources.filter((s) => s.status === "down").map((s) => s.errorMessage).join("; ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthData?.sources.map((source) => {
          const config = STATUS_CONFIG[source.status];
          const StatusIcon = config.icon;
          return (
            <Card key={source.key} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 ${config.color}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {SOURCE_ICONS[source.key]}
                    <CardTitle className="text-base">{source.name}</CardTitle>
                  </div>
                  <Badge variant={config.badgeVariant} className="text-xs">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Response Time</p>
                    <p className="font-medium">
                      {source.responseTimeMs > 0 ? `${source.responseTimeMs}ms` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">API Key</p>
                    <p className="font-medium">
                      {source.apiKeyConfigured ? (
                        <span className="text-emerald-600">Configured</span>
                      ) : (
                        <span className="text-destructive">Missing</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Expected Timeout</p>
                    <p className="font-medium">{source.expectedTimeoutMs / 1000}s</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Last Success</p>
                    <p className="font-medium text-xs">
                      {source.lastSuccess
                        ? new Date(source.lastSuccess).toLocaleTimeString()
                        : "—"}
                    </p>
                  </div>
                </div>

                {source.errorMessage && (
                  <div className="bg-destructive/10 text-destructive text-xs rounded px-2 py-1.5">
                    {source.errorMessage}
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={syncing === source.key}
                  onClick={() => handleManualSync(source.key)}
                >
                  {syncing === source.key ? (
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-3 w-3 mr-2" />
                  )}
                  Sync Now
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Response Times by Source</CardTitle>
            <CardDescription>Current ping response time (ms)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="responseTime" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Response Time (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source Health Score</CardTitle>
            <CardDescription>100 = Healthy, 50 = Degraded, 0 = Down</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar
                    dataKey="status"
                    name="Health Score"
                    radius={[4, 4, 0, 0]}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Source Configuration
          </CardTitle>
          <CardDescription>Enable or disable individual sources and review API key status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthData?.sources.map((source, i) => (
              <React.Fragment key={source.key}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    {SOURCE_ICONS[source.key]}
                    <div>
                      <p className="font-medium text-sm">{source.name}</p>
                      <p className="text-xs text-muted-foreground">
                        API Key:{" "}
                        <span className={source.apiKeyConfigured ? "text-emerald-600" : "text-destructive"}>
                          {source.apiKeyConfigured ? "Configured" : "Missing"}
                        </span>
                        {" · "}Timeout: {source.expectedTimeoutMs / 1000}s
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_CONFIG[source.status].badgeVariant} className="text-xs">
                      {STATUS_CONFIG[source.status].label}
                    </Badge>
                    <Switch
                      checked={enabledSources[source.key] ?? true}
                      onCheckedChange={() => toggleSource(source.key)}
                    />
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
