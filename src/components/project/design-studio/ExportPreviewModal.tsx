import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  htmlContent: string | null;
  onConfirmExport: () => void;
  exporting: boolean;
}

export function ExportPreviewModal({ open, onOpenChange, htmlContent, onConfirmExport, exporting }: ExportPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0 border rounded-md bg-white">
          {htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              className="w-full min-h-[600px] border-0"
              title="Export Preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Generating preview...
            </div>
          )}
        </ScrollArea>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button onClick={onConfirmExport} disabled={exporting || !htmlContent}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
            Looks good — Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
