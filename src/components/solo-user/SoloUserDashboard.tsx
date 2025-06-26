
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Clock, 
  FileText, 
  TrendingUp, 
  Target,
  CheckCircle,
  Star,
  Zap
} from 'lucide-react';
import { GuidedTutorial } from './GuidedTutorial';
import { QuickStartTemplates } from './QuickStartTemplates';
import { ProgressiveFeatureDiscovery } from './ProgressiveFeatureDiscovery';
import { Step } from 'react-joyride';
import { useNavigate } from 'react-router-dom';

interface SoloUserDashboardProps {
  projectCount: number;
  knowledgeCount: number;
  hasCompletedTutorial?: boolean;
  onTutorialComplete: () => void;
}

const tutorialSteps: Step[] = [
  {
    target: '[data-tour="upload-rfp"]',
    content: 'Start here! Upload your RFP document to begin creating a winning proposal.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="projects"]',
    content: 'View and manage all your proposal projects in one place.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="knowledge-base"]',
    content: 'Build your content library to speed up future proposals.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="recent-activity"]',
    content: 'Keep track of your recent work and quick access to active projects.',
    placement: 'top',
  },
];

const achievements = [
  { id: 'first-project', title: 'First Project', description: 'Created your first proposal', icon: Trophy },
  { id: 'knowledge-builder', title: 'Knowledge Builder', description: 'Added 5 knowledge entries', icon: Star },
  { id: 'efficiency-expert', title: 'Efficiency Expert', description: 'Completed 10 proposals', icon: Zap },
  { id: 'template-master', title: 'Template Master', description: 'Created custom templates', icon: Target },
];

export function SoloUserDashboard({ 
  projectCount, 
  knowledgeCount, 
  hasCompletedTutorial = false,
  onTutorialComplete 
}: SoloUserDashboardProps) {
  const [showTutorial, setShowTutorial] = useState(!hasCompletedTutorial);
  const [showTemplates, setShowTemplates] = useState(false);
  const navigate = useNavigate();

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    onTutorialComplete();
  };

  const handleTutorialSkip = () => {
    setShowTutorial(false);
  };

  const calculateProgress = () => {
    let completed = 0;
    let total = 4;

    if (projectCount > 0) completed++;
    if (knowledgeCount > 0) completed++;
    if (hasCompletedTutorial) completed++;
    if (projectCount >= 3) completed++; // Multiple projects milestone

    return (completed / total) * 100;
  };

  const getUnlockedAchievements = () => {
    const unlocked = [];
    if (projectCount > 0) unlocked.push(achievements[0]);
    if (knowledgeCount >= 5) unlocked.push(achievements[1]);
    if (projectCount >= 10) unlocked.push(achievements[2]);
    return unlocked;
  };

  if (showTemplates) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setShowTemplates(false)}>
          ← Back to Dashboard
        </Button>
        <QuickStartTemplates />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTutorial && (
        <GuidedTutorial
          steps={tutorialSteps}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}

      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Your Proposal Journey
          </CardTitle>
          <CardDescription>
            Track your progress and unlock new features as you grow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Setup Progress</span>
              <span>{Math.round(calculateProgress())}% Complete</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{projectCount}</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{knowledgeCount}</div>
              <div className="text-sm text-muted-foreground">Knowledge Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((projectCount / 30) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Monthly Goal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {getUnlockedAchievements().length}
              </div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/upload-rfp')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              New Proposal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Upload an RFP and create a winning proposal
            </p>
            <Badge variant="secondary">Quick Start</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowTemplates(true)}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Use Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Start with industry-specific templates
            </p>
            <Badge variant="secondary">Faster Setup</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/knowledge-base')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Build your content library
            </p>
            <Badge variant="secondary">Productivity</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Progressive Feature Discovery */}
      <ProgressiveFeatureDiscovery 
        projectCount={projectCount}
        knowledgeCount={knowledgeCount}
        proposalCount={projectCount} // Assuming 1:1 ratio for now
      />

      {/* Achievements */}
      {getUnlockedAchievements().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Your Achievements
            </CardTitle>
            <CardDescription>
              Milestones you've unlocked on your proposal journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getUnlockedAchievements().map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">💡 Pro Tip</h3>
              <p className="text-sm text-muted-foreground">
                {projectCount === 0 
                  ? "Start by uploading your first RFP to see how AI can transform your proposal process."
                  : knowledgeCount === 0
                  ? "Add content to your Knowledge Base to make future proposals even faster."
                  : "Try using templates to streamline your proposal creation process."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
