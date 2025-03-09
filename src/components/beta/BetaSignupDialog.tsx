
import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/AuthForm";
import { Badge } from "@/components/ui/badge";
import { GiftIcon } from "lucide-react";

interface BetaSignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteCode: string;
  autoOpen?: boolean;
}

export function BetaSignupDialog({ 
  open, 
  onOpenChange, 
  inviteCode,
  autoOpen = false
}: BetaSignupDialogProps) {
  // Force dialog to open if autoOpen is true
  useEffect(() => {
    if (autoOpen && !open) {
      onOpenChange(true);
    }
  }, [autoOpen, open, onOpenChange]);

  // Store the invite code in session storage when the dialog opens or when inviteCode changes
  useEffect(() => {
    if ((open || autoOpen) && inviteCode) {
      console.log("BetaSignupDialog: Storing invite code in session storage", inviteCode);
      sessionStorage.setItem('beta_invite_code', inviteCode);
    }
  }, [open, inviteCode, autoOpen]);

  // This function handles when the dialog is explicitly closed by the user
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <GiftIcon className="h-5 w-5 text-primary" />
            <DialogTitle>Join OptiRFP Beta Program</DialogTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Exclusive Invitation</Badge>
          </div>
          <DialogDescription>
            You've been invited to join our exclusive beta program! Please create an account or sign in to continue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <AuthForm defaultView="sign_up" />
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Your invitation code: <span className="font-mono font-medium">{inviteCode}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This code will be automatically applied after you sign in.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
