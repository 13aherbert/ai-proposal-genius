import { CheckCircle, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ParsingStatusIndicatorProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  entryId: string;
  filePath?: string;
  onStatusUpdate?: () => void;
}

export const ParsingStatusIndicator = ({ 
  status, 
  progress, 
  error, 
  entryId, 
  filePath,
  onStatusUpdate 
}: ParsingStatusIndicatorProps) => {
  const retryParsing = async () => {
    if (!filePath) return;
    
    try {
      toast.loading("Retrying document parsing...");
      
      const { error } = await supabase.functions.invoke('enhanced-document-parser', {
        body: { entryId, filePath }
      });

      if (error) {
        throw error;
      }
      
      toast.success("Parsing retry initiated");
      onStatusUpdate?.();
    } catch (error) {
      console.error('Retry parsing failed:', error);
      toast.error("Failed to retry parsing");
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending Parse</Badge>;
      case 'processing':
        return <Badge variant="default">Processing</Badge>;
      case 'completed':
        return <Badge variant="success">Parsed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {getStatusBadge()}
        </div>
        
        {status === 'failed' && filePath && (
          <Button
            size="sm"
            variant="outline"
            onClick={retryParsing}
            className="h-6 px-2 text-xs"
          >
            Retry
          </Button>
        )}
      </div>

      {(status === 'processing' || (status === 'pending' && progress > 0)) && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Parsing document... {progress}%
          </p>
        </div>
      )}

      {status === 'failed' && error && (
        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
          <p className="font-medium">Parsing failed:</p>
          <p>{error}</p>
        </div>
      )}

      {status === 'completed' && (
        <p className="text-xs text-success">
          Document content extracted and ready for AI generation
        </p>
      )}
    </div>
  );
};