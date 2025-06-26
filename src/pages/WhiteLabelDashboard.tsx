
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Palette, 
  Users, 
  Globe, 
  Flag, 
  BarChart3,
  Settings,
  Crown
} from "lucide-react";
import { BrandingCustomizer } from "@/components/white-label/BrandingCustomizer";
import { PartnerPortal } from "@/components/white-label/PartnerPortal";
import { DomainManager } from "@/components/white-label/DomainManager";
import { FeatureFlagManager } from "@/components/white-label/FeatureFlagManager";

export default function WhiteLabelDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    {
      label: "Active Partners",
      value: "12",
      icon: Users,
      color: "text-blue-500"
    },
    {
      label: "Custom Domains",
      value: "8",
      icon: Globe,
      color: "text-green-500"
    },
    {
      label: "Feature Flags",
      value: "24",
      icon: Flag,
      color: "text-purple-500"
    },
    {
      label: "Monthly Revenue",
      value: "$15,420",
      icon: BarChart3,
      color: "text-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">White Label Management</h1>
                <p className="text-muted-foreground">
                  Manage your white label partners and customizations
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              Phase 4: Foundation
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Partners
            </TabsTrigger>
            <TabsTrigger value="domains" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Domains
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>White Label Foundation Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <Palette className="h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium">Branding Customization</h4>
                        <p className="text-sm text-muted-foreground">
                          Complete branding control with colors, logos, and custom CSS
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="font-medium">Partner Portal</h4>
                        <p className="text-sm text-muted-foreground">
                          Comprehensive partner management and analytics
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                      <Globe className="h-5 w-5 text-purple-500" />
                      <div>
                        <h4 className="font-medium">Custom Domains</h4>
                        <p className="text-sm text-muted-foreground">
                          Full domain management with SSL and DNS configuration
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                      <Flag className="h-5 w-5 text-orange-500" />
                      <div>
                        <h4 className="font-medium">Feature Flags</h4>
                        <p className="text-sm text-muted-foreground">
                          Granular control over feature availability per partner
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <BrandingCustomizer />
          </TabsContent>

          <TabsContent value="partners">
            <PartnerPortal />
          </TabsContent>

          <TabsContent value="domains">
            <DomainManager />
          </TabsContent>

          <TabsContent value="features">
            <FeatureFlagManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
