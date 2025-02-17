
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
        colors: ["#34D399"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div className="flex justify-center items-center mb-10 gap-4">
      <span className="font-semibold">Monthly</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <Label>
          <Switch
            ref={switchRef as any}
            checked={!isMonthly}
            onCheckedChange={handleToggle}
            className="h-7 w-14 bg-gray-600 data-[state=checked]:bg-brand-green border-2 border-white/20"
          />
        </Label>
      </label>
      <span className="font-semibold">
        Annual <span className="text-brand-green">(Save ~15%)</span>
      </span>
    </div>
  );
}
