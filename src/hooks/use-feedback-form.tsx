
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { useErrorTracking } from '@/hooks/use-error-tracking';
import { emailService } from '@/services/email';
import { ErrorSeverity } from '@/services/ErrorTrackingService';
import { useAuth } from '@/components/AuthProvider';
import { useProfile } from '@/hooks/use-profile';
import { supabase } from '@/integrations/supabase/client';
import { FeedbackType } from '@/components/feedback/types';

interface UseFeedbackFormProps {
  initialFeedbackType: FeedbackType;
  errorMessage?: string;
  errorId: string;
  onOpenChange: (open: boolean) => void;
}

const feedbackSchema = z.object({
  comments: z.string().trim().min(10, 'Please add at least 10 characters').max(5000, 'Keep it under 5000 characters'),
  email: z.string().trim().email('Invalid email').max(255).optional().or(z.literal('')),
  name: z.string().trim().max(100).optional(),
});

export function useFeedbackForm({
  initialFeedbackType,
  errorMessage,
  errorId,
  onOpenChange,
}: UseFeedbackFormProps) {
  const { trackError } = useErrorTracking();
  const { session } = useAuth();
  const { profileData } = useProfile();

  const defaultName = [profileData?.first_name, profileData?.last_name].filter(Boolean).join(' ').trim();
  const defaultEmail = session?.user?.email ?? '';

  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [comments, setComments] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(initialFeedbackType);
  const [allowContact, setAllowContact] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: boolean }>({ comments: false });

  useEffect(() => {
    setFeedbackType(initialFeedbackType);
  }, [initialFeedbackType]);

  // Re-sync defaults if profile loads after mount
  useEffect(() => {
    if (!name && defaultName) setName(defaultName);
    if (!email && defaultEmail) setEmail(defaultEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultName, defaultEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = feedbackSchema.safeParse({ comments, email, name });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setValidationErrors({ comments: !!flat.comments });
      toast.error(flat.comments?.[0] ?? flat.email?.[0] ?? 'Please review the form');
      return;
    }

    setIsSubmitting(true);
    const ticketId = `${feedbackType === 'support' ? 'TICKET' : 'FB'}-${Date.now()}`;

    try {
      // 1) Persist to database (source of truth)
      if (session?.user?.id) {
        const { error: insertError } = await supabase.from('user_feedback_submissions').insert({
          ticket_id: ticketId,
          user_id: session.user.id,
          type: feedbackType,
          severity,
          name: name || null,
          email: email || null,
          message: comments,
          allow_contact: allowContact,
          related_error_id: errorId !== 'manual-report' ? errorId : null,
          related_error_message: errorMessage ?? null,
          metadata: {
            url: typeof window !== 'undefined' ? window.location.href : null,
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          },
        });
        if (insertError) {
          console.error('Failed to persist support ticket:', insertError);
        }
      }

      // 2) Track in error tracking
      trackError({
        message: `User Feedback: ${feedbackType} - ${comments.substring(0, 100)}${comments.length > 100 ? '...' : ''}`,
        severity: feedbackType === 'bug' ? ErrorSeverity.ERROR : ErrorSeverity.INFO,
        context: {
          feedback: { name, email, severity, feedbackType, allowContact, ticketId },
          source: 'user-feedback-form',
        },
      });

      // 3) Notify support via email
      const userEmail = email || session?.user?.email;
      const userName = name || profileData?.first_name || 'User';
      await emailService.sendFeedbackEmail(
        feedbackType,
        comments,
        severity,
        userName,
        userEmail,
        errorMessage,
        ticketId,
      );

      // 4) Confirmation email to user (default on)
      if (userEmail && allowContact) {
        try {
          await emailService.sendSupportConfirmationEmail(userEmail, userName, comments, ticketId);
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }
      }

      toast.success(`Thanks — ticket ${ticketId} received`, {
        description: userEmail && allowContact
          ? "We've sent a confirmation to your email."
          : "We'll review it shortly.",
      });

      onOpenChange(false);

      // Reset (preserve identity)
      setComments('');
      setSeverity('medium');
      setFeedbackType('general');
      setAllowContact(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('There was a problem submitting your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateComments = (value: string) => {
    setComments(value);
    if (value.trim()) {
      setValidationErrors((prev) => ({ ...prev, comments: false }));
    }
  };

  return {
    name, setName,
    email, setEmail,
    comments, updateComments,
    severity, setSeverity,
    feedbackType, setFeedbackType,
    allowContact, setAllowContact,
    validationErrors,
    isSubmitting,
    handleSubmit,
  };
}
