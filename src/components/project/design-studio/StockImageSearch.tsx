import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  photographer: string;
  src: { medium: string; large: string; original: string };
  alt: string;
}

interface StockImageSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  initialQuery?: string;
}

export function StockImageSearch({ open, onOpenChange, onSelect, initialQuery = '' }: StockImageSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-stock-images', {
        body: { query: query.trim(), per_page: 12 },
      });
      if (error) throw error;
      setPhotos(data?.photos || []);
    } catch {
      toast.error('Failed to search images');
      setPhotos([]);
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Stock Images</DialogTitle>
          <p className="text-xs text-muted-foreground">Powered by Pexels · Free to use</p>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Search for images…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={search} disabled={isSearching || !query.trim()} className="gap-1 shrink-0">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </div>

        <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photos.map(photo => (
                <button
                  key={photo.id}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => {
                    onSelect(photo.src.large);
                    onOpenChange(false);
                  }}
                >
                  <img
                    src={photo.src.medium}
                    alt={photo.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                    <span className="text-[10px] text-white px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
                      📷 {photo.photographer}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              No images found. Try a different search term.
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              Search for royalty-free images to use in your proposal.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
