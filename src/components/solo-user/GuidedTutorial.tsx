
import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface GuidedTutorialProps {
  steps: Step[];
  onComplete: () => void;
  onSkip: () => void;
}

export function GuidedTutorial({ steps, onComplete, onSkip }: GuidedTutorialProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  
  useEffect(() => {
    // Auto-start tutorial after component mounts
    const timer = setTimeout(() => setRun(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      if (status === STATUS.FINISHED) {
        onComplete();
      } else {
        onSkip();
      }
    }
    
    if (type === 'step:after') {
      setStepIndex(index + 1);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      continuous
      showProgress
      showSkipButton
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
      }}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}
