
import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Bug } from 'lucide-react';

type SubscriptionPlan = 'starter' | 'growth' | 'business' | 'enterprise';

export function TestingPanel() {
  const [testMode, setTestMode] = useState<boolean>(localStorage.getItem('test_mode') === 'true');
  const [plan, setPlan] = useState<SubscriptionPlan>((localStorage.getItem('test_plan') as SubscriptionPlan) || 'starter');
  const [projectLimit, setProjectLimit] = useState<number>(parseInt(localStorage.getItem('test_project_limit') || '6'));
  const [showPanel, setShowPanel] = useState<boolean>(false);

  // Only show in development or when test features are enabled
  useEffect(() => {
    const isDev = import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_FEATURES === 'true';
    setShowPanel(isDev);
  }, []);

  if (!showPanel) return null;

  const toggleTestMode = (enabled: boolean) => {
    setTestMode(enabled);
    localStorage.setItem('test_mode', enabled.toString());
    // Refresh the page to apply changes
    window.location.reload();
  };

  const handlePlanChange = (value: string) => {
    const newPlan = value as SubscriptionPlan;
    setPlan(newPlan);
    localStorage.setItem('test_plan', newPlan);
    
    // Update project limit based on plan
    let newLimit = 3;
    if (newPlan === 'starter') newLimit = 10;
    if (newPlan === 'pro') newLimit = 30;
    
    setProjectLimit(newLimit);
    localStorage.setItem('test_project_limit', newLimit.toString());
  };

  const handleProjectLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(e.target.value);
    if (!isNaN(newLimit) && newLimit >= 0) {
      setProjectLimit(newLimit);
      localStorage.setItem('test_project_limit', newLimit.toString());
    }
  };

  const resetToDefault = () => {
    localStorage.removeItem('test_mode');
    localStorage.removeItem('test_plan');
    localStorage.removeItem('test_project_limit');
    window.location.reload();
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-orange-300 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm flex items-center">
            <Bug className="h-4 w-4 mr-2 text-orange-500" />
            Developer Testing Tools
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={() => setShowPanel(false)}
          >
            ×
          </Button>
        </div>
        <CardDescription className="text-xs">
          Simulate different subscription plans
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pb-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="test-mode" className="text-sm">Enable Test Mode</Label>
          <Switch 
            id="test-mode" 
            checked={testMode} 
            onCheckedChange={toggleTestMode} 
          />
        </div>
        
        {testMode && (
          <>
            <div className="space-y-1">
              <Label htmlFor="test-plan" className="text-sm">Subscription Plan</Label>
              <Select value={plan} onValueChange={handlePlanChange}>
                <SelectTrigger id="test-plan" className="w-full">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="project-limit" className="text-sm">Project Limit</Label>
              <input
                id="project-limit"
                type="number"
                value={projectLimit}
                onChange={handleProjectLimitChange}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                min="0"
              />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center text-amber-600 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            For development only
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetToDefault}
            className="text-xs h-7"
          >
            Reset
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
