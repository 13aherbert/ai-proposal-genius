
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";

interface BetaSignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteCode: string;
}

export function BetaSignupDialog({ open, onOpenChange, inviteCode }: BetaSignupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Beta Program</DialogTitle>
          <DialogDescription>
            You've been invited to join our beta program! Please create an account or sign in to continue.
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
