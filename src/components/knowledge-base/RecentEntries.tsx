import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KnowledgeEntry } from "./types";

interface RecentEntriesProps {
  entries: KnowledgeEntry[];
}

export const RecentEntries = ({ entries }: RecentEntriesProps) => {
  return (
    <Card className="bg-secondary/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Recent Entries</CardTitle>
      </CardHeader>
      <CardContent>
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
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
              {index !== entries.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};