import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DocumentViewerProps {
  filePath: string;
}

export function DocumentViewer({ filePath }: DocumentViewerProps) {
  const { toast } = useToast();

  const handleViewDocument = async () => {
    if (!filePath) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No RFP document found",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('rfp-files')
        .download(filePath);

      if (error) {
        throw error;
      }

      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access the RFP file",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>RFP Document</CardTitle>
        <CardDescription>Access the original RFP document</CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          variant="outline"
          onClick={handleViewDocument}
        >
          View RFP Document
        </Button>
      </CardContent>
    </Card>
  );
}