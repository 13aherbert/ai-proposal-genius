import { Switch } from "@/components/ui/switch";

interface BillingToggleProps {
  isMonthly: boolean;
  onToggle: (checked: boolean) => void;
}

export function BillingToggle({ isMonthly, onToggle }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <span className={`text-sm ${isMonthly ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
      <Switch
        checked={!isMonthly}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-brand-green"
      />
      <span className={`text-sm ${!isMonthly ? 'text-white' : 'text-gray-400'}`}>Annual</span>
    </div>
  );
}