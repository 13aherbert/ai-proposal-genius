import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useErrorTracking } from '@/hooks/use-error-tracking';
import { emailService } from '@/services/EmailService';
import { ErrorSeverity } from '@/services/ErrorTrackingService';
import { useAuth } from '@/components/AuthProvider';
import { FeedbackType } from '@/components/feedback/types';

interface UseFeedbackFormProps {
  initialFeedbackType: FeedbackType;
  errorMessage?: string;
  errorId: string;
  isBetaFeedback: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useFeedbackForm({
  initialFeedbackType,
  errorMessage,
  errorId,
  isBetaFeedback,
  onOpenChange
}: UseFeedbackFormProps) {
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

  // Update feedback type when prop changes
  useEffect(() => {
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
      
      // Track the feedback in error tracking system
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

      // Send feedback email to support
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
      
      // Send confirmation email if user allows contact
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

      // Give a slight delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Show success message
      toast({
        title: isBetaFeedback ? "Beta Feedback Submitted" : "Feedback Submitted",
        description: `Thank you for your ${isBetaFeedback ? 'beta feedback' : 'feedback'}. ${userEmail && allowContact ? 'We\'ve sent a confirmation to your email.' : 'We\'ll review it as soon as possible.'}`,
      });
      
      // Close dialog
      onOpenChange(false);
      
      // Reset form
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

  const updateComments = (value: string) => {
    setComments(value);
    if (value.trim()) {
      setValidationErrors(prev => ({ ...prev, comments: false }));
    }
  };

  return {
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
  };
}
