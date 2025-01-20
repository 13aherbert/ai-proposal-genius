import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KnowledgeEntry } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecentEntriesProps {
  entries?: KnowledgeEntry[];
}

export const RecentEntries = ({ entries: propEntries }: RecentEntriesProps) => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecentEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('knowledge_entries')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        const formattedEntries = data.map(entry => ({
          title: entry.title,
          category: entry.category,
          updated: new Date(entry.updated_at).toLocaleDateString()
        }));

        setEntries(formattedEntries);
      } catch (error) {
        console.error('Error fetching recent entries:', error);
        toast({
          title: "Error",
          description: "Failed to load recent entries",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentEntries();
  }, [toast]);

  if (isLoading) {
    return (
      <Card className="bg-secondary/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">Loading recent entries...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Recent Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.length === 0 ? (
            <p className="text-muted-foreground">No entries found</p>
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
                  <Button variant="outline" size="sm">
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
  );
};