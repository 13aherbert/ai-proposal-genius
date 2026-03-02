import { ArrowLeft, Wrench, ChevronDown, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CategorySidebar } from "@/components/knowledge-base/CategorySidebar";
import { SearchBar } from "@/components/knowledge-base/SearchBar";
import { RecentEntries } from "@/components/knowledge-base/RecentEntries";
import { AddEntryDialog } from "@/components/knowledge-base/AddEntryDialog";
import { BulkParsingTrigger } from "@/components/knowledge-base/BulkParsingTrigger";
import { OrphanedFileRecovery } from "@/components/knowledge-base/OrphanedFileRecovery";
import { KnowledgeBaseAudit } from "@/components/knowledge-base/KnowledgeBaseAudit";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/components/AuthProvider";
import { useKnowledgeBase } from "@/components/knowledge-base/hooks/useKnowledgeBase";
import { useStarterTemplates } from "@/components/knowledge-base/hooks/useStarterTemplates";
import { useKBCompletion } from "@/components/knowledge-base/hooks/useKBCompletion";
import { Progress } from "@/components/ui/progress";

const KnowledgeBase = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { 
    open, 
    setOpen, 
    selectedCategory, 
    setSelectedCategory, 
    categories 
  } = useKnowledgeBase();
  const { isSeeding, seedingProgress } = useStarterTemplates();
  const { completedCount, totalCategories, allComplete, isLoading: completionLoading } = useKBCompletion();

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      {isSeeding && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-medium">Setting up starter templates...</p>
          <Progress value={seedingProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">{seedingProgress}% complete</p>
        </div>
      )}
      {!isSeeding && !completionLoading && !allComplete && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Knowledge Base Completion</h4>
            <span className="text-sm font-medium text-muted-foreground">
              {completedCount} of {totalCategories}
            </span>
          </div>
          <Progress value={(completedCount / totalCategories) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Replace template content with your actual company information for better proposals
          </p>
        </div>
      )}
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
            <AddEntryDialog 
              categories={categories}
              open={open}
              onOpenChange={setOpen}
            />
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            <CategorySidebar 
              categories={categories} 
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <div className="lg:col-span-3 space-y-4 sm:space-y-6">
              <SearchBar />
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
            </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
