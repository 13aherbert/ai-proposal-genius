
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserFeedbackDialog } from '@/components/feedback/UserFeedbackDialog';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, BugIcon, Lightbulb, CheckCircle, AlertTriangle } from 'lucide-react';
import { BetaMetricsPanel } from './BetaMetricsPanel';
import { betaTestingService } from '@/services/BetaTestingService';
import { toast } from 'sonner';

export function BetaTesterDashboard() {
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'improvement' | 'general'>('general');
  const [activeTasks, setActiveTasks] = useState([
    {
      id: '1',
      title: "Test RFP Document Upload",
      description: "Try uploading different document formats and verify correct parsing",
      priority: "high"
    },
    {
      id: '2',
      title: "Create a Complex Proposal",
      description: "Test the proposal editor with multiple sections and formatting",
      priority: "medium"
    },
    {
      id: '3',
      title: "Verify Knowledge Base Integration",
      description: "Check that Knowledge Base entries are correctly suggested in proposal drafts",
      priority: "low"
    }
  ]);
  const [completedTasks, setCompletedTasks] = useState([
    {
      id: '4',
      title: "Initial Login Flow",
      description: "Test the login and registration process"
    }
  ]);
  const navigate = useNavigate();
  
  const handleStartTask = (taskId: string) => {
    const task = activeTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Navigate to appropriate section based on task
    switch(taskId) {
      case '1': // RFP Document Upload
        toast.success("Starting task: Test RFP Document Upload");
        navigate('/upload-rfp');
        break;
      case '2': // Complex Proposal
        toast.success("Starting task: Create a Complex Proposal");
        navigate('/recent-projects');
        break;
      case '3': // Knowledge Base Integration
        toast.success("Starting task: Verify Knowledge Base Integration");
        navigate('/knowledge-base');
        break;
      default:
        toast.info("Opening task details");
    }
  };
  
  const handleCompleteTask = (taskId: string) => {
    // Find the task to mark as completed
    const taskToComplete = activeTasks.find(t => t.id === taskId);
    if (!taskToComplete) return;
    
    // Remove task from active tasks
    const updatedActiveTasks = activeTasks.filter(t => t.id !== taskId);
    
    // Add task to completed tasks
    const updatedCompletedTasks = [
      ...completedTasks,
      {
        id: taskToComplete.id,
        title: taskToComplete.title,
        description: taskToComplete.description
      }
    ];
    
    // Update state
    setActiveTasks(updatedActiveTasks);
    setCompletedTasks(updatedCompletedTasks);
    
    // Show success message
    toast.success(`Task "${taskToComplete.title}" marked as completed!`);
    
    // In a real app, we would also save this to the database
    // betaTestingService.completeTask(taskId);
  };
  
  const openFeedbackDialog = (type: 'bug' | 'feature' | 'improvement' | 'general' = 'general') => {
    setFeedbackType(type);
    setFeedbackDialogOpen(true);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Beta Tester Dashboard</h1>
          <p className="text-muted-foreground">Help us improve OptiRFP by testing and providing feedback</p>
        </div>
        <Button onClick={() => openFeedbackDialog()}>Submit Feedback</Button>
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
            <Button variant="outline" className="w-full" onClick={() => openFeedbackDialog('bug')}>
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
            <Button variant="outline" className="w-full" onClick={() => openFeedbackDialog('feature')}>
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
              {activeTasks.map(task => (
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
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="shrink-0"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="shrink-0"
                      onClick={() => handleStartTask(task.id)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              {completedTasks.map(task => (
                <div key={task.id} className="border rounded-lg p-4 flex justify-between items-center opacity-60">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium line-through">{task.title}</h3>
                      <Badge variant="outline">completed</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
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
        defaultFeedbackType={feedbackType}
      />
    </div>
  );
}
