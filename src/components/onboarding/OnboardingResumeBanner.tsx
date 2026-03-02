import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingResumeBannerProps {
  currentStep: number;
  onResume: () => void;
  onDismiss: () => void;
}

export function OnboardingResumeBanner({ currentStep, onResume, onDismiss }: OnboardingResumeBannerProps) {
  return (
    <div className="relative rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i < currentStep - 1 ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Complete your setup to generate your first proposal
          </p>
          <p className="text-xs text-muted-foreground">
            Step {currentStep} of 6
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onResume}>
          Resume Setup
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
