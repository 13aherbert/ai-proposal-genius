
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KnowledgeEntry, KnowledgeCategory } from "./types";
import { ViewEntryDialog } from "./ViewEntryDialog";
import { useEntries } from "./entries/useEntries";
import { EntryList } from "./entries/EntryList";
import { useAuth } from "@/components/AuthProvider";

interface RecentEntriesProps {
  selectedCategory: string | null;
  categories: KnowledgeCategory[];
}

export const RecentEntries = ({ selectedCategory, categories }: RecentEntriesProps) => {
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const { entries, isLoading } = useEntries(selectedCategory);
  const { session } = useAuth();

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

  if (!session?.user) {
    return (
      <Card className="bg-secondary/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please sign in to view your knowledge base entries.</p>
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
