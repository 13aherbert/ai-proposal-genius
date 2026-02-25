import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Bookmark, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { OpportunitySearchForm } from "@/components/opportunities/OpportunitySearchForm";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { OpportunityDetailModal } from "@/components/opportunities/OpportunityDetailModal";
import { SavedOpportunities } from "@/components/opportunities/SavedOpportunities";
import { useOpportunitySearch } from "@/hooks/use-opportunity-search";
import { useSubscription } from "@/hooks/subscription";
import { determineFeatureAccess, normalizePlanType } from "@/hooks/subscription/feature-access";
import type { Opportunity, SearchParams } from "@/hooks/use-opportunity-search";

const PAGE_SIZE = 25;

export default function Opportunities() {
  const { subscription, isLoading } = useSubscription();
  const planType = normalizePlanType(subscription?.plan_type);
  const hasPro = determineFeatureAccess("opportunity_search" as any, planType);

  const {
    results,
    totalRecords,
    isSearching,
    search,
    saveOpportunity,
    savedOpportunities,
    isLoadingSaved,
    loadSaved,
    updateStatus,
    updateNotes,
    deleteOpportunity,
  } = useOpportunitySearch();

  const [tab, setTab] = useState("search");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);
  const savedIds = new Set(savedOpportunities.map((s) => s.external_id));

  useEffect(() => {
    if (hasPro) {
      loadSaved();
    }
  }, [hasPro, loadSaved]);

  const handleSearch = (params: SearchParams) => {
    setCurrentPage(0);
    setLastSearchParams(params);
    search({ ...params, limit: PAGE_SIZE, offset: 0 });
  };

  const handlePageChange = (page: number) => {
    if (!lastSearchParams) return;
    setCurrentPage(page);
    search({ ...lastSearchParams, limit: PAGE_SIZE, offset: page * PAGE_SIZE });
  };

  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </main>
      </div>
    );
  }

  if (!hasPro) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pro Feature</h1>
          <p className="text-muted-foreground mb-6">
            Opportunity Search is available on Pro and Enterprise plans. Upgrade to search
            government RFP databases and find new business opportunities.
          </p>
          <Button asChild>
            <Link to="/subscription">Upgrade Plan</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Opportunity Finder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Search RFPs, contracts, and grant opportunities from SAM.gov and Grants.gov
          </p>
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

            {!isSearching && results.length === 0 && totalRecords === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Enter a keyword to search for RFP and grant opportunities</p>
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
      </main>
    </div>
  );
}
