import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, TrendingUp, Save } from "lucide-react";
import type { ROISettings } from "@/hooks/useAnalyticsDashboard";

interface ROICalculatorProps {
  roiData: {
    hoursSavedPerProposal: number;
    costSavingsPerProposal: number;
    totalHoursSaved: number;
    totalCostSavings: number;
    roi: number;
    settings: ROISettings;
  };
  onUpdateSettings: (settings: ROISettings) => void;
  isUpdating: boolean;
}

export function ROICalculator({ roiData, onUpdateSettings, isUpdating }: ROICalculatorProps) {
  const [hourlyRate, setHourlyRate] = useState(roiData.settings.hourly_rate);
  const [manualHours, setManualHours] = useState(roiData.settings.manual_hours_per_proposal);
  const [subCost, setSubCost] = useState(roiData.settings.subscription_monthly_cost);

  useEffect(() => {
    setHourlyRate(roiData.settings.hourly_rate);
    setManualHours(roiData.settings.manual_hours_per_proposal);
    setSubCost(roiData.settings.subscription_monthly_cost);
  }, [roiData.settings]);

  const handleSave = () => {
    onUpdateSettings({
      hourly_rate: hourlyRate,
      manual_hours_per_proposal: manualHours,
      subscription_monthly_cost: subCost,
    });
  };

  const metrics = [
    { label: "Hours Saved / Proposal", value: `${roiData.hoursSavedPerProposal}h`, icon: Clock, color: "text-blue-500" },
    { label: "Cost Saved / Proposal", value: `$${roiData.costSavingsPerProposal.toLocaleString()}`, icon: DollarSign, color: "text-green-500" },
    { label: "Total Hours Saved", value: `${roiData.totalHoursSaved}h`, icon: Clock, color: "text-purple-500" },
    { label: "Total Cost Savings", value: `$${roiData.totalCostSavings.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">ROI Parameters</CardTitle>
          <CardDescription className="text-xs">Adjust to match your team's costs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Hourly Rate ($)</Label>
            <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="h-8" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Manual Hours / Proposal</Label>
            <Input type="number" value={manualHours} onChange={(e) => setManualHours(Number(e.target.value))} className="h-8" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monthly Subscription ($)</Label>
            <Input type="number" value={subCost} onChange={(e) => setSubCost(Number(e.target.value))} className="h-8" />
          </div>
          <Button onClick={handleSave} disabled={isUpdating} size="sm" className="w-full">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            ROI Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {metrics.map((m) => (
              <div key={m.label} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
                <p className="text-xl font-bold">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">Return on Investment</p>
            <p className="text-4xl font-bold text-primary">
              {roiData.roi >= 999 ? "∞" : `${roiData.roi}%`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {roiData.roi >= 999
                ? "Infinite ROI — no subscription cost recorded"
                : "Based on your configured parameters"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
