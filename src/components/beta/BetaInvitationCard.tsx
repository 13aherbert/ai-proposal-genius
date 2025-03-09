
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GiftIcon, LogIn } from 'lucide-react';

interface BetaInvitationCardProps {
  inviteCode: string;
  onSignUpClick: () => void;
}

export function BetaInvitationCard({ inviteCode, onSignUpClick }: BetaInvitationCardProps) {
  return (
    <Card className="max-w-xl mx-auto shadow-lg border-blue-100">
      <CardHeader className="bg-blue-50/50">
        <CardTitle className="flex items-center gap-2">
          <GiftIcon className="h-5 w-5 text-blue-500" />
          Beta Program Invitation
        </CardTitle>
        <CardDescription>
          You've been invited to join our exclusive beta program! Please sign in or create an account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="mb-4">
          As a beta tester, you'll get:
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-6">
          <li>Early access to new features</li>
          <li>Direct influence on product development</li>
          <li>Special recognition when we launch</li>
          <li>Priority support during the beta period</li>
        </ul>
        
        <p className="text-sm text-muted-foreground mb-4">
          Your invitation code: <span className="font-mono font-medium">{inviteCode}</span>
        </p>
      </CardContent>
      <CardFooter className="bg-gray-50/50 flex justify-center">
        <Button 
          onClick={onSignUpClick}
          className="w-full md:w-auto"
          size="lg"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Sign up or Log in to join the beta
        </Button>
      </CardFooter>
    </Card>
  );
}
