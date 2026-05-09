import { useState } from "react";
import { ArrowLeft, Wrench, ChevronDown, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CategorySidebar } from "@/components/knowledge-base/CategorySidebar";
import { SearchBar } from "@/components/knowledge-base/SearchBar";
import { SearchResults } from "@/components/knowledge-base/SearchResults";
import { RecentEntries } from "@/components/knowledge-base/RecentEntries";
import { AddEntryDialog } from "@/components/knowledge-base/AddEntryDialog";
import { BulkParsingTrigger } from "@/components/knowledge-base/BulkParsingTrigger";
import { OrphanedFileRecovery } from "@/components/knowledge-base/OrphanedFileRecovery";
import { KnowledgeBaseAudit } from "@/components/knowledge-base/KnowledgeBaseAudit";
import { KBProgressHeader } from "@/components/knowledge-base/KBProgressHeader";
import { KBMilestones } from "@/components/knowledge-base/KBMilestones";
import { ViewEntryDialog } from "@/components/knowledge-base/ViewEntryDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/components/AuthProvider";
import { useKnowledgeBase } from "@/components/knowledge-base/hooks/useKnowledgeBase";
import { useStarterTemplates } from "@/components/knowledge-base/hooks/useStarterTemplates";
import { useKnowledgeReadiness } from "@/hooks/use-knowledge-readiness";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import type { SearchResult } from "@/components/knowledge-base/SearchResults";
import { useKBGovernance } from "@/components/knowledge-base/governance/useKBGovernance";
import { KBHealthDashboard } from "@/components/knowledge-base/governance/KBHealthDashboard";
import { useSEO } from "@/hooks/use-seo";
import { ReviewCycleManager } from "@/components/knowledge-base/governance/ReviewCycleManager";
import { QAPairManager } from "@/components/knowledge-base/governance/QAPairManager";

const KnowledgeBase = () => {
  useSEO({ title: "Knowledge Base — OptiRFP", description: "Manage the company facts, case studies, and capabilities OptiRFP uses to draft proposals." });
  const navigate = useNavigate();
  const { session } = useAuth();
  const { 
    open, 
    setOpen, 
    selectedCategory, 
    setSelectedCategory, 
    categories,
    searchQuery,
    searchResults,
    isSearching,
    handleSearchChange,
    clearSearch,
  } = useKnowledgeBase();
  const { isSeeding, seedingProgress } = useStarterTemplates();
  const readiness = useKnowledgeReadiness();
  const [showGovernance, setShowGovernance] = useState(false);
  const governance = useKBGovernance(showGovernance);

  const [selectedSearchEntry, setSelectedSearchEntry] = useState<SearchResult | null>(null);
  const categoryLastUpdated = readiness.categoryLastUpdated;

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      {isSeeding && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-medium">Setting up starter templates...</p>
          <Progress value={seedingProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">{seedingProgress}% complete</p>
        </div>
      )}
      {!isSeeding && <KBProgressHeader readiness={readiness} />}
      <KBMilestones readiness={readiness} />

      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-green">
            Knowledge Base
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showGovernance ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGovernance(!showGovernance)}
          >
            <ShieldCheck className="h-4 w-4 mr-1" />
            Governance
          </Button>
          <AddEntryDialog 
            categories={categories}
            open={open}
            onOpenChange={setOpen}
          />
        </div>
      </header>

      {/* Governance Panel */}
      {showGovernance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <KBHealthDashboard
            healthScores={governance.healthScores}
            onRecalculate={governance.calculateHealthScores}
            isLoading={governance.isLoading}
          />
          <ReviewCycleManager
            reviewCycles={governance.reviewCycles}
            onUpsertCycle={governance.upsertReviewCycle}
            onMarkReviewed={governance.markAsReviewed}
          />
          <QAPairManager
            qaPairs={governance.qaPairs}
            onAdd={governance.addQAPair}
            onDelete={governance.deleteQAPair}
            selectedCategory={selectedCategory}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <CategorySidebar 
          categories={categories} 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCoverage={readiness.categoryCoverage}
          templateOnlyCategories={readiness.templateOnlyCategories}
          categoryLastUpdated={categoryLastUpdated}
        />
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            resultCount={isSearchActive ? searchResults.length : undefined}
            isSearching={isSearching}
          />

          {isSearchActive ? (
            <SearchResults
              results={searchResults}
              searchQuery={searchQuery}
              onViewEntry={setSelectedSearchEntry}
              onClearSearch={clearSearch}
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
              <div className="xl:col-span-3">
                <RecentEntries 
                  selectedCategory={selectedCategory} 
                  categories={categories}
                />
              </div>
              <div className="xl:col-span-1">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Maintenance Tools
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4">
                    <KnowledgeBaseAudit />
                    <BulkParsingTrigger />
                    <OrphanedFileRecovery />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedSearchEntry && (
        <ViewEntryDialog
          open={!!selectedSearchEntry}
          onOpenChange={(isOpen) => !isOpen && setSelectedSearchEntry(null)}
          title={selectedSearchEntry.title}
          category={selectedSearchEntry.category}
          categories={categories}
          onEntryUpdated={() => handleSearchChange(searchQuery)}
        />
      )}
    </div>
  );
};

export default KnowledgeBase;
