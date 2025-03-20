
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userName: string;
  isDeleting: boolean;
}

export function DeleteUserDialog({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isDeleting
}: DeleteUserDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [deleteStep, setDeleteStep] = useState("");
  
  const handleConfirm = async () => {
    try {
      setError(null);
      setDeleteProgress(0);
      setDeleteStep("Initializing deletion process...");
      
      const toastId = toast({
        title: "Deleting account",
        description: `Deleting ${userName}'s account...`,
        variant: "default",
        duration: Infinity
      });
      
      // Simulate progress updates - in reality this is happening on the server
      // but we want to show progress to the user
      const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
          if (prev < 90) {
            const increment = Math.floor(Math.random() * 15) + 5; // 5-20% increment
            return Math.min(prev + increment, 90);
          }
          return prev;
        });
        
        const steps = [
          "Removing user roles...",
          "Deleting subscription data...",
          "Removing knowledge entries...",
          "Deleting project documents...",
          "Removing proposal sections...",
          "Deleting projects...",
          "Removing profile data...",
          "Finalizing user deletion..."
        ];
        
        setDeleteStep(steps[Math.floor(Math.random() * steps.length)]);
      }, 800);
      
      try {
        await onConfirm();
        clearInterval(progressInterval);
        setDeleteProgress(100);
        setDeleteStep("User successfully deleted!");
        toastId.dismiss();
        toast({
          title: "Success",
          description: "User account deleted successfully",
          variant: "default"
        });
        
        // Small delay to show 100% complete before closing
        setTimeout(() => {
          onClose();
        }, 500);
      } catch (err) {
        clearInterval(progressInterval);
        toastId.dismiss();
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        toast({
          title: "Error",
          description: `Failed to delete user: ${errorMessage}`,
          variant: "destructive"
        });
        console.error("Error in DeleteUserDialog.handleConfirm:", err);
      }
    } catch (error) {
      console.error("Error in DeleteUserDialog.handleConfirm:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Delete User Account
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {userName}'s account? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-3">
          <p className="text-sm text-muted-foreground mb-2">This will permanently delete:</p>
          <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
            <li>The user's profile information</li>
            <li>All their data, projects, and documents</li>
            <li>Subscription information</li>
            <li>Authentication data</li>
          </ul>
        </div>
        
        {isDeleting && (
          <div className="my-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-muted-foreground">{deleteStep}</span>
              <span className="text-sm font-medium">{deleteProgress}%</span>
            </div>
            <Progress value={deleteProgress} className="h-2" />
          </div>
        )}
        
        {error && (
          <div className="mt-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : 'Delete Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
