
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CategorySidebar } from "@/components/knowledge-base/CategorySidebar";
import { SearchBar } from "@/components/knowledge-base/SearchBar";
import { RecentEntries } from "@/components/knowledge-base/RecentEntries";
import { AddEntryDialog } from "@/components/knowledge-base/AddEntryDialog";
import { BulkParsingTrigger } from "@/components/knowledge-base/BulkParsingTrigger";
import { TriggerBatchParsing } from "@/components/knowledge-base/TriggerBatchParsing";
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
      <TriggerBatchParsing />
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-8 h-full">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold text-brand-green">
                Knowledge Base
              </h1>
            </div>
            <AddEntryDialog 
              categories={categories}
              open={open}
              onOpenChange={setOpen}
            />
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-5rem)]">
            <CategorySidebar 
              categories={categories} 
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <div className="lg:col-span-3 space-y-6">
              <SearchBar />
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3">
                  <RecentEntries 
                    selectedCategory={selectedCategory} 
                    categories={categories}
                  />
                </div>
                <div className="xl:col-span-1">
                  <BulkParsingTrigger />
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
