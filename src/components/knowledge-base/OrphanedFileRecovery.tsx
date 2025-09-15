import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch, Link } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const OrphanedFileRecovery = () => {
  const [isRecovering, setIsRecovering] = useState(false);

  const recoverOrphanedFiles = async () => {
    setIsRecovering(true);
    
    try {
      toast.loading("Finding orphaned files...");
      
      // Get all files from storage
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('knowledge-files')
        .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      if (storageError) {
        throw storageError;
      }

      if (!storageFiles || storageFiles.length === 0) {
        toast.info("No files found in storage");
        return;
      }

      // Get all knowledge entries with file paths
      const { data: entries, error: entriesError } = await supabase
        .from('knowledge_entries')
        .select('file_path')
        .not('file_path', 'is', null);

      if (entriesError) {
        throw entriesError;
      }

      const linkedFilePaths = new Set(entries?.map(e => e.file_path) || []);
      
      // Find orphaned files
      const orphanedFiles = storageFiles.filter(file => {
        if (file.name === '.emptyFolderPlaceholder') return false;
        const fullPath = `${file.name}`;
        return !linkedFilePaths.has(fullPath);
      });

      if (orphanedFiles.length === 0) {
        toast.success("No orphaned files found");
        return;
      }

      toast.info(`Found ${orphanedFiles.length} orphaned files. Creating entries...`);

      // Get current user's organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_organization_id')
        .eq('profile_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.current_organization_id) {
        throw new Error('User organization not found');
      }

      let recovered = 0;
      
      for (const file of orphanedFiles) {
        try {
          // Extract filename without extension for title
          const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
          const title = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Recovered Document';
          
          // Create knowledge entry for orphaned file
          const { error: insertError } = await supabase
            .from('knowledge_entries')
            .insert({
              title: title,
              content: null,
              category: 'recovered',
              file_path: file.name,
              user_id: (await supabase.auth.getUser()).data.user?.id,
              organization_id: profile.current_organization_id,
              parsing_status: 'pending',
              parsing_progress: 0,
            });

          if (insertError) {
            console.error(`Failed to create entry for ${file.name}:`, insertError);
          } else {
            recovered++;
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
        }
      }

      toast.success(`Recovered ${recovered} orphaned files as knowledge entries`);
      
    } catch (error) {
      console.error('Orphaned file recovery failed:', error);
      toast.error("Failed to recover orphaned files");
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <FileSearch className="h-5 w-5" />
          File Recovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Find and recover orphaned files in storage that aren't linked to knowledge entries.
        </p>
        <Button 
          onClick={recoverOrphanedFiles}
          disabled={isRecovering}
          className="w-full"
          variant="outline"
        >
          <Link className={`h-4 w-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
          {isRecovering ? 'Recovering Files...' : 'Recover Orphaned Files'}
        </Button>
      </CardContent>
    </Card>
  );
};