import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ProposalSection } from "./useProposalSections";

interface BackupManagerProps {
  sections: ProposalSection[];
  projectId: string;
}

export function BackupManager({ sections, projectId }: BackupManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Format data for export
      const exportData = {
        projectId,
        exportDate: new Date().toISOString(),
        sections: sections.map(section => ({
          title: section.section_title,
          content: section.content,
          created: section.created_at,
          updated: section.updated_at
        }))
      };
      
      // Create JSON file for download
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal-backup-${projectId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success("Proposal sections exported successfully");
      setIsOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export proposal sections");
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate import data
        if (!data.sections || !Array.isArray(data.sections)) {
          throw new Error("Invalid backup file format");
        }
        
        // Store backup in localStorage
        const key = `proposal-backup-${projectId}`;
        const backups = JSON.parse(localStorage.getItem(key) || "[]");
        backups.push({
          timestamp: new Date().toISOString(),
          data: data
        });
        
        // Keep only last 5 backups
        if (backups.length > 5) {
          backups.shift();
        }
        
        localStorage.setItem(key, JSON.stringify(backups));
        
        toast.success(`Imported ${data.sections.length} sections to local backup`);
        setIsOpen(false);
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Failed to import backup file");
      } finally {
        setIsImporting(false);
        // Reset file input
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
      toast.error("Error reading file");
      setIsImporting(false);
    };
    
    reader.readAsText(file);
  };

  const saveToLocalBackup = () => {
    try {
      // Create backup object
      const backup = {
        timestamp: new Date().toISOString(),
        data: {
          projectId,
          sections: sections.map(section => ({
            title: section.section_title,
            content: section.content,
            created: section.created_at,
            updated: section.updated_at
          }))
        }
      };
      
      // Store in localStorage
      const key = `proposal-backup-${projectId}`;
      const backups = JSON.parse(localStorage.getItem(key) || "[]");
      backups.push(backup);
      
      // Keep only last 5 backups
      if (backups.length > 5) {
        backups.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(backups));
      
      toast.success("Saved local backup of proposal sections");
    } catch (error) {
      console.error("Backup error:", error);
      toast.error("Failed to create local backup");
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={saveToLocalBackup}
          className="flex items-center gap-1"
        >
          <Save className="h-3.5 w-3.5" />
          Save Backup
        </Button>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              Backup Options
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Proposal Backup Options</DialogTitle>
              <DialogDescription>
                Export your proposal sections or import from a backup file.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? "Exporting..." : "Export Proposal"}
                <Download className="h-4 w-4" />
              </Button>
              
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  disabled={isImporting}
                >
                  {isImporting ? "Importing..." : "Import from Backup"}
                  <Upload className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isImporting}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
