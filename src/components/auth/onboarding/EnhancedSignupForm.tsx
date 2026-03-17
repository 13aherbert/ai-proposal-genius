
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationSizeSelector, type OrganizationSize } from "./OrganizationSizeSelector";
import { IndustrySelector, type Industry } from "./IndustrySelector";
import { UseCaseSelector, type UseCase } from "./UseCaseSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Calendar } from "lucide-react";

interface EnhancedSignupFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  jobTitle: string;
  birthday: string;
  organizationSize: OrganizationSize | '';
  industry: Industry | '';
  useCase: UseCase | '';
}

export function EnhancedSignupForm({ onSuccess, onSwitchToLogin }: EnhancedSignupFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    jobTitle: '',
    birthday: '',
    organizationSize: '',
    industry: '',
    useCase: '',
  });

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStep1Valid = () => {
    return formData.email && formData.password && formData.firstName && formData.lastName;
  };

  const isStep2Valid = () => {
    return formData.organizationSize;
  };

  const isStep3Valid = () => {
    return formData.industry && formData.useCase;
  };

  const getOnboardingSegment = (): string => {
    switch (formData.organizationSize) {
      case 'solo':
        return 'solo_professional';
      case 'small_team':
        return 'small_team';
      case 'medium_business':
        return 'medium_business';
      default:
        return 'general';
    }
  };

  const handleSubmit = async () => {
    if (!isStep3Valid()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company_name: formData.companyName,
            job_title: formData.jobTitle,
            birthday: formData.birthday,
            organization_size: formData.organizationSize,
            industry: formData.industry,
            use_case: formData.useCase,
            onboarding_segment: getOnboardingSegment(),
          },
        },
      });

      if (error) throw error;

      toast.success("Account created successfully! Please check your email to verify your account.");
      onSuccess();
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || "An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthday" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Birthday (Optional)
        </Label>
        <Input
          id="birthday"
          type="date"
          value={formData.birthday}
          onChange={(e) => updateFormData('birthday', e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <OrganizationSizeSelector
        value={formData.organizationSize}
        onChange={(value) => updateFormData('organizationSize', value)}
      />
    </div>
  );

  const renderStep3 = () => {
    return (
      <div className="space-y-4">
        <IndustrySelector
          value={formData.industry}
          onChange={(value) => updateFormData('industry', value)}
          required
        />

        <UseCaseSelector
          value={formData.useCase}
          onChange={(value) => updateFormData('useCase', value)}
          required
        />
      </div>
    );
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Create Your Account";
      case 2: return "Tell Us About Your Organization";
      case 3: return "Customize Your Experience";
      default: return "Sign Up";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Start with your basic information";
      case 2: return "Help us understand your organization size";
      case 3: return "Let's tailor the experience for you";
      default: return "";
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>{getStepTitle()}</CardTitle>
        <CardDescription>{getStepDescription()}</CardDescription>
        <div className="flex justify-center space-x-2 mt-4">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full ${
                step <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <div className="flex justify-between">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Back
            </Button>
          )}
          
          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={
                (currentStep === 1 && !isStep1Valid()) ||
                (currentStep === 2 && !isStep2Valid())
              }
              className="ml-auto"
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStep3Valid() || isLoading}
              className="ml-auto"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          )}
        </div>

        <div className="text-center">
          <Button variant="link" onClick={onSwitchToLogin}>
            Already have an account? Sign in
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
