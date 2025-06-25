
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Industry = 
  | 'technology'
  | 'healthcare'
  | 'finance'
  | 'education'
  | 'manufacturing'
  | 'retail'
  | 'consulting'
  | 'real_estate'
  | 'construction'
  | 'government'
  | 'non_profit'
  | 'other';

interface IndustrySelectorProps {
  value: Industry | '';
  onChange: (value: Industry) => void;
  required?: boolean;
}

const industries = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'construction', label: 'Construction' },
  { value: 'government', label: 'Government' },
  { value: 'non_profit', label: 'Non-Profit' },
  { value: 'other', label: 'Other' },
];

export function IndustrySelector({ value, onChange, required = false }: IndustrySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="industry" className="text-sm font-medium">
        Industry {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select your industry" />
        </SelectTrigger>
        <SelectContent>
          {industries.map((industry) => (
            <SelectItem key={industry.value} value={industry.value}>
              {industry.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
