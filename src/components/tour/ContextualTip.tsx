import { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { useProductTour } from '@/hooks/use-product-tour';

interface ContextualTipProps {
  featureId: string;
  message: string;
  position?: 'top' | 'bottom';
  children: React.ReactNode;
}

/**
 * Shows a one-time contextual help bubble the first time a user encounters a feature.
 * Dismissed permanently after interaction.
 */
export function ContextualTip({
  featureId,
  message,
  position = 'bottom',
  children,
}: ContextualTipProps) {
  const { isFeatureSeen, markFeatureSeen, isRunning } = useProductTour();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show contextual tips while the main tour is running
    if (isRunning) return;
    if (isFeatureSeen(featureId)) return;

    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [featureId, isFeatureSeen, isRunning]);

  const dismiss = () => {
    setVisible(false);
    markFeatureSeen(featureId);
  };

  return (
    <div className="relative">
      {children}
      {visible && (
        <div
          className={`absolute z-50 left-0 right-0 ${
            position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
        >
          <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="flex-1 text-foreground">{message}</p>
              <button
                onClick={dismiss}
                className="p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss tip"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
