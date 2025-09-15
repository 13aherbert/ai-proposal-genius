import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const BulkParsingTrigger = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const triggerBulkParsing = async () => {
    setIsProcessing(true);
    
    try {
      toast.loading("Initiating bulk parsing of existing files...");
      
      const { data, error } = await supabase.functions.invoke('batch-parse-knowledge-files');
      
      if (error) {
        throw error;
      }
      
      toast.success(`Bulk parsing initiated. Processing ${data.totalEntries} entries.`);
    } catch (error) {
      console.error('Bulk parsing failed:', error);
      toast.error("Failed to start bulk parsing");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-secondary/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5" />
          Document Parsing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Process all uploaded files in your knowledge base to extract their content for AI generation.
        </p>
        <Button 
          onClick={triggerBulkParsing}
          disabled={isProcessing}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
          {isProcessing ? 'Processing Files...' : 'Parse All Documents'}
        </Button>
      </CardContent>
    </Card>
  );
};