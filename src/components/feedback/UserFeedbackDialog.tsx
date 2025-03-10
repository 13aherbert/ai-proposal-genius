import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ErrorSeverity } from '@/services/ErrorTrackingService';
import { useErrorTracking } from '@/hooks/use-error-tracking';
import { toast } from '@/components/ui/use-toast';
import { ValidatedInput, ValidatedTextarea, ValidationRules } from '@/components/form/FormValidation';
import { Switch } from '@/components/ui/switch';
import { emailService } from '@/services/EmailService';
import { useAuth } from '@/components/AuthProvider';

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'general';

interface UserFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessage?: string;
  errorId?: string;
  isBetaFeedback?: boolean;
  feedbackType?: FeedbackType;
}

export function UserFeedbackDialog({ 
  open, 
  onOpenChange,
  errorMessage,
  errorId = 'manual-report',
  isBetaFeedback = false,
  feedbackType: initialFeedbackType = 'general'
}: UserFeedbackDialogProps) {
  const { trackError } = useErrorTracking();
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comments, setComments] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(initialFeedbackType);
  const [allowContact, setAllowContact] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({
    comments: false
  });

  React.useEffect(() => {
    setFeedbackType(initialFeedbackType);
  }, [initialFeedbackType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comments.trim()) {
      setValidationErrors(prev => ({ ...prev, comments: true }));
      toast({
        title: "Comments Required",
        description: "Please provide feedback comments before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const ticketId = `TICKET-${Date.now()}`;
      
      trackError({
        message: `${isBetaFeedback ? 'Beta Feedback' : 'User Feedback'}: ${feedbackType} - ${comments.substring(0, 100)}${comments.length > 100 ? '...' : ''}`,
        severity: feedbackType === 'bug' ? ErrorSeverity.ERROR : ErrorSeverity.INFO,
        context: {
          feedback: {
            name,
            email,
            comments,
            severity,
            feedbackType,
            allowContact,
            relatedErrorId: errorId,
            relatedErrorMessage: errorMessage,
            isBetaFeedback,
            ticketId
          },
          source: isBetaFeedback ? 'beta-feedback-form' : 'user-feedback-form'
        }
      });

      await emailService.sendFeedbackEmail(
        feedbackType,
        comments,
        severity,
        name || (session?.user?.user_metadata?.first_name || 'User'),
        email || session?.user?.email,
        errorMessage,
        errorId,
        isBetaFeedback
      );

      const userEmail = email || session?.user?.email;
      const userName = name || (session?.user?.user_metadata?.first_name || 'User');
      
      if (userEmail && allowContact) {
        try {
          await emailService.sendSupportConfirmationEmail(
            userEmail,
            userName,
            comments,
            ticketId
          );
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: isBetaFeedback ? "Beta Feedback Submitted" : "Feedback Submitted",
        description: `Thank you for your ${isBetaFeedback ? 'beta feedback' : 'feedback'}. ${userEmail && allowContact ? 'We\'ve sent a confirmation to your email.' : 'We\'ll review it as soon as possible.'}`,
      });
      
      onOpenChange(false);
      
      setName('');
      setEmail('');
      setComments('');
      setSeverity('medium');
      setFeedbackType('general');
      setAllowContact(false);
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
          <DialogTitle>{isBetaFeedback ? 'Submit Beta Feedback' : 'Send Feedback'}</DialogTitle>
          <DialogDescription>
            {isBetaFeedback 
              ? "Your feedback helps us improve the beta version. Please share any bugs, suggestions, or comments."
              : errorMessage 
                ? "Help us understand what went wrong so we can fix it." 
                : "Share your thoughts, suggestions, or report issues you've encountered."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMessage && (
            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-medium mb-1">Error Details:</p>
              <p className="text-destructive">{errorMessage}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Feedback Type</Label>
            <RadioGroup 
              value={feedbackType}
              onValueChange={(value) => setFeedbackType(value as FeedbackType)}
              className="flex space-x-2"
            >
              {[
                { value: 'bug', label: 'Bug' },
                { value: 'feature', label: 'Feature Request' },
                { value: 'improvement', label: 'Improvement' },
                { value: 'general', label: 'General' }
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-1">
                  <RadioGroupItem value={option.value} id={`feedback-type-${option.value}`} />
                  <Label htmlFor={`feedback-type-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
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
            <Label htmlFor="comments" className={validationErrors.comments ? 'text-destructive' : ''}>
              Comments {validationErrors.comments && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => {
                setComments(e.target.value);
                if (e.target.value.trim()) {
                  setValidationErrors(prev => ({ ...prev, comments: false }));
                }
              }}
              placeholder={feedbackType === 'bug' 
                ? "Please describe the issue in detail. Include steps to reproduce if possible." 
                : "Please share your thoughts, ideas, or suggestions..."}
              required
              rows={5}
              className={`resize-none ${validationErrors.comments ? 'border-destructive' : ''}`}
            />
            {validationErrors.comments && (
              <p className="text-destructive text-sm">Please provide your feedback</p>
            )}
          </div>
          
          {isBetaFeedback && (
            <div className="flex items-center space-x-2">
              <Switch
                id="allow-contact"
                checked={allowContact}
                onCheckedChange={setAllowContact}
              />
              <Label htmlFor="allow-contact" className="cursor-pointer">
                You may contact me about this feedback
              </Label>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
