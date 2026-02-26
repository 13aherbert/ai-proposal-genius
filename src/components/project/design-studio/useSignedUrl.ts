import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Resolves a storage path (or full URL) from rfp-files bucket into a signed URL.
 * If the value is already a full URL, returns it as-is.
 * Returns null while loading.
 */
export function useSignedUrl(pathOrUrl: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pathOrUrl) {
      setUrl(null);
      return;
    }

    // Already a full URL (legacy or external)
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      setUrl(pathOrUrl);
      return;
    }

    // It's a storage path — create a signed URL (1 hour expiry)
    let cancelled = false;
    supabase.storage
      .from('rfp-files')
      .createSignedUrl(pathOrUrl, 3600)
      .then(({ data, error }) => {
        if (!cancelled) {
          setUrl(error ? null : data?.signedUrl ?? null);
        }
      });

    return () => { cancelled = true; };
  }, [pathOrUrl]);

  return url;
}
