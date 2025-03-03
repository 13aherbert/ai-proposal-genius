
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, ChevronRight, ChevronLeft, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Welcome to the Beta Program',
    description: 'Thank you for joining our beta testing program. Your feedback will help us improve OptiRFP.'
  },
  {
    id: 'expectations',
    title: 'What to Expect',
    description: 'As a beta tester, you\'ll get early access to new features and have the opportunity to shape the future of our product.'
  },
  {
    id: 'feedback',
    title: 'Providing Feedback',
    description: 'Your feedback is crucial. You can report bugs, suggest improvements, and share your thoughts at any time.'
  },
  {
    id: 'tasks',
    title: 'Testing Tasks',
    description: 'We\'ll provide specific tasks to help focus testing efforts. Complete these to help us validate key features.'
  },
  {
    id: 'completion',
    title: 'Complete',
    description: 'You\'re all set! You now have access to the beta tester dashboard and can start exploring the application.'
  }
];

export function BetaTesterOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const handleNextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCompletedSteps(prev => [...prev, onboardingSteps[currentStep].id]);
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      completeOnboarding();
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const completeOnboarding = () => {
    // In a real implementation, we would save this to the user's profile
    localStorage.setItem('betaOnboardingComplete', 'true');
    
    toast.success('Beta onboarding complete!', {
      description: 'You now have access to the beta tester dashboard.'
    });
    
    // Navigate to the beta dashboard
    navigate('/beta/dashboard');
  };
  
  const progress = Math.round((currentStep / (onboardingSteps.length - 1)) * 100);
  
  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <span className="bg-primary/10 p-2 rounded-full mr-3">
              <Gift className="h-6 w-6 text-primary" />
            </span>
            OptiRFP Beta Program
          </CardTitle>
          <CardDescription>
            Welcome {session?.user?.email || 'beta tester'} to our exclusive beta testing program
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">
              Step {currentStep + 1} of {onboardingSteps.length}
            </div>
            <div className="text-sm font-medium">
              {progress}% Complete
            </div>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="flex items-start space-x-4 mt-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              completedSteps.includes(onboardingSteps[currentStep].id) 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              {completedSteps.includes(onboardingSteps[currentStep].id) ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                currentStep + 1
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{onboardingSteps[currentStep].title}</h3>
              <p className="text-muted-foreground">{onboardingSteps[currentStep].description}</p>
              
              {currentStep === 0 && (
                <div className="bg-muted p-4 rounded-lg mt-4">
                  <h4 className="font-medium mb-2">What you'll get as a beta tester:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Early access to new features</li>
                    <li>Direct influence on product development</li>
                    <li>Special recognition when we launch</li>
                    <li>Priority support during the beta period</li>
                  </ul>
                </div>
              )}
              
              {currentStep === 1 && (
                <div className="space-y-4 mt-4">
                  <h4 className="font-medium">Beta Testing Timeline:</h4>
                  <div className="space-y-2">
                    {[
                      { phase: 'Alpha Testing', status: 'Completed', date: 'April 2023' },
                      { phase: 'Private Beta', status: 'Current', date: 'May-June 2023' },
                      { phase: 'Public Beta', status: 'Upcoming', date: 'July 2023' },
                      { phase: 'Official Launch', status: 'Planned', date: 'August 2023' }
                    ].map((phase, index) => (
                      <div key={index} className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          phase.status === 'Completed' ? 'bg-green-500' : 
                          phase.status === 'Current' ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1 flex justify-between items-center">
                          <span>{phase.phase}</span>
                          <span className="text-sm text-muted-foreground">{phase.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {[
                    { 
                      title: 'Report Bugs', 
                      description: 'Let us know when something doesn\'t work as expected.' 
                    },
                    { 
                      title: 'Suggest Features', 
                      description: 'Share ideas for new functionality or improvements.' 
                    },
                    { 
                      title: 'Complete Tasks', 
                      description: 'Follow guided tasks to test specific features.' 
                    },
                    { 
                      title: 'Provide Feedback', 
                      description: 'Share your overall experience and thoughts.' 
                    }
                  ].map((item, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <h5 className="font-medium">{item.title}</h5>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {currentStep === 3 && (
                <div className="space-y-4 mt-4">
                  <h4 className="font-medium">Featured Testing Tasks:</h4>
                  <ul className="space-y-2">
                    {[
                      'Upload and analyze RFP documents in various formats',
                      'Create and edit proposal sections using the editor',
                      'Test the AI-powered content suggestions',
                      'Use the knowledge base to store and retrieve information',
                      'Generate a complete proposal and export it'
                    ].map((task, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-5 h-5 rounded-full border flex items-center justify-center mr-2 mt-0.5">
                          <span className="text-xs">{index + 1}</span>
                        </div>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {currentStep === 4 && (
                <div className="bg-primary/10 p-4 rounded-lg mt-4 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h4 className="font-medium text-lg">You're ready to start beta testing!</h4>
                  <p className="text-muted-foreground mb-4">
                    Click 'Complete Onboarding' below to access the beta dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Button onClick={handleNextStep}>
            {currentStep < onboardingSteps.length - 1 ? (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              'Complete Onboarding'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
