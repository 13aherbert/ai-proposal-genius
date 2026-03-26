import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";

export interface SearchResult {
  title: string;
  category: string;
  updated: string;
  snippet: string;
  isTemplate?: boolean;
}

interface SearchResultsProps {
  results: SearchResult[];
  searchQuery: string;
  onViewEntry: (entry: SearchResult) => void;
  onClearSearch: () => void;
}

/** Highlight matching terms in text */
const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export const SearchResults = ({ results, searchQuery, onViewEntry, onClearSearch }: SearchResultsProps) => {
  if (results.length === 0) {
    return (
      <Card className="bg-secondary/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <SearchX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No results for "{searchQuery}"</h3>
          <p className="text-muted-foreground mb-4">Try different keywords or browse categories.</p>
          <Button variant="outline" onClick={onClearSearch}>Clear Search</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Search Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((item, index) => (
            <div
              key={index}
              className="flex items-start justify-between rounded-md p-3 border border-border/50 hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                    {item.category}
                  </Badge>
                  {item.isTemplate && (
                    <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 text-[10px] px-1.5 py-0">
                      📋 TEMPLATE
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold">
                  <HighlightText text={item.title} query={searchQuery} />
                </h3>
                {item.snippet && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    <HighlightText text={item.snippet} query={searchQuery} />
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated {item.updated}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => onViewEntry(item)}
              >
                {item.isTemplate ? "Edit" : "View"}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
