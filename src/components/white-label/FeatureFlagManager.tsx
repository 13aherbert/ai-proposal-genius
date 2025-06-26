
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Flag, 
  Users, 
  Settings, 
  Zap, 
  Shield, 
  Eye,
  Save,
  Plus
} from "lucide-react";
import { toast } from "sonner";

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  category: 'core' | 'advanced' | 'experimental' | 'premium';
  enabled: boolean;
  partnersEnabled: number;
  totalPartners: number;
}

interface Partner {
  id: string;
  name: string;
  plan: 'basic' | 'pro' | 'enterprise';
}

export function FeatureFlagManager() {
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [features, setFeatures] = useState<FeatureFlag[]>([
    {
      id: '1',
      name: 'AI Proposal Generation',
      key: 'ai_proposal_generation',
      description: 'Enable AI-powered proposal generation for end users',
      category: 'core',
      enabled: true,
      partnersEnabled: 8,
      totalPartners: 12
    },
    {
      id: '2',
      name: 'Advanced Analytics',
      key: 'advanced_analytics',
      description: 'Detailed analytics and reporting dashboard',
      category: 'advanced',
      enabled: false,
      partnersEnabled: 3,
      totalPartners: 12
    },
    {
      id: '3',
      name: 'Custom Branding',
      key: 'custom_branding',
      description: 'Allow partners to customize platform branding',
      category: 'premium',
      enabled: true,
      partnersEnabled: 5,
      totalPartners: 12
    },
    {
      id: '4',
      name: 'Beta Features',
      key: 'beta_features',
      description: 'Access to experimental and beta features',
      category: 'experimental',
      enabled: false,
      partnersEnabled: 1,
      totalPartners: 12
    },
    {
      id: '5',
      name: 'API Access',
      key: 'api_access',
      description: 'RESTful API access for integrations',
      category: 'advanced',
      enabled: true,
      partnersEnabled: 6,
      totalPartners: 12
    }
  ]);

  const [partners] = useState<Partner[]>([
    { id: '1', name: 'Acme Solutions', plan: 'enterprise' },
    { id: '2', name: 'TechStart Inc', plan: 'pro' },
    { id: '3', name: 'Global Corp', plan: 'enterprise' },
    { id: '4', name: 'StartupXYZ', plan: 'basic' }
  ]);

  const handleFeatureToggle = (featureId: string, enabled: boolean) => {
    setFeatures(prev => 
      prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, enabled }
          : feature
      )
    );
    
    const feature = features.find(f => f.id === featureId);
    toast.success(`${feature?.name} ${enabled ? 'enabled' : 'disabled'} successfully`);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      core: 'bg-blue-100 text-blue-800',
      advanced: 'bg-purple-100 text-purple-800',
      experimental: 'bg-orange-100 text-orange-800',
      premium: 'bg-green-100 text-green-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      core: <Zap className="h-4 w-4" />,
      advanced: <Settings className="h-4 w-4" />,
      experimental: <Eye className="h-4 w-4" />,
      premium: <Shield className="h-4 w-4" />
    };
    return icons[category as keyof typeof icons] || <Flag className="h-4 w-4" />;
  };

  const filterFeaturesByCategory = (category?: string) => {
    if (!category) return features;
    return features.filter(feature => feature.category === category);
  };

  const getEnabledPercentage = (feature: FeatureFlag) => {
    return Math.round((feature.partnersEnabled / feature.totalPartners) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Flag Management</h2>
          <p className="text-muted-foreground">
            Control feature availability across your white label partners
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPartner} onValueChange={setSelectedPartner}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by partner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Partners</SelectItem>
              {partners.map(partner => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Feature Flag
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Features</TabsTrigger>
          <TabsTrigger value="core">Core</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
          <TabsTrigger value="experimental">Experimental</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {features.map((feature) => (
            <Card key={feature.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(feature.category)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{feature.name}</h3>
                          <Badge className={getCategoryColor(feature.category)}>
                            {feature.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Key: <code className="bg-muted px-1 rounded">{feature.key}</code>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {feature.partnersEnabled} / {feature.totalPartners} partners
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getEnabledPercentage(feature)}% enabled
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`feature-${feature.id}`} className="text-sm">
                        {feature.enabled ? 'Enabled' : 'Disabled'}
                      </Label>
                      <Switch
                        id={`feature-${feature.id}`}
                        checked={feature.enabled}
                        onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {['core', 'advanced', 'premium', 'experimental'].map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {filterFeaturesByCategory(category).map((feature) => (
              <Card key={feature.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(feature.category)}
                        <div>
                          <h3 className="font-semibold">{feature.name}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Key: <code className="bg-muted px-1 rounded">{feature.key}</code>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {feature.partnersEnabled} / {feature.totalPartners} partners
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getEnabledPercentage(feature)}% enabled
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label htmlFor={`feature-${feature.id}-${category}`} className="text-sm">
                          {feature.enabled ? 'Enabled' : 'Disabled'}
                        </Label>
                        <Switch
                          id={`feature-${feature.id}-${category}`}
                          checked={feature.enabled}
                          onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Partner-Specific Override Section */}
      {selectedPartner !== 'all' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Partner-Specific Overrides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Configure feature flags specifically for {partners.find(p => p.id === selectedPartner)?.name}
            </p>
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Partner-specific feature override functionality coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
