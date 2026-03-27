import React, { useState, useMemo, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Loader2,
  X,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  SlidersHorizontal,
  Globe,
  MapPin,
} from "lucide-react";
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

const OPPORTUNITY_TYPE_OPTIONS = [
  { value: "", label: "Any Type" },
  { value: "contract", label: "Contract" },
  { value: "grant", label: "Grant" },
  { value: "ptype:o", label: "Solicitation (SAM.gov)" },
  { value: "ptype:k", label: "Combined Synopsis/Solicitation (SAM.gov)" },
  { value: "ptype:r", label: "Sources Sought (SAM.gov)" },
  { value: "ptype:s", label: "Special Notice (SAM.gov)" },
  { value: "ptype:a", label: "Award Notice (SAM.gov)" },
];

interface SourceOption {
  value: string;
  label: string;
  shortLabel: string;
}

const FEDERAL_SOURCES: SourceOption[] = [
  { value: "sam_gov", label: "SAM.gov", shortLabel: "SAM" },
  { value: "grants_gov", label: "Grants.gov", shortLabel: "Grants" },
];

const STATE_SOURCES: SourceOption[] = [
  { value: "california_eprocure", label: "California eProcure", shortLabel: "CA" },
  { value: "texas_smartbuy", label: "Texas SmartBuy", shortLabel: "TX" },
  { value: "new_york", label: "New York State", shortLabel: "NY" },
];

const ALL_SOURCES = [...FEDERAL_SOURCES, ...STATE_SOURCES];

const STORAGE_KEY = "opportunity-search-sources";

function loadSavedSources(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.every((s: unknown) => typeof s === "string")) {
        // Validate all values still exist
        const validValues = new Set(ALL_SOURCES.map((s) => s.value));
        const filtered = parsed.filter((s: string) => validValues.has(s));
        return filtered.length > 0 ? filtered : FEDERAL_SOURCES.map((s) => s.value);
      }
    }
  } catch {}
  return FEDERAL_SOURCES.map((s) => s.value);
}

function saveSources(sources: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  } catch {}
}

