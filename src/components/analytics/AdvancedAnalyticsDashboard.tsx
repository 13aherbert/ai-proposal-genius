import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BusinessIntelligenceDashboard } from './BusinessIntelligenceDashboard';
import { CustomReportBuilder } from './CustomReportBuilder';
import { UsageAnalytics } from '../organization/UsageAnalytics';
import { BarChart3, FileText, TrendingUp, Users } from 'lucide-react';

export function AdvancedAnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics & Intelligence</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics, business intelligence, and custom reporting for your organization
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Business Intelligence</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Custom Reports</span>
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Usage Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Quick overview of your organization's key performance indicators
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Usage Analytics</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Track project creation, user activity, and feature adoption
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Business Intelligence</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      AI-powered insights and trend analysis
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Custom Reports</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generate branded reports in multiple formats
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">User Engagement</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Monitor user engagement and team productivity
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-dashed rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="text-center space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                      <h4 className="font-medium">Generate Report</h4>
                      <p className="text-sm text-muted-foreground">
                        Create a custom report with your selected metrics
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-dashed rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="text-center space-y-2">
                      <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground" />
                      <h4 className="font-medium">View Insights</h4>
                      <p className="text-sm text-muted-foreground">
                        Explore AI-generated business insights
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-dashed rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="text-center space-y-2">
                      <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground" />
                      <h4 className="font-medium">Export Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Export your analytics data for external analysis
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="intelligence">
          <BusinessIntelligenceDashboard />
        </TabsContent>

        <TabsContent value="reports">
          <CustomReportBuilder />
        </TabsContent>

        <TabsContent value="usage">
          <UsageAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}