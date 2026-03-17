
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Building, User, Users, ArrowRight } from "lucide-react";

export type OrganizationSize = 'solo' | 'small_team' | 'medium_business';

interface OrganizationSizeSelectorProps {
  value: OrganizationSize | '';
  onChange: (value: OrganizationSize) => void;
}

const organizationSizes = [
  {
    value: 'solo' as const,
    label: 'Solo / Freelancer',
    description: '1 person',
    icon: User,
  },
  {
    value: 'small_team' as const,
    label: 'Small Business',
    description: '2-10 people',
    icon: Users,
  },
  {
    value: 'medium_business' as const,
    label: 'Medium Business',
    description: '11-50 people',
    icon: Building,
  },
];

export function OrganizationSizeSelector({ value, onChange }: OrganizationSizeSelectorProps) {
  return (
    <div className="space-y-4">
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

      {/* Enterprise & White-label paths */}
      <div className="space-y-3 pt-3 border-t">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium mb-1">Need Enterprise features?</p>
          <p className="text-xs text-muted-foreground mb-3">
            SSO, unlimited projects, dedicated CSM, and custom pricing for 50+ people.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => window.open('mailto:sales@optirfp.ai?subject=Enterprise%20Inquiry', '_blank')}
            >
              Contact Sales <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-muted p-4">
          <p className="text-sm font-medium mb-1">Want to offer OptiRFP to your clients?</p>
          <p className="text-xs text-muted-foreground mb-3">
            White-label solution with custom branding, domains, and API access.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => window.open('mailto:sales@optirfp.ai?subject=White%20Label%20Inquiry', '_blank')}
          >
            Contact Sales <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
