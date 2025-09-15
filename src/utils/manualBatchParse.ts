import { supabase } from '@/integrations/supabase/client';

export const triggerManualBatchParsing = async () => {
  console.log('🚀 Manually triggering batch parsing...');
  
  try {
    const { data, error } = await supabase.functions.invoke('batch-parse-knowledge-files', {
      body: {}
    });
    
    if (error) {
      console.error('❌ Batch parsing error:', error);
      throw error;
    }
    
    console.log('✅ Batch parsing response:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to trigger batch parsing:', error);
    throw error;
  }
};

// Auto-trigger on import
console.log('🔄 Auto-triggering batch parsing...');
triggerManualBatchParsing()
  .then((data) => {
    console.log('✅ Batch parsing completed:', data);
  })
  .catch((error) => {
    console.error('❌ Batch parsing failed:', error);
  });