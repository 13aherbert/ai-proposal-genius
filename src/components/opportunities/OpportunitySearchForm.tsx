import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import type { SearchParams } from "@/hooks/use-opportunity-search";

interface OpportunitySearchFormProps {
  onSearch: (params: SearchParams) => void;
  isSearching: boolean;
}

const SET_ASIDE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "SBA", label: "Small Business" },
  { value: "SBP", label: "Small Business Set-Aside (Partial)" },
  { value: "8A", label: "8(a)" },
  { value: "8AN", label: "8(a) Sole Source" },
  { value: "HZC", label: "HUBZone" },
  { value: "SDVOSBC", label: "Service-Disabled Veteran-Owned" },
  { value: "WOSB", label: "Women-Owned Small Business" },
];

const SOLICITATION_TYPES = [
  { value: "", label: "Any Type" },
  { value: "o", label: "Solicitation" },
  { value: "p", label: "Presolicitation" },
  { value: "k", label: "Combined Synopsis/Solicitation" },
  { value: "r", label: "Sources Sought" },
  { value: "s", label: "Special Notice" },
];

export function OpportunitySearchForm({ onSearch, isSearching }: OpportunitySearchFormProps) {
  const [keyword, setKeyword] = useState("");
  const [postedFrom, setPostedFrom] = useState("");
  const [postedTo, setPostedTo] = useState("");
  const [naicsCode, setNaicsCode] = useState("");
  const [setAside, setSetAside] = useState("");
  const [ptype, setPtype] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      keyword,
      postedFrom: postedFrom || undefined,
      postedTo: postedTo || undefined,
      naicsCode: naicsCode || undefined,
      setAside: setAside || undefined,
      ptype: ptype || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6 border rounded-lg bg-card">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <Label htmlFor="keyword">Keyword</Label>
          <Input
            id="keyword"
            placeholder="e.g. cybersecurity, construction, IT services..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            maxLength={200}
          />
        </div>

        <div>
          <Label htmlFor="postedFrom">Posted After</Label>
          <Input
            id="postedFrom"
            type="date"
            value={postedFrom}
            onChange={(e) => setPostedFrom(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="postedTo">Posted Before</Label>
          <Input
            id="postedTo"
            type="date"
            value={postedTo}
            onChange={(e) => setPostedTo(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="naicsCode">NAICS Code</Label>
          <Input
            id="naicsCode"
            placeholder="e.g. 541512"
            value={naicsCode}
            onChange={(e) => setNaicsCode(e.target.value)}
            maxLength={10}
          />
        </div>

        <div>
          <Label>Set-Aside Type</Label>
          <Select value={setAside} onValueChange={setSetAside}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              {SET_ASIDE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || "any"} value={opt.value || "any_set_aside"}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Solicitation Type</Label>
          <Select value={ptype} onValueChange={setPtype}>
            <SelectTrigger>
              <SelectValue placeholder="Any Type" />
            </SelectTrigger>
            <SelectContent>
              {SOLICITATION_TYPES.map((opt) => (
                <SelectItem key={opt.value || "any"} value={opt.value || "any_type"}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isSearching} className="w-full sm:w-auto">
        {isSearching ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Search Opportunities
          </>
        )}
      </Button>
    </form>
  );
}
