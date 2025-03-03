
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserFeedbackDialog } from '@/components/feedback/UserFeedbackDialog';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, BugIcon, Lightbulb, CheckCircle, AlertTriangle } from 'lucide-react';
import { BetaMetricsPanel } from './BetaMetricsPanel';

export function BetaTesterDashboard() {
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Beta Tester Dashboard</h1>
          <p className="text-muted-foreground">Help us improve OptiRFP by testing and providing feedback</p>
        </div>
        <Button onClick={() => setFeedbackDialogOpen(true)}>Submit Feedback</Button>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <BugIcon className="mr-2 h-5 w-5 text-destructive" />
              Report Issues
            </CardTitle>
            <CardDescription>Found a bug or issue?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">We appreciate your help in identifying issues. Please report any bugs or unexpected behavior.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => {
              setFeedbackDialogOpen(true);
            }}>
              Report Issue
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
              Suggest Features
            </CardTitle>
            <CardDescription>Have an idea for improvement?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Your suggestions help shape the future of OptiRFP. Share your ideas for new features or improvements.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => {
              setFeedbackDialogOpen(true);
            }}>
              Suggest Feature
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Beta Progress
            </CardTitle>
            <CardDescription>Track our development progress</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Follow along as we implement improvements based on your feedback.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/beta/roadmap')}>
              View Roadmap
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Testing Tasks</CardTitle>
          <CardDescription>Help us test specific features and scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active">Active Tasks</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              {[
                {
                  id: 1,
                  title: "Test RFP Document Upload",
                  description: "Try uploading different document formats and verify correct parsing",
                  priority: "high"
                },
                {
                  id: 2,
                  title: "Create a Complex Proposal",
                  description: "Test the proposal editor with multiple sections and formatting",
                  priority: "medium"
                },
                {
                  id: 3,
                  title: "Verify Knowledge Base Integration",
                  description: "Check that Knowledge Base entries are correctly suggested in proposal drafts",
                  priority: "low"
                }
              ].map(task => (
                <div key={task.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{task.title}</h3>
                      <Badge variant={
                        task.priority === 'high' ? 'destructive' : 
                        task.priority === 'medium' ? 'default' : 
                        'outline'
                      }>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              <div className="border rounded-lg p-4 flex justify-between items-center opacity-60">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium line-through">Initial Login Flow</h3>
                    <Badge variant="outline">completed</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Test the login and registration process</p>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0">
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Beta Testing Metrics</CardTitle>
          <CardDescription>Track key metrics and progress of the beta program</CardDescription>
        </CardHeader>
        <CardContent>
          <BetaMetricsPanel />
        </CardContent>
      </Card>
      
      <UserFeedbackDialog 
        open={feedbackDialogOpen} 
        onOpenChange={setFeedbackDialogOpen}
        isBetaFeedback={true}
      />
    </div>
  );
}
