import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TriggerBatchParsing = () => {
  useEffect(() => {
    const triggerParsing = async () => {
      try {
        console.log('Triggering batch parsing of all knowledge files...');
        toast.loading("Starting bulk document parsing...", { duration: 2000 });
        
        const { data, error } = await supabase.functions.invoke('batch-parse-knowledge-files');
        
        if (error) {
          console.error('Batch parsing error:', error);
          toast.error(`Batch parsing failed: ${error.message}`);
          return;
        }
        
        console.log('Batch parsing response:', data);
        toast.success(`Batch parsing initiated! Processing ${data.totalEntries || 0} entries.`);
        
        if (data.processed && data.failed) {
          toast.info(`Successfully started: ${data.processed}, Failed: ${data.failed}`);
        }
        
      } catch (error) {
        console.error('Error triggering batch parsing:', error);
        toast.error('Failed to start document parsing');
      }
    };
    
    // Trigger parsing immediately when component mounts
    triggerParsing();
  }, []);

  return null; // This component doesn't render anything
};