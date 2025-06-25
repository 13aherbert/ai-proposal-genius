
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CategorySidebar } from "@/components/knowledge-base/CategorySidebar";
import { SearchBar } from "@/components/knowledge-base/SearchBar";
import { RecentEntries } from "@/components/knowledge-base/RecentEntries";
import { AddEntryDialog } from "@/components/knowledge-base/AddEntryDialog";
import { EmptyKnowledgeState } from "@/components/knowledge-base/EmptyKnowledgeState";
import { InitialKnowledgeSetup } from "@/components/knowledge-base/InitialKnowledgeSetup";
import { useAuth } from "@/components/AuthProvider";
import { useKnowledgeBase } from "@/components/knowledge-base/hooks/useKnowledgeBase";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const [hasEntries, setHasEntries] = useState<boolean | null>(null);
  const [showInitialSetup, setShowInitialSetup] = useState(false);

  useEffect(() => {
    const checkExistingEntries = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('knowledge_entries')
        .select('entry_id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (!error) {
        setHasEntries((data?.length || 0) > 0);
      }
    };

    checkExistingEntries();
  }, [session?.user?.id]);

  const handleGenerateInitial = () => {
    setShowInitialSetup(true);
  };

  const handleInitialSetupComplete = () => {
    setShowInitialSetup(false);
    setHasEntries(true);
    // Refresh the entries by triggering a re-render
    window.location.reload();
  };

  // Show loading state while checking entries
  if (hasEntries === null) {
    return (
      <div className="min-h-screen w-full bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
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
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show initial setup modal
  if (showInitialSetup) {
    return (
      <div className="min-h-screen w-full bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowInitialSetup(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-brand-green">
              Knowledge Base Setup
            </h1>
          </div>
          <InitialKnowledgeSetup onComplete={handleInitialSetupComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
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
            {hasEntries && (
              <AddEntryDialog 
                categories={categories}
                open={open}
                onOpenChange={setOpen}
              />
            )}
          </header>

          {!hasEntries ? (
            <EmptyKnowledgeState 
              onAddEntry={() => setOpen(true)}
              onGenerateInitial={handleGenerateInitial}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-5rem)]">
              <CategorySidebar 
                categories={categories} 
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
              <div className="lg:col-span-3 space-y-6">
                <SearchBar />
                <RecentEntries 
                  selectedCategory={selectedCategory} 
                  categories={categories}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
