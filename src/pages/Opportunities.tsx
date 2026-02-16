import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Bookmark, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { OpportunitySearchForm } from "@/components/opportunities/OpportunitySearchForm";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { SavedOpportunities } from "@/components/opportunities/SavedOpportunities";
import { useOpportunitySearch } from "@/hooks/use-opportunity-search";
import { useSubscription } from "@/hooks/subscription";
import { determineFeatureAccess, normalizePlanType } from "@/hooks/subscription/feature-access";

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
    deleteOpportunity,
  } = useOpportunitySearch();

  const [tab, setTab] = useState("search");
  const savedIds = new Set(savedOpportunities.map((s) => s.external_id));

  useEffect(() => {
    if (hasPro) {
      loadSaved();
    }
  }, [hasPro, loadSaved]);

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
          <h1 className="text-2xl font-bold">Find Opportunities</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Search government RFP opportunities from SAM.gov
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
            <OpportunitySearchForm onSearch={search} isSearching={isSearching} />

            {results.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Showing {results.length} of {totalRecords} results
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((opp) => (
                <OpportunityCard
                  key={opp.external_id}
                  opportunity={opp}
                  onSave={saveOpportunity}
                  isSaved={savedIds.has(opp.external_id)}
                />
              ))}
            </div>

            {!isSearching && results.length === 0 && totalRecords === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Enter a keyword to search for RFP opportunities</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            <SavedOpportunities
              opportunities={savedOpportunities}
              isLoading={isLoadingSaved}
              onUpdateStatus={updateStatus}
              onDelete={deleteOpportunity}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