export function OpportunitySearchForm({ onSearch, isSearching }: OpportunitySearchFormProps) {
  const [keyword, setKeyword] = useState("");
  const [postedFrom, setPostedFrom] = useState("");
  const [postedTo, setPostedTo] = useState("");
  const [naicsCode, setNaicsCode] = useState("");
  const [setAside, setSetAside] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(loadSavedSources);
  const [opportunityType, setOpportunityType] = useState("");
  const [agency, setAgency] = useState("");
  const [includePreSolicitations, setIncludePreSolicitations] = useState(false);
  const [federalOpen, setFederalOpen] = useState(true);
  const [stateOpen, setStateOpen] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Persist source preferences
  useEffect(() => {
    saveSources(selectedSources);
  }, [selectedSources]);

  const toggleSource = (value: string) => {
    setSelectedSources((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const selectAll = () => setSelectedSources(ALL_SOURCES.map((s) => s.value));
  const clearAllSources = () => setSelectedSources([]);

  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string }[] = [];
    if (naicsCode) filters.push({ key: "naics", label: `NAICS: ${naicsCode}` });
    if (setAside && setAside !== "any_set_aside") {
      const opt = SET_ASIDE_OPTIONS.find((o) => o.value === setAside);
      filters.push({ key: "setAside", label: opt?.label || setAside });
    }
    if (opportunityType && opportunityType !== "any_type") {
      const opt = OPPORTUNITY_TYPE_OPTIONS.find((o) => o.value === opportunityType);
      filters.push({ key: "type", label: opt?.label || opportunityType });
    }
    if (agency) filters.push({ key: "agency", label: `Agency: ${agency}` });
    if (postedFrom) filters.push({ key: "postedFrom", label: `After: ${postedFrom}` });
    if (postedTo) filters.push({ key: "postedTo", label: `Before: ${postedTo}` });
    if (includePreSolicitations) filters.push({ key: "preSol", label: "Pre-Solicitations" });
    // Show which sources are selected if not all
    if (selectedSources.length > 0 && selectedSources.length < ALL_SOURCES.length) {
      const labels = selectedSources.map((v) => ALL_SOURCES.find((s) => s.value === v)?.shortLabel || v);
      filters.push({ key: "sources", label: `Sources: ${labels.join(", ")}` });
    }
    return filters;
  }, [naicsCode, setAside, opportunityType, agency, postedFrom, postedTo, includePreSolicitations, selectedSources]);

  const removeFilter = (key: string) => {
    switch (key) {
      case "naics": setNaicsCode(""); break;
      case "setAside": setSetAside(""); break;
      case "type": setOpportunityType(""); break;
      case "agency": setAgency(""); break;
      case "postedFrom": setPostedFrom(""); break;
      case "postedTo": setPostedTo(""); break;
      case "preSol": setIncludePreSolicitations(false); break;
      case "sources": selectAll(); break;
    }
  };

  const clearFilters = () => {
    setPostedFrom("");
    setPostedTo("");
    setNaicsCode("");
    setSetAside("");
    setOpportunityType("");
    setAgency("");
    setIncludePreSolicitations(false);
    selectAll();
  };

  const resetAll = () => {
    setKeyword("");
    clearFilters();
    setSelectedSources(FEDERAL_SOURCES.map((s) => s.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilterDrawerOpen(false);
    const cleanVal = (v: string) => (v && !v.startsWith("any")) ? v : undefined;

    const isPtype = opportunityType.startsWith("ptype:");
    const ptypeValue = isPtype ? opportunityType.replace("ptype:", "") : includePreSolicitations ? "p" : undefined;
    const oppTypeValue = isPtype ? undefined : cleanVal(opportunityType);

    // Convert sources array to format the edge function expects
    const sources = selectedSources.length === 0 || selectedSources.length === ALL_SOURCES.length
      ? ["all"]
      : selectedSources;

    onSearch({
      keyword,
      postedFrom: postedFrom || undefined,
      postedTo: postedTo || undefined,
      naicsCode: naicsCode || undefined,
      setAside: cleanVal(setAside),
      sources,
      opportunityType: oppTypeValue,
      ptype: ptypeValue,
      agency: agency || undefined,
    });
  };

  const sourceCount = selectedSources.length === 0 || selectedSources.length === ALL_SOURCES.length
    ? ALL_SOURCES.length
    : selectedSources.length;

  // Source selection UI (shared between desktop and mobile)
  const SourceSelectionContent = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Sources</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            Select All
          </button>
          <span className="text-muted-foreground text-xs">·</span>
          <button
            type="button"
            onClick={clearAllSources}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      <Collapsible open={federalOpen} onOpenChange={setFederalOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-sm font-medium text-foreground hover:text-primary transition-colors py-1">
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${federalOpen ? "" : "-rotate-90"}`} />
          <Globe className="h-3.5 w-3.5 text-primary" />
          Federal Sources
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 h-4">
            {FEDERAL_SOURCES.filter((s) => selectedSources.includes(s.value)).length}/{FEDERAL_SOURCES.length}
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-5 pt-1 space-y-1.5">
          {FEDERAL_SOURCES.map((src) => (
            <label
              key={src.value}
              className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selectedSources.includes(src.value)}
                onCheckedChange={() => toggleSource(src.value)}
              />
              <span className="text-sm">{src.label}</span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={stateOpen} onOpenChange={setStateOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-sm font-medium text-foreground hover:text-primary transition-colors py-1">
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${stateOpen ? "" : "-rotate-90"}`} />
          <MapPin className="h-3.5 w-3.5 text-accent" />
          State Sources
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 h-4">
            {STATE_SOURCES.filter((s) => selectedSources.includes(s.value)).length}/{STATE_SOURCES.length}
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-5 pt-1 space-y-1.5">
          {STATE_SOURCES.map((src) => (
            <label
              key={src.value}
              className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selectedSources.includes(src.value)}
                onCheckedChange={() => toggleSource(src.value)}
              />
              <span className="text-sm">{src.label}</span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Pre-Solicitations toggle */}
      <div className="border-t pt-3 mt-3">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="pre-sol-toggle" className="text-sm font-medium cursor-pointer">
              Include Pre-Solicitations
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Early notices from SAM.gov (30-90 days ahead)
            </p>
          </div>
          <Switch
            id="pre-sol-toggle"
            checked={includePreSolicitations}
            onCheckedChange={setIncludePreSolicitations}
          />
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Desktop side panel for sources */}
        <div className="hidden lg:block w-64 shrink-0 border rounded-lg bg-card p-4">
          <SourceSelectionContent />
        </div>

        {/* Main search form */}
        <div className="flex-1 space-y-4 p-4 sm:p-6 border rounded-lg bg-card">
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
              <div className="sm:col-span-2 lg:col-span-3 flex items-start gap-2 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <div>
                  <span className="text-foreground font-medium">
                    {activeFilters.length} filter{activeFilters.length > 1 ? "s" : ""} active
                  </span>
                  <span className="text-muted-foreground">
                    {" "}({activeFilters.map((f) => f.label).join(", ")}). 
                  </span>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    Clear filters for broader results
                  </button>
                </div>
              </div>
            )}

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

          {/* Active filter badges */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {activeFilters.map((f) => (
                <Badge
                  key={f.key}
                  variant="secondary"
                  className="gap-1 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={() => removeFilter(f.key)}
                >
                  {f.label}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {/* Mobile filter drawer trigger */}
            <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="lg:hidden gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Sources
                  <Badge variant="secondary" className="text-[10px] px-1.5 h-4 ml-0.5">
                    {sourceCount}
                  </Badge>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh]">
                <SheetHeader>
                  <SheetTitle>Search Sources & Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto">
                  <SourceSelectionContent />
                </div>
              </SheetContent>
            </Sheet>

            <Button type="submit" disabled={isSearching || selectedSources.length === 0} className="sm:w-auto">
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search {sourceCount} source{sourceCount !== 1 ? "s" : ""}
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
        </div>
      </div>
    </form>
  );
}
