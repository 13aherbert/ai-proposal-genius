import { useState } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ROICalculator() {
  const [rfps, setRfps] = useState(5);
  const [hours, setHours] = useState(30);
  const [cost, setCost] = useState(75);

  const annualSavings = Math.round(rfps * hours * cost * 12 * 0.93);

  return (
    <div className="bg-[#181818]/90 rounded-lg p-6 md:p-8 backdrop-blur-sm shadow-2xl mb-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-brand-green/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-brand-green" />
        </div>
        <h3 className="text-xl font-semibold text-gray-100">ROI Calculator</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="roi-rfps" className="text-gray-300 mb-1.5 block">RFPs / month</Label>
          <Input
            id="roi-rfps"
            type="number"
            min={1}
            value={rfps}
            onChange={(e) => setRfps(Number(e.target.value) || 0)}
            className="bg-[#222] border-gray-700 text-gray-100"
          />
        </div>
        <div>
          <Label htmlFor="roi-hours" className="text-gray-300 mb-1.5 block">Hours / RFP</Label>
          <Input
            id="roi-hours"
            type="number"
            min={1}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value) || 0)}
            className="bg-[#222] border-gray-700 text-gray-100"
          />
        </div>
        <div>
          <Label htmlFor="roi-cost" className="text-gray-300 mb-1.5 block">Hourly cost ($)</Label>
          <Input
            id="roi-cost"
            type="number"
            min={1}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value) || 0)}
            className="bg-[#222] border-gray-700 text-gray-100"
          />
        </div>
      </div>

      <div className="text-center rounded-lg bg-brand-green/10 p-4">
        <p className="text-2xl font-bold text-brand-green">
          ${annualSavings.toLocaleString()}
        </p>
        <p className="text-sm text-gray-300 mt-1">Your estimated annual savings with OptiRFP</p>
        <p className="text-xs text-gray-300 mt-2">Most customers save $20,000+ per year</p>
      </div>
    </div>
  );
}
