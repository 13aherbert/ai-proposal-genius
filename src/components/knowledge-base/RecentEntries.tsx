import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KnowledgeEntry, KnowledgeCategory } from "./types";
import { ViewEntryDialog } from "./ViewEntryDialog";
import { useEntries } from "./entries/useEntries";
import { EntryList } from "./entries/EntryList";

interface RecentEntriesProps {
  selectedCategory: string | null;
  categories: KnowledgeCategory[];
}

/**
 * RecentEntries component displays a list of knowledge base entries
 * with filtering by category and entry viewing functionality
 */
export const RecentEntries = ({ selectedCategory, categories }: RecentEntriesProps) => {
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const { entries, isLoading, fetchEntries } = useEntries(selectedCategory);

  useEffect(() => {
    fetchEntries();
  }, [selectedCategory]);

  if (isLoading) {
    return (
      <Card className="bg-secondary/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>
            {selectedCategory ? `${selectedCategory} Entries` : 'All Entries'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">Loading entries...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-secondary/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>
            {selectedCategory ? `${selectedCategory} Entries` : 'All Entries'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EntryList 
            entries={entries}
            onViewEntry={setSelectedEntry}
          />
        </CardContent>
      </Card>

      {selectedEntry && (
        <ViewEntryDialog
          open={!!selectedEntry}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
          title={selectedEntry.title}
          category={selectedEntry.category}
          categories={categories}
          onEntryUpdated={fetchEntries}
        />
      )}
    </>
  );
};