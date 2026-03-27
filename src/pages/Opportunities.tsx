import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Bookmark, AlertCircle, Clock, WifiOff, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { OpportunitySearchForm } from "@/components/opportunities/OpportunitySearchForm";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { OpportunityDetailModal } from "@/components/opportunities/OpportunityDetailModal";
import { SavedOpportunities } from "@/components/opportunities/SavedOpportunities";
import { OpportunityPreviewMode } from "@/components/opportunities/OpportunityPreviewMode";
import { SearchProgressIndicator } from "@/components/opportunities/SearchProgressIndicator";
import { SaveSearchModal } from "@/components/opportunities/SaveSearchModal";
import { SavedSearchesList } from "@/components/opportunities/SavedSearchesList";
import { DraftProposalDialog } from "@/components/opportunities/DraftProposalDialog";
import { useOpportunitySearch } from "@/hooks/use-opportunity-search";
import { useSavedSearches } from "@/hooks/use-saved-searches";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { useSearchUsage } from "@/hooks/use-search-usage";
import { PlanComparisonModal } from "@/components/subscription/PlanComparisonModal";
import type { Opportunity, SearchParams } from "@/hooks/use-opportunity-search";

const PAGE_SIZE = 25;

export default function Opportunities() {
  const { hasFeature, isLoading, plan } = useSubscriptionFeatures();
  const hasAccess = hasFeature("opportunity_search");

  const {
    results,
    totalRecords,
    isSearching,
    search,
    providerStatuses,
    searchState,
    saveOpportunity,
    savedOpportunities,
    isLoadingSaved,
    loadSaved,
    updateStatus,
    updateNotes,
    deleteOpportunity,
    searchingProviders,
  } = useOpportunitySearch();

  const { searchesUsed, searchesRemaining, isAtLimit, isUnlimited, refetch: refetchUsage } = useSearchUsage();

  const { savedSearches, isLoading: isLoadingSavedSearches, saveSearch, updateSearch, deleteSearch } = useSavedSearches();

  const [tab, setTab] = useState("search");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const savedIds = new Set(savedOpportunities.map((s) => s.external_id));

  useEffect(() => {
    if (hasAccess) {
      loadSaved();
    }
  }, [hasAccess, loadSaved]);

  const handleSearch = async (params: SearchParams) => {
    if (isAtLimit) {
      setShowUpgradeModal(true);
      return;
    }
    setCurrentPage(0);
    setLastSearchParams(params);
    await search({ ...params, limit: PAGE_SIZE, offset: 0 });
    // Usage is tracked server-side only — just refetch the count
    await refetchUsage();
  };

  const handlePageChange = (page: number) => {
    if (!lastSearchParams) return;
    setCurrentPage(page);
    search({ ...lastSearchParams, limit: PAGE_SIZE, offset: page * PAGE_SIZE });
  };

  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-4" />
        <Skeleton className="h-4 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-56 mx-auto" />
      </div>
    );
  }

  if (!hasAccess) {
    return <OpportunityPreviewMode />;
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Opportunity Finder</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Search RFPs, contracts, and grant opportunities from SAM.gov and Grants.gov
            </p>
          </div>
          {!isUnlimited && (
            <Badge variant={isAtLimit ? "destructive" : searchesRemaining <= 3 ? "secondary" : "outline"} className="text-xs">
              {isAtLimit ? (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Search limit reached
                </span>
              ) : (
                `${searchesRemaining} of 10 searches remaining`
              )}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="search" className="gap-1.5">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-1.5">
            <Bookmark className="h-4 w-4" />
            Saved ({savedOpportunities.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5">
            <Bell className="h-4 w-4" />
            Alerts ({savedSearches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          {isAtLimit && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-center">
              <p className="text-sm font-medium text-foreground mb-1">You've used all 10 searches this month</p>
              <p className="text-xs text-muted-foreground mb-3">Upgrade to Business for unlimited searches</p>
              <Button size="sm" onClick={() => setShowUpgradeModal(true)}>
                Upgrade to Business — $499/month
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <OpportunitySearchForm onSearch={handleSearch} isSearching={isSearching} />
            </div>
            {lastSearchParams && searchState === "success" && (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => setShowSaveSearchModal(true)}
              >
                <Bell className="h-4 w-4 mr-1" />
                Save Search
              </Button>
            )}
          </div>

          <SearchProgressIndicator isSearching={isSearching} providers={searchingProviders} />

          {results.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalRecords)} of {totalRecords} results
            </p>
          )}

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((opp) => (
              <OpportunityCard
                key={`${opp.source}-${opp.external_id}`}
                opportunity={opp}
                onSave={saveOpportunity}
                onViewDetails={setSelectedOpportunity}
                onDraftProposal={setDraftOpportunity}
                isSaved={savedIds.has(opp.external_id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 0 || isSearching}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages - 1 || isSearching}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}

          {/* Timed out state */}
          {!isSearching && searchState === "timed_out" && (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-50 text-warning" />
              <p className="font-medium text-foreground">Search timed out</p>
              <p className="text-sm mt-1">
                The search providers took too long to respond. Try:
              </p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Adding a keyword to narrow results</li>
                <li>• Selecting a specific source (SAM.gov or Grants.gov)</li>
                <li>• Setting a shorter date range</li>
              </ul>
              {lastSearchParams && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => handleSearch(lastSearchParams)}
                >
                  Retry Search
                </Button>
              )}
            </div>
          )}

          {/* Error state */}
          {!isSearching && searchState === "error" && (
            <div className="text-center py-12 text-muted-foreground">
              <WifiOff className="h-10 w-10 mx-auto mb-3 opacity-50 text-destructive" />
              {providerStatuses.some(s => s.status === "invalid_api_key") ? (
                <>
                  <p className="font-medium text-foreground">API Key Issue</p>
                  <p className="text-sm mt-1">
                    {providerStatuses.filter(s => s.status === "invalid_api_key").map(s => s.provider).join(", ")} rejected the API key. 
                    Please verify the key is valid and has not expired.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">Search providers returned an error</p>
                  <p className="text-sm mt-1">Please try again in a moment.</p>
                </>
              )}
              {providerStatuses.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {providerStatuses.map((s) => (
                    <Badge key={s.provider} variant={s.status === "success" ? "default" : s.status === "skipped" ? "secondary" : "destructive"} className="text-xs">
                      {s.provider}: {s.status}{s.message ? ` — ${s.message}` : ""}
                    </Badge>
                  ))}
                </div>
              )}
              {lastSearchParams && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => handleSearch(lastSearchParams)}
                >
                  Retry Search
                </Button>
              )}
            </div>
          )}

          {/* Empty results state */}
          {!isSearching && searchState === "empty" && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-foreground">No matching opportunities found</p>
              <p className="text-sm mt-1">Try different keywords, a broader date range, or fewer filters.</p>
              {providerStatuses.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {providerStatuses.map((s) => (
                    <Badge key={s.provider} variant="secondary" className="text-xs">
                      {s.provider}: {s.status === "no_results" ? "0 results" : s.status}{s.message ? ` — ${s.message}` : ""}
                    </Badge>
                  ))}
                </div>
              )}
              {lastSearchParams && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => handleSearch(lastSearchParams)}
                >
                  Retry Search
                </Button>
              )}
            </div>
          )}

          {/* Idle state */}
          {!isSearching && searchState === "idle" && !isAtLimit && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Search for RFP and grant opportunities using keywords, NAICS codes, agency names, or filters</p>
              <p className="text-xs mt-2 opacity-75">
                NAICS-only searches automatically target SAM.gov for faster results
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved">
          <SavedOpportunities
            opportunities={savedOpportunities}
            isLoading={isLoadingSaved}
            onUpdateStatus={updateStatus}
            onUpdateNotes={updateNotes}
            onDelete={deleteOpportunity}
            onDraftProposal={setDraftOpportunity}
          />
        </TabsContent>

        <TabsContent value="alerts">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Saved Searches & Alerts</h2>
                <p className="text-sm text-muted-foreground">
                  Get notified when new opportunities match your saved search criteria
                </p>
              </div>
            </div>
            <SavedSearchesList
              savedSearches={savedSearches}
              isLoading={isLoadingSavedSearches}
              onUpdate={updateSearch}
              onDelete={deleteSearch}
              onRunSearch={(params) => {
                setTab("search");
                handleSearch(params);
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        open={!!selectedOpportunity}
        onOpenChange={(open) => !open && setSelectedOpportunity(null)}
        onSave={saveOpportunity}
        onDraftProposal={setDraftOpportunity}
        isSaved={selectedOpportunity ? savedIds.has(selectedOpportunity.external_id) : false}
      />

      <DraftProposalDialog
        opportunity={draftOpportunity}
        open={!!draftOpportunity}
        onOpenChange={(open) => !open && setDraftOpportunity(null)}
      />

      {lastSearchParams && (
        <SaveSearchModal
          open={showSaveSearchModal}
          onOpenChange={setShowSaveSearchModal}
          searchParams={lastSearchParams}
          onSave={saveSearch}
        />
      )}

      <PlanComparisonModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} highlightPlan="business" />
    </>
  );
}
