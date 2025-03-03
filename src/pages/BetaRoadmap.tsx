
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ArrowLeft, AlertCircle, BadgeCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function BetaRoadmap() {
  const navigate = useNavigate();
  
  const roadmapItems = [
    {
      title: 'Alpha Testing Phase',
      description: 'Internal testing and core functionality development',
      status: 'completed',
      date: 'April 2023',
      items: [
        { feature: 'Basic RFP Uploading', status: 'completed' },
        { feature: 'User Authentication', status: 'completed' },
        { feature: 'Simple Proposal Editor', status: 'completed' }
      ]
    },
    {
      title: 'Private Beta',
      description: 'Limited access to invited users for initial feedback',
      status: 'current',
      date: 'May - June 2023',
      items: [
        { feature: 'Advanced Proposal Editor', status: 'completed' },
        { feature: 'Knowledge Base Integration', status: 'current' },
        { feature: 'AI-Powered Content Suggestions', status: 'current' },
        { feature: 'Bug Fixes from Alpha Feedback', status: 'completed' }
      ]
    },
    {
      title: 'Public Beta',
      description: 'Open to all users with essential features',
      status: 'upcoming',
      date: 'July 2023',
      items: [
        { feature: 'Performance Improvements', status: 'upcoming' },
        { feature: 'Team Collaboration Features', status: 'upcoming' },
        { feature: 'Enhanced Export Options', status: 'upcoming' },
        { feature: 'Advanced Analytics', status: 'upcoming' }
      ]
    },
    {
      title: 'Official Launch',
      description: 'Full release with complete feature set',
      status: 'planned',
      date: 'August 2023',
      items: [
        { feature: 'Enterprise SSO Integration', status: 'planned' },
        { feature: 'Custom Branding Options', status: 'planned' },
        { feature: 'API Access for Integrations', status: 'planned' },
        { feature: 'Advanced User Permissions', status: 'planned' }
      ]
    }
  ];
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'upcoming':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <BadgeCheck className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 border-green-300';
      case 'current':
        return 'text-blue-500 border-blue-300';
      case 'upcoming':
        return 'text-amber-500 border-amber-300';
      default:
        return 'text-gray-400 border-gray-300';
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            className="flex items-center mb-2"
            onClick={() => navigate('/beta/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Beta Program Roadmap</h1>
          <p className="text-muted-foreground">Our plan for developing and improving OptiRFP</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Development Timeline</CardTitle>
          <CardDescription>Track our progress from alpha to official launch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {roadmapItems.map((phase, index) => (
              <div key={index} className="mb-8 relative">
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getStatusClass(phase.status)}`}>
                    {getStatusIcon(phase.status)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-lg font-semibold">{phase.title}</h3>
                      <div className={`text-sm px-3 py-1 rounded-full border ${getStatusClass(phase.status)}`}>
                        {phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">{phase.date}</p>
                    <p className="mb-4">{phase.description}</p>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Key Features:</h4>
                      <ul className="space-y-2">
                        {phase.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${getStatusClass(item.status)}`}>
                              {getStatusIcon(item.status)}
                            </div>
                            <span className={item.status === 'completed' ? 'line-through opacity-70' : ''}>
                              {item.feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {index < roadmapItems.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-muted h-[calc(100%-40px)]" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Beta Success Metrics</CardTitle>
          <CardDescription>The goals we aim to achieve during beta testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">User Experience Goals</h3>
              <ul className="space-y-3">
                {[
                  "90% of beta users can successfully create a proposal within 30 minutes",
                  "Average user satisfaction rating of 4.2/5 or higher",
                  "Less than 5% of users report confusion about core features",
                  "80% of beta testers report that the product saves them time"
                ].map((goal, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5">
                      <span className="text-xs text-primary font-medium">{index + 1}</span>
                    </div>
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Technical & Quality Goals</h3>
              <ul className="space-y-3">
                {[
                  "Zero critical bugs at the end of beta testing",
                  "All core features functioning with 99.5% reliability",
                  "Page load times under 2 seconds for all main features",
                  "Successfully process and analyze 95% of uploaded RFP documents",
                  "System uptime of 99.9% throughout the beta period"
                ].map((goal, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5">
                      <span className="text-xs text-primary font-medium">{index + 1}</span>
                    </div>
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div>
            <h3 className="font-semibold mb-4">Beta Testing Participation Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { metric: 'Active Beta Testers', target: '50+', current: '42' },
                { metric: 'Feedback Items Collected', target: '200+', current: '124' },
                { metric: 'Feature Suggestions Implemented', target: '25+', current: '18' }
              ].map((item, index) => (
                <Card key={index} className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">{item.metric}</div>
                    <div className="flex items-end justify-between mt-1">
                      <div className="text-2xl font-bold">{item.current}</div>
                      <div className="text-sm">Target: {item.target}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
