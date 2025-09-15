import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ParsingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  metadata?: any;
}

export function useParsingStatus(entryId: string) {
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchParsingStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_entries')
        .select('parsing_status, parsing_progress, parsing_error, file_metadata')
        .eq('entry_id', entryId)
        .single();

      if (error) {
        console.error('Error fetching parsing status:', error);
        return;
      }

      if (data) {
        setParsingStatus({
          status: data.parsing_status as ParsingStatus['status'],
          progress: data.parsing_progress || 0,
          error: data.parsing_error || undefined,
          metadata: data.file_metadata || undefined,
        });
      }
    } catch (error) {
      console.error('Failed to fetch parsing status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!entryId) return;

    fetchParsingStatus();

    // Set up real-time subscription for status updates
    const subscription = supabase
      .channel(`parsing_status_${entryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'knowledge_entries',
          filter: `entry_id=eq.${entryId}`,
        },
        (payload) => {
          const data = payload.new;
          setParsingStatus({
            status: data.parsing_status as ParsingStatus['status'],
            progress: data.parsing_progress || 0,
            error: data.parsing_error || undefined,
            metadata: data.file_metadata || undefined,
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [entryId]);

  return {
    parsingStatus,
    loading,
    refetch: fetchParsingStatus,
  };
}