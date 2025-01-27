import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRef } from "react";
import confetti from "canvas-confetti";
import { usePricingContext } from "./PricingContext";

export function BillingToggle() {
  const { isMonthly, setIsMonthly } = usePricingContext();
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: [
          "hsl(var(--primary))",
          "hsl(var(--accent))",
          "hsl(var(--secondary))",
          "hsl(var(--muted))",
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div className="flex justify-center mb-10">
      <label className="relative inline-flex items-center cursor-pointer">
        <Label>
          <Switch
            ref={switchRef as any}
            checked={!isMonthly}
            onCheckedChange={handleToggle}
            className="relative"
          />
        </Label>
      </label>
      <span className="ml-2 font-semibold">
        Annual billing <span className="text-primary">(Save 20%)</span>
      </span>
    </div>
  );
}