import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Bookmark, Lock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { OpportunitySearchForm } from "@/components/opportunities/OpportunitySearchForm";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { OpportunityDetailModal } from "@/components/opportunities/OpportunityDetailModal";
import { SavedOpportunities } from "@/components/opportunities/SavedOpportunities";
import { OpportunityPreviewMode } from "@/components/opportunities/OpportunityPreviewMode";
import { useOpportunitySearch } from "@/hooks/use-opportunity-search";
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
    hasSearched,
    saveOpportunity,
    savedOpportunities,
    isLoadingSaved,
    loadSaved,
    updateStatus,
    updateNotes,
    deleteOpportunity,
  } = useOpportunitySearch();

  const { searchesUsed, searchesRemaining, isAtLimit, isUnlimited, incrementUsage } = useSearchUsage();

  const [tab, setTab] = useState("search");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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
    search({ ...params, limit: PAGE_SIZE, offset: 0 });
    await incrementUsage();
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

          <OpportunitySearchForm onSearch={handleSearch} isSearching={isSearching} />

          {results.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalRecords)} of {totalRecords} results
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((opp) => (
              <OpportunityCard
                key={`${opp.source}-${opp.external_id}`}
                opportunity={opp}
                onSave={saveOpportunity}
                onViewDetails={setSelectedOpportunity}
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

          {!isSearching && results.length === 0 && hasSearched && !isAtLimit && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
              {providerStatuses.some(s => s.status === "timeout") ? (
                <>
                  <p className="font-medium text-foreground">Search providers timed out</p>
                  <p className="text-sm mt-1">Try narrowing your search with more specific keywords or filters.</p>
                </>
              ) : providerStatuses.some(s => s.status === "api_error") ? (
                <>
                  <p className="font-medium text-foreground">Search providers returned an error</p>
                  <p className="text-sm mt-1">Please try again in a moment.</p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">No matching opportunities found</p>
                  <p className="text-sm mt-1">Try different keywords, a broader date range, or fewer filters.</p>
                </>
              )}
            </div>
          )}

          {!isSearching && !hasSearched && !isAtLimit && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Search for RFP and grant opportunities using keywords, NAICS codes, or agency names</p>
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
          />
        </TabsContent>
      </Tabs>

      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        open={!!selectedOpportunity}
        onOpenChange={(open) => !open && setSelectedOpportunity(null)}
        onSave={saveOpportunity}
        isSaved={selectedOpportunity ? savedIds.has(selectedOpportunity.external_id) : false}
      />

      <PlanComparisonModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} highlightPlan="business" />
    </>
  );
}
