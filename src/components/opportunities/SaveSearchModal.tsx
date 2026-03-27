import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bell, Clock, Zap } from "lucide-react";
import type { SearchParams } from "@/hooks/use-opportunity-search";

interface SaveSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchParams: SearchParams;
  onSave: (name: string, params: SearchParams, frequency: "daily" | "weekly" | "immediate") => Promise<void>;
}

export function SaveSearchModal({ open, onOpenChange, searchParams, onSave }: SaveSearchModalProps) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "immediate">("daily");
  const [saving, setSaving] = useState(false);

  const generateDefaultName = () => {
    const parts: string[] = [];
    if (searchParams.keyword) parts.push(searchParams.keyword);
    if (searchParams.sources?.length && searchParams.sources.length < 5) {
      const sourceMap: Record<string, string> = {
        sam_gov: "SAM",
        grants_gov: "Grants",
        california_eprocure: "CA",
        texas_smartbuy: "TX",
        new_york: "NY",
      };
      parts.push(`in ${searchParams.sources.map((s) => sourceMap[s] || s).join(", ")}`);
    }
    if (searchParams.naicsCode) parts.push(`NAICS ${searchParams.naicsCode}`);
    return parts.length > 0 ? parts.join(" ") : "My Search";
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && !name) {
      setName(generateDefaultName());
    }
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), searchParams, frequency);
      setName("");
      setFrequency("daily");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Save This Search
          </DialogTitle>
          <DialogDescription>
            Get notified when new opportunities match your search criteria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="search-name">Search Name</Label>
            <Input
              id="search-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., IT Contracts in California"
            />
          </div>

          <div className="space-y-2">
            <Label>Alert Frequency</Label>
            <RadioGroup value={frequency} onValueChange={(v) => setFrequency(v as any)} className="space-y-2">
              <div className="flex items-center space-x-3 rounded-md border p-3">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Daily Digest</p>
                    <p className="text-xs text-muted-foreground">One email per day with all new matches</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-md border p-3">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Weekly Summary</p>
                    <p className="text-xs text-muted-foreground">Weekly roundup of new opportunities</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-md border p-3">
                <RadioGroupItem value="immediate" id="immediate" />
                <Label htmlFor="immediate" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Immediate</p>
                    <p className="text-xs text-muted-foreground">Notified as soon as matches are found (max 1/day)</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Search params summary */}
          <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-sm">Search Criteria</p>
            {searchParams.keyword && <p>Keyword: {searchParams.keyword}</p>}
            {searchParams.sources?.length ? <p>Sources: {searchParams.sources.join(", ")}</p> : null}
            {searchParams.naicsCode && <p>NAICS: {searchParams.naicsCode}</p>}
            {searchParams.setAside && <p>Set-Aside: {searchParams.setAside}</p>}
            {searchParams.agency && <p>Agency: {searchParams.agency}</p>}
            {!searchParams.keyword && !searchParams.naicsCode && !searchParams.agency && (
              <p className="italic">All opportunities (no keyword filter)</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Saving..." : "Save & Enable Alerts"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
