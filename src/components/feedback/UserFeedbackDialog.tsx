
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ErrorSeverity } from '@/services/ErrorTrackingService';
import { useErrorTracking } from '@/hooks/use-error-tracking';
import { toast } from '@/components/ui/use-toast';

interface UserFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessage?: string;
  errorId?: string;
}

export function UserFeedbackDialog({ 
  open, 
  onOpenChange,
  errorMessage,
  errorId = 'manual-report'
}: UserFeedbackDialogProps) {
  const { trackError } = useErrorTracking();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comments, setComments] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Track the user feedback as an error
      trackError({
        message: `User Feedback: ${comments.substring(0, 100)}${comments.length > 100 ? '...' : ''}`,
        severity: ErrorSeverity.INFO,
        context: {
          feedback: {
            name,
            email,
            comments,
            severity,
            relatedErrorId: errorId,
            relatedErrorMessage: errorMessage
          },
          source: 'user-feedback-form'
        }
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Show success message
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback. We'll review it as soon as possible.",
      });
      
      // Close the dialog
      onOpenChange(false);
      
      // Reset form
      setName('');
      setEmail('');
      setComments('');
      setSeverity('medium');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Error",
        description: "There was a problem submitting your feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            {errorMessage 
              ? "Help us understand what went wrong so we can fix it." 
              : "Share your thoughts, suggestions, or report issues you've encountered."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMessage && (
            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-medium mb-1">Error Details:</p>
              <p className="text-destructive">{errorMessage}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email (optional)"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="severity">Priority</Label>
            <div className="flex space-x-4">
              {[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="severity"
                    value={option.value}
                    checked={severity === option.value}
                    onChange={() => setSeverity(option.value as 'low' | 'medium' | 'high')}
                    className="h-4 w-4 text-brand-green border-muted"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Please describe what happened or what you'd like to see improved..."
              required
              rows={5}
              className="resize-none"
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !comments.trim()}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
