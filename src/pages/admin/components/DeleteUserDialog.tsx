
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
  const handleConfirm = async () => {
    await onConfirm();
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
