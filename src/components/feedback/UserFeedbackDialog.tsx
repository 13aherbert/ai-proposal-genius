
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FeedbackType } from './types';
import { FeedbackForm } from './FeedbackForm';
import { useFeedbackForm } from '@/hooks/use-feedback-form';

interface UserFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessage?: string;
  errorId?: string;
  feedbackType?: FeedbackType;
}

/**
 * UserFeedbackDialog - A component for collecting user feedback
 * 
 * This dialog allows users to submit different types of feedback:
 * - Bug reports
 * - Feature requests
 * - Improvement suggestions
 * - General feedback
 * 
 * It also supports automatic error reporting when provided with errorMessage and errorId.
 */
export function UserFeedbackDialog({ 
  open, 
  onOpenChange,
  errorMessage,
  errorId = 'manual-report',
  feedbackType: initialFeedbackType = 'general'
}: UserFeedbackDialogProps) {
  // Use the feedback form hook to handle form state and submission
  const {
    name,
    setName,
    email, 
    setEmail,
    comments,
    updateComments,
    severity,
    setSeverity,
    feedbackType,
    setFeedbackType,
    allowContact,
    setAllowContact,
    validationErrors,
    isSubmitting,
    handleSubmit
  } = useFeedbackForm({
    initialFeedbackType,
    errorMessage,
    errorId,
    onOpenChange
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            {errorMessage 
              ? "Help us understand what went wrong so we can fix it." 
              : "Share your thoughts, suggestions, or report issues you've encountered."
            }
          </DialogDescription>
        </DialogHeader>
        
        <FeedbackForm
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          comments={comments}
          updateComments={updateComments}
          severity={severity}
          setSeverity={setSeverity}
          feedbackType={feedbackType}
          setFeedbackType={setFeedbackType}
          allowContact={allowContact}
          setAllowContact={setAllowContact}
          validationErrors={validationErrors}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          errorMessage={errorMessage}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
