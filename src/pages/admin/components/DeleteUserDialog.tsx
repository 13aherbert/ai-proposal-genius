
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
import { AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
  
  const handleConfirm = async () => {
    try {
      setError(null);
      const toastId = toast({
        title: "Deleting account",
        description: `Deleting ${userName}'s account...`,
        variant: "default"
      });
      
      try {
        await onConfirm();
        toast({
          title: "Success",
          description: "User account deleted successfully",
          variant: "default"
        });
        onClose();
      } catch (err) {
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
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
