import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  Zap, 
  BarChart3, 
  Palette, 
  Settings, 
  BookOpen, 
  Phone,
  CheckCircle,
  ArrowRight,
  Rocket,
  Star,
  Mail,
  Calendar,
} from 'lucide-react';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useCSMContact } from '@/hooks/use-csm-contact';
import { Link } from 'react-router-dom';

const quickActions = [
  {
    title: 'Invite Team Members',
    description: 'Add your team and set up roles',
    icon: Users,
    href: '/organization?tab=team',
    priority: 'high',
    estimatedTime: '5 min'
  },
  {
    title: 'Configure SSO',
    description: 'Set up single sign-on for your organization',
    icon: Shield,
    href: '/organization?tab=security',
    priority: 'high',
    estimatedTime: '15 min'
  },
  {
    title: 'API Integration',
    description: 'Generate API keys and set up webhooks',
    icon: Zap,
    href: '/organization?tab=api',
    priority: 'medium',
    estimatedTime: '10 min'
  },
  {
    title: 'Custom Branding',
    description: 'White label the platform with your branding',
    icon: Palette,
    href: '/white-label',
    priority: 'medium',
    estimatedTime: '20 min'
  },
  {
    title: 'Analytics Dashboard',
    description: 'View detailed usage and performance metrics',
    icon: BarChart3,
    href: '/organization?tab=analytics',
    priority: 'low',
    estimatedTime: '5 min'
  },
  {
    title: 'Organization Settings',
    description: 'Configure general organization preferences',
    icon: Settings,
    href: '/organization?tab=settings',
    priority: 'low',
    estimatedTime: '10 min'
  }
];

const enterpriseFeatures = [
  {
    category: 'Team Management',
    features: [
      'Unlimited team members',
      'Advanced role-based permissions',
      'Department organization',
      'Bulk user management',
      'Activity tracking'
    ]
  },
  {
    category: 'Security & Compliance',
    features: [
      'SSO integration (SAML, OAuth)',
      'Audit logging',
      'Data encryption',
      'Compliance reporting',
      'Custom security policies'
    ]
  },
  {
    category: 'Integration & API',
    features: [
      'Full REST API access',
      'Webhook configuration',
      'Third-party integrations',
      'Custom authentication',
      'Rate limiting controls'
    ]
  },
  {
    category: 'Customization',
    features: [
      'White label branding',
      'Custom domains',
      'Email templates',
      'Custom CSS',
      'Brand guidelines'
    ]
  }
];

export function EnterpriseGettingStarted() {
  const { organization } = useCurrentOrganization();
  const { csm } = useCSMContact();

  if (organization?.subscription_tier !== 'enterprise') {
    return null;
  }

  const highPriorityActions = quickActions.filter(action => action.priority === 'high');
  const mediumPriorityActions = quickActions.filter(action => action.priority === 'medium');
  const lowPriorityActions = quickActions.filter(action => action.priority === 'low');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Star className="h-3 w-3 mr-1" />
                  Enterprise
                </Badge>
                Welcome to Enterprise
              </CardTitle>
              <CardDescription className="mt-2">
                You now have access to our most powerful features. Get started with the essentials below.
              </CardDescription>
            </div>
            <Rocket className="h-8 w-8 text-primary" />
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions Tabs */}
      <Tabs defaultValue="priority" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="priority">Priority Setup</TabsTrigger>
          <TabsTrigger value="features">Enterprise Features</TabsTrigger>
          <TabsTrigger value="support">Support & Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="priority" className="space-y-6">
          {/* High Priority Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Essential Setup</h3>
              <Badge variant="destructive" className="text-xs">
                Recommended First
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highPriorityActions.map((action) => (
                <Card key={action.title} className="hover:shadow-md transition-shadow border-orange-200 bg-orange-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 bg-orange-100 rounded-lg">
                        <action.icon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {action.estimatedTime}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <a href={action.href}>
                          Setup <ArrowRight className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Medium Priority Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Enhanced Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mediumPriorityActions.map((action) => (
                <Card key={action.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                        <action.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {action.estimatedTime}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={action.href}>
                          Setup <ArrowRight className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Low Priority Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowPriorityActions.map((action) => (
                <Card key={action.title} className="hover:shadow-md transition-shadow border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 bg-muted/50 rounded-lg">
                        <action.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {action.estimatedTime}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={action.href}>
                          Setup <ArrowRight className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enterpriseFeatures.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Priority Support
                </CardTitle>
                <CardDescription>
                  Get direct access to our enterprise support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Your CSM: {csm.name}</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 24/7 Priority Email Support</li>
                    <li>• Dedicated Account Manager</li>
                    <li>• Phone Support (Business Hours)</li>
                    <li>• 4-hour email SLA</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" asChild>
                    <a href={`mailto:${csm.email}`}>
                      <Mail className="mr-2 h-4 w-4" /> Email CSM
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={csm.calendlyUrl} target="_blank" rel="noopener noreferrer">
                      <Calendar className="mr-2 h-4 w-4" /> Book Call
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Documentation & Resources
                </CardTitle>
                <CardDescription>
                  Comprehensive guides and API documentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Available Resources:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Enterprise Setup Guides</li>
                    <li>• API Documentation</li>
                    <li>• Integration Tutorials</li>
                    <li>• Best Practices Guides</li>
                  </ul>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/docs">View Documentation</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Implementation Services */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Implementation Services</CardTitle>
              <CardDescription>
                Need help getting started? Our team can help you implement and configure your enterprise setup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Professional Services Available:</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Custom implementation, training, and ongoing support
                  </p>
                </div>
                <Button asChild>
                  <a href={csm.calendlyUrl} target="_blank" rel="noopener noreferrer">
                    Schedule Consultation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}