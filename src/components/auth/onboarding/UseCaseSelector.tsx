
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type UseCase = 
  | 'rfp_response'
  | 'proposal_management'
  | 'team_collaboration'
  | 'enterprise_solution'
  | 'white_label_integration'
  | 'other';

interface UseCaseSelectorProps {
  value: UseCase | '';
  onChange: (value: UseCase) => void;
  required?: boolean;
}

const useCases = [
  { value: 'rfp_response', label: 'RFP Response & Proposal Writing' },
  { value: 'proposal_management', label: 'Proposal Management & Tracking' },
  { value: 'team_collaboration', label: 'Team Collaboration on Proposals' },
  { value: 'enterprise_solution', label: 'Enterprise-wide Solution' },
  { value: 'white_label_integration', label: 'White Label Integration' },
  { value: 'other', label: 'Other' },
];

export function UseCaseSelector({ value, onChange, required = false }: UseCaseSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="useCase" className="text-sm font-medium">
        Primary use case {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="How do you plan to use our platform?" />
        </SelectTrigger>
        <SelectContent>
          {useCases.map((useCase) => (
            <SelectItem key={useCase.value} value={useCase.value}>
              {useCase.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
