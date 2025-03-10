
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { FeedbackType } from './types';

interface FeedbackFormProps {
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  comments: string;
  updateComments: (comments: string) => void;
  severity: 'low' | 'medium' | 'high';
  setSeverity: (severity: 'low' | 'medium' | 'high') => void;
  feedbackType: FeedbackType;
  setFeedbackType: (type: FeedbackType) => void;
  allowContact: boolean;
  setAllowContact: (allow: boolean) => void;
  validationErrors: {[key: string]: boolean};
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  errorMessage?: string;
  isBetaFeedback: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackForm({
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
  handleSubmit,
  errorMessage,
  isBetaFeedback,
  onOpenChange
}: FeedbackFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Error Details Section */}
      {errorMessage && (
        <div className="bg-muted p-3 rounded-md text-sm">
          <p className="font-medium mb-1">Error Details:</p>
          <p className="text-destructive">{errorMessage}</p>
        </div>
      )}
      
      {/* Feedback Type Selection */}
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
      
      {/* Name and Email Fields */}
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
      
      {/* Priority/Severity Selection */}
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
      
      {/* Comments Textarea */}
      <div className="space-y-2">
        <Label htmlFor="comments" className={validationErrors.comments ? 'text-destructive' : ''}>
          Comments {validationErrors.comments && <span className="text-destructive">*</span>}
        </Label>
        <Textarea
          id="comments"
          value={comments}
          onChange={(e) => updateComments(e.target.value)}
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
      
      {/* Contact Permission Toggle (Beta Feedback Only) */}
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
      
      {/* Form Buttons */}
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
  );
}
