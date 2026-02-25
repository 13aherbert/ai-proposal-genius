import { Button } from '@/components/ui/button';
import { Download, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface ExportPanelProps {
  designId: string;
  isSaving: boolean;
  onSave: () => Promise<void>;
}

export function ExportPanel({ designId, isSaving, onSave }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      // Save first
      await onSave();

      const { data, error } = await supabase.functions.invoke('export-proposal-pdf', {
        body: { designId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('PDF generated successfully');
      } else if (data?.html) {
        // Fallback: open HTML in new window for print-to-PDF
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(data.html);
          w.document.close();
          setTimeout(() => w.print(), 500);
        }
        toast.success('Print dialog opened — save as PDF');
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
        Save
      </Button>
      <Button size="sm" onClick={handleExportPdf} disabled={exporting}>
        {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
        Export PDF
      </Button>
    </div>
  );
}
