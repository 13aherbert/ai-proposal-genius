import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KnowledgeEntry, KnowledgeCategory } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ViewEntryDialog } from "./ViewEntryDialog";

interface RecentEntriesProps {
  selectedCategory: string | null;
  categories: KnowledgeCategory[];
}

export const RecentEntries = ({ selectedCategory, categories }: RecentEntriesProps) => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const { toast } = useToast();

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('knowledge_entries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Delete the Oregon Emerging Business Proposal entry
      const { error: deleteError } = await supabase
        .from('knowledge_entries')
        .delete()
        .eq('id', '73d7cb17-f89e-47d6-b4da-418628d800e8');

      if (deleteError) {
        console.error('Error deleting entry:', deleteError);
        throw deleteError;
      }

      // Fetch the updated entries after deletion
      const { data: updatedData, error: updatedError } = await query;

      if (updatedError) throw updatedError;

      const formattedEntries = updatedData.map(entry => ({
        title: entry.title,
        category: entry.category,
        updated: new Date(entry.updated_at).toLocaleDateString()
      }));

      setEntries(formattedEntries);
      
      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
    } catch (error) {
      console.error('Error managing entries:', error);
      toast({
        title: "Error",
        description: "Failed to manage entries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [toast, selectedCategory]);

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
          <div className="space-y-4">
            {entries.length === 0 ? (
              <p className="text-muted-foreground">
                {selectedCategory 
                  ? `No entries found in ${selectedCategory}`
                  : 'No entries found'
                }
              </p>
            ) : (
              entries.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.category} • Last updated {item.updated}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedEntry(item)}
                    >
                      View
                    </Button>
                  </div>
                  {index !== entries.length - 1 && <Separator className="my-4" />}
                </div>
              ))
            )}
          </div>
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