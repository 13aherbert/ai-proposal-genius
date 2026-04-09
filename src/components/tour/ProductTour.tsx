import { useCallback, useMemo } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useProductTour, getProductTourSteps } from '@/hooks/use-product-tour';
import { useSubscription } from '@/hooks/use-subscription';
import { normalizePlanType } from '@/hooks/subscription/feature-access';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

function TierBadge({ message }: { message: string }) {
  return (
    <div className="mt-3 flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs text-primary">
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function ProductTour() {
  const tour = useProductTour();
  const { data: subscriptionData } = useSubscription();
  const planType = normalizePlanType(subscriptionData?.plan_type);

  const steps = useMemo(() => {
    const raw = getProductTourSteps(planType);
    return raw.map((step) => ({
      ...step,
      content: step.tierMessage ? (
        <div>
          <p>{step.content as string}</p>
          <TierBadge message={step.tierMessage} />
        </div>
      ) : (
        step.content
      ),
    }));
  }, [planType]);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index, action } = data;

      if (status === STATUS.FINISHED) {
        tour.complete();
        return;
      }

      if (status === STATUS.SKIPPED) {
        tour.skip();
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        if (action === ACTIONS.PREV) {
          tour.setStep(Math.max(0, index - 1));
        } else {
          tour.setStep(index + 1);
        }
      }

      if (type === EVENTS.TARGET_NOT_FOUND) {
        // Skip missing targets
        tour.setStep(index + 1);
      }
    },
    [tour]
  );

  if (!tour.isRunning) return null;

  return (
    <Joyride
      steps={steps}
      run={tour.isRunning}
      stepIndex={tour.stepIndex}
      callback={handleCallback}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      spotlightClicks
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          arrowColor: 'hsl(var(--card))',
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          fontSize: '14px',
        },
        tooltipTitle: {
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '8px',
        },
        tooltipContent: {
          padding: '8px 0 0 0',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 500,
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: 8,
          fontSize: '13px',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: '13px',
        },
        spotlight: {
          borderRadius: '12px',
        },
        overlay: {
          mixBlendMode: undefined as any, // fix dark mode overlay
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish Tour',
        next: 'Next',
        skip: 'Skip Tour',
      }}
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: {
            filter: 'none',
          },
        },
      }}
    />
  );
}
