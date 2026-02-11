import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CategorySidebar } from "@/components/knowledge-base/CategorySidebar";
import { SearchBar } from "@/components/knowledge-base/SearchBar";
import { RecentEntries } from "@/components/knowledge-base/RecentEntries";
import { AddEntryDialog } from "@/components/knowledge-base/AddEntryDialog";
import { BulkParsingTrigger } from "@/components/knowledge-base/BulkParsingTrigger";
import { OrphanedFileRecovery } from "@/components/knowledge-base/OrphanedFileRecovery";
import { KnowledgeBaseAudit } from "@/components/knowledge-base/KnowledgeBaseAudit";
import { useAuth } from "@/components/AuthProvider";
import { useKnowledgeBase } from "@/components/knowledge-base/hooks/useKnowledgeBase";

/**
 * KnowledgeBase page component
 * 
 * Provides a user interface for managing and accessing knowledge base entries
 * organized by categories. Includes:
 * - Category navigation sidebar
 * - Search functionality
 * - Viewing and adding entries
 */
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

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col gap-4 sm:gap-8">
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
                <div className="xl:col-span-1 space-y-4">
                  <KnowledgeBaseAudit />
                  <BulkParsingTrigger />
                  <OrphanedFileRecovery />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
