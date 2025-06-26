
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Building, Code, Briefcase, Lightbulb, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Template {
  id: string;
  title: string;
  description: string;
  industry: string;
  icon: React.ComponentType<any>;
  estimatedTime: string;
  sections: string[];
}

const templates: Template[] = [
  {
    id: 'consulting',
    title: 'Management Consulting Proposal',
    description: 'Perfect for strategy consulting, process improvement, and organizational development projects',
    industry: 'Consulting',
    icon: Briefcase,
    estimatedTime: '15 min',
    sections: ['Executive Summary', 'Problem Analysis', 'Proposed Solution', 'Implementation Plan', 'Team & Qualifications']
  },
  {
    id: 'construction',
    title: 'Construction & Engineering',
    description: 'Ideal for construction projects, renovation work, and engineering services',
    industry: 'Construction',
    icon: Building,
    estimatedTime: '20 min',
    sections: ['Project Overview', 'Scope of Work', 'Materials & Labor', 'Timeline', 'Safety Requirements']
  },
  {
    id: 'technology',
    title: 'Technology & Software',
    description: 'Tailored for software development, IT services, and digital transformation projects',
    industry: 'Technology',
    icon: Code,
    estimatedTime: '18 min',
    sections: ['Technical Requirements', 'Solution Architecture', 'Development Approach', 'Testing Strategy', 'Support & Maintenance']
  },
  {
    id: 'creative',
    title: 'Creative & Marketing',
    description: 'Designed for marketing campaigns, branding projects, and creative services',
    industry: 'Marketing',
    icon: Lightbulb,
    estimatedTime: '12 min',
    sections: ['Campaign Overview', 'Target Audience', 'Creative Concept', 'Timeline & Deliverables', 'Budget Breakdown']
  }
];

export function QuickStartTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const navigate = useNavigate();

  const handleUseTemplate = (template: Template) => {
    // Navigate to upload RFP with template pre-selected
    navigate('/upload-rfp', { state: { templateId: template.id } });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Quick-Start Templates</h2>
        <p className="text-muted-foreground">
          Get started faster with industry-specific proposal templates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{template.industry}</Badge>
                        <span className="text-sm text-muted-foreground">{template.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-3">{template.description}</CardDescription>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Includes:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.sections.map((section) => (
                      <Badge key={section} variant="outline" className="text-xs">
                        {section}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseTemplate(template);
                  }}
                >
                  Use This Template
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
