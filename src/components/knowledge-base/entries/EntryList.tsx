import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KnowledgeEntry, KnowledgeCategory } from "../types";

interface EntryListProps {
  entries: KnowledgeEntry[];
  onViewEntry: (entry: KnowledgeEntry) => void;
}

export const EntryList = ({ entries, onViewEntry }: EntryListProps) => {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground">No entries found</p>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((item, index) => (
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
              onClick={() => onViewEntry(item)}
            >
              View
            </Button>
          </div>
          {index !== entries.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  );
};