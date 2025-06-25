
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building, User, Users, Briefcase } from "lucide-react";

export type OrganizationSize = 'solo' | 'small_team' | 'enterprise' | 'white_label';

interface OrganizationSizeSelectorProps {
  value: OrganizationSize | '';
  onChange: (value: OrganizationSize) => void;
}

const organizationSizes = [
  {
    value: 'solo' as const,
    label: 'Just me',
    description: 'Individual professional',
    icon: User,
  },
  {
    value: 'small_team' as const,
    label: 'Small team',
    description: '2-10 people',
    icon: Users,
  },
  {
    value: 'enterprise' as const,
    label: 'Enterprise',
    description: '11+ people',
    icon: Building,
  },
  {
    value: 'white_label' as const,
    label: 'White label solution',
    description: 'Custom integration needs',
    icon: Briefcase,
  },
];

export function OrganizationSizeSelector({ value, onChange }: OrganizationSizeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">What describes your organization?</Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-1 gap-3">
        {organizationSizes.map((size) => {
          const Icon = size.icon;
          return (
            <div key={size.value} className="flex items-center space-x-3">
              <RadioGroupItem value={size.value} id={size.value} />
              <Label
                htmlFor={size.value}
                className="flex items-center space-x-3 cursor-pointer flex-1 p-3 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{size.label}</div>
                  <div className="text-sm text-muted-foreground">{size.description}</div>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
