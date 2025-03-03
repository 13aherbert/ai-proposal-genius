
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sample data for charts
const feedbackData = [
  { name: 'Week 1', bugs: 12, features: 5, improvements: 8 },
  { name: 'Week 2', bugs: 9, features: 7, improvements: 10 },
  { name: 'Week 3', bugs: 5, features: 9, improvements: 12 },
  { name: 'Week 4', bugs: 3, features: 11, improvements: 15 },
];

const feedbackTypeData = [
  { name: 'Bugs', value: 29 },
  { name: 'Features', value: 32 },
  { name: 'Improvements', value: 45 },
  { name: 'General', value: 18 },
];

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

export function BetaMetricsPanel() {
  const [activeMetric, setActiveMetric] = useState('feedback');
  
  // Calculate progress for different metrics
  const bugFixProgress = 76;
  const featureImplementationProgress = 42;
  const overallCompletionProgress = 68;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium mb-2">Bug Fixes</div>
            <Progress value={bugFixProgress} className="h-2" />
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-muted-foreground">{bugFixProgress}% Complete</span>
              <span className="font-medium">29 Issues</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium mb-2">Feature Implementation</div>
            <Progress value={featureImplementationProgress} className="h-2" />
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-muted-foreground">{featureImplementationProgress}% Complete</span>
              <span className="font-medium">32 Requests</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium mb-2">Overall Progress</div>
            <Progress value={overallCompletionProgress} className="h-2" />
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-muted-foreground">{overallCompletionProgress}% Complete</span>
              <span className="font-medium">Beta v0.8</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="feedback" onValueChange={setActiveMetric}>
        <TabsList className="mb-4">
          <TabsTrigger value="feedback">Feedback Trends</TabsTrigger>
          <TabsTrigger value="distribution">Feedback Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feedback" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={feedbackData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bugs" fill="#ef4444" name="Bugs" />
              <Bar dataKey="features" fill="#3b82f6" name="Feature Requests" />
              <Bar dataKey="improvements" fill="#10b981" name="Improvements" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
        
        <TabsContent value="distribution" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={feedbackTypeData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {feedbackTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        {[
          { label: 'Active Testers', value: '42' },
          { label: 'Total Feedback Items', value: '124' },
          { label: 'Features Implemented', value: '18' },
          { label: 'Days Until Launch', value: '21' },
        ].map((metric, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
