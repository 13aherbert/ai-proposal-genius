import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { KnowledgeEntry } from "../types";

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
          <div
            className={`flex items-center justify-between rounded-md p-3 ${
              item.isTemplate
                ? "border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20"
                : ""
            }`}
          >
            <div>
              {item.isTemplate && (
                <Badge className="mb-1 bg-yellow-400 text-yellow-900 hover:bg-yellow-500 text-[10px] px-1.5 py-0">
                  📋 TEMPLATE
                </Badge>
              )}
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
              {item.isTemplate ? "Edit" : "View"}
            </Button>
          </div>
          {index !== entries.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  );
};
