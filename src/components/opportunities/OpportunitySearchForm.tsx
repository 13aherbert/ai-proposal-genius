import React, { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, X, RotateCcw, AlertTriangle } from "lucide-react";
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

const SOURCE_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "sam_gov", label: "SAM.gov" },
  { value: "grants_gov", label: "Grants.gov" },
];

const OPPORTUNITY_TYPE_OPTIONS = [
  { value: "", label: "Any Type" },
  { value: "contract", label: "Contract" },
  { value: "grant", label: "Grant" },
  { value: "ptype:o", label: "Solicitation (SAM.gov)" },
  { value: "ptype:p", label: "Presolicitation (SAM.gov)" },
  { value: "ptype:k", label: "Combined Synopsis/Solicitation (SAM.gov)" },
  { value: "ptype:r", label: "Sources Sought (SAM.gov)" },
  { value: "ptype:s", label: "Special Notice (SAM.gov)" },
];

export function OpportunitySearchForm({ onSearch, isSearching }: OpportunitySearchFormProps) {
  const [keyword, setKeyword] = useState("");
  const [postedFrom, setPostedFrom] = useState("");
  const [postedTo, setPostedTo] = useState("");
  const [naicsCode, setNaicsCode] = useState("");
  const [setAside, setSetAside] = useState("");
  const [source, setSource] = useState("all");
  const [opportunityType, setOpportunityType] = useState("");
  const [agency, setAgency] = useState("");

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (naicsCode) filters.push("NAICS");
    if (setAside && setAside !== "any_set_aside") filters.push("Set-Aside");
    if (opportunityType && opportunityType !== "any_type") filters.push("Type");
    if (agency) filters.push("Agency");
    if (postedFrom) filters.push("Posted After");
    if (postedTo) filters.push("Posted Before");
    if (source && source !== "all") filters.push("Source");
    return filters;
  }, [naicsCode, setAside, opportunityType, agency, postedFrom, postedTo, source]);

  const clearFilters = () => {
    setPostedFrom("");
    setPostedTo("");
    setNaicsCode("");
    setSetAside("");
    setSource("all");
    setOpportunityType("");
    setAgency("");
  };

  const resetAll = () => {
    setKeyword("");
    clearFilters();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVal = (v: string) => (v && !v.startsWith("any")) ? v : undefined;
    
    const isPtype = opportunityType.startsWith("ptype:");
    const ptypeValue = isPtype ? opportunityType.replace("ptype:", "") : undefined;
    const oppTypeValue = isPtype ? undefined : cleanVal(opportunityType);
    
    onSearch({
      keyword,
      postedFrom: postedFrom || undefined,
      postedTo: postedTo || undefined,
      naicsCode: naicsCode || undefined,
      setAside: cleanVal(setAside),
      source: source || "all",
      opportunityType: oppTypeValue,
      ptype: ptypeValue,
      agency: agency || undefined,
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

        {/* Active filter warning */}
        {keyword && activeFilters.length > 0 && (
          <div className="sm:col-span-2 lg:col-span-3 flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-foreground font-medium">{activeFilters.length} filter{activeFilters.length > 1 ? "s" : ""} active</span>
              <span className="text-muted-foreground"> ({activeFilters.join(", ")}). </span>
              <button type="button" onClick={clearFilters} className="text-primary underline underline-offset-2 hover:text-primary/80">
                Clear filters for broader results
              </button>
            </div>
          </div>
        )}

        <div>
          <Label>Source</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger>
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Opportunity Type</Label>
          <Select value={opportunityType} onValueChange={setOpportunityType}>
            <SelectTrigger>
              <SelectValue placeholder="Any Type" />
            </SelectTrigger>
            <SelectContent>
              {OPPORTUNITY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || "any_type"} value={opt.value || "any_type"}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="agency">Agency</Label>
          <Input
            id="agency"
            placeholder="e.g. Department of Defense"
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
            maxLength={100}
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
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isSearching} className="sm:w-auto">
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search Opportunities
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                  {activeFilters.length}
                </Badge>
              )}
            </>
          )}
        </Button>

        {activeFilters.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </Button>
        )}

        {(keyword || activeFilters.length > 0) && (
          <Button type="button" variant="ghost" size="sm" onClick={resetAll} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All
          </Button>
        )}
      </div>
    </form>
  );
}
