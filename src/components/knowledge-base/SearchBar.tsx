import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { debounce } from "lodash";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount?: number;
  isSearching?: boolean;
}

export const SearchBar = ({ searchQuery, onSearchChange, resultCount, isSearching }: SearchBarProps) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounce search to avoid excessive queries
  // Future enhancement: AI-powered semantic search could replace text matching
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearchChange(query);
    }, 300),
    [onSearchChange]
  );

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleChange = (value: string) => {
    setLocalQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setLocalQuery("");
    onSearchChange("");
  };

  return (
    <Card className="bg-secondary/50 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base by title or content..."
            className="pl-9 pr-9"
            value={localQuery}
            onChange={(e) => handleChange(e.target.value)}
          />
          {localQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {localQuery && resultCount !== undefined && (
          <p className="text-sm text-muted-foreground mt-2">
            {isSearching ? "Searching..." : `${resultCount} result${resultCount !== 1 ? "s" : ""} found`}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
