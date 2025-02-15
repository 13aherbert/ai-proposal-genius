
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const timeData = [
  {
    name: 'Traditional',
    value: 32,
    label: '32 Hours',
  },
  {
    name: 'OptiRFP',
    value: 2,
    label: '2 Hours',
  },
];

const costData = [
  {
    name: 'Traditional',
    value: 4000,
    label: '$4,000',
  },
  {
    name: 'OptiRFP',
    value: 1200,
    label: '$1,200',
  },
];

const config = {
  traditional: {
    color: '#4B4F54',
  },
  optirfp: {
    color: '#34D399',
  },
};

// Custom tooltip content component with improved styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-3 shadow-lg">
        <p className="text-[#F1F1F1] font-medium mb-1">{payload[0].payload.name}</p>
        <p className="text-[#34D399] font-bold">{payload[0].payload.label}</p>
      </div>
    );
  }
  return null;
};

export function ComparisonCharts() {
  return (
    <div className="w-full space-y-12 py-16 animate-fade-up">
      <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-[#34D399] to-[#059669] bg-clip-text text-transparent">
        Save Time & Money with OptiRFP
      </h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Time Comparison Chart */}
        <div className="bg-[#181818]/90 rounded-lg p-6 backdrop-blur-sm shadow-lg">
          <h3 className="text-xl font-semibold text-center mb-6 text-gray-100">
            Average Time to Complete a Proposal
          </h3>
          <div className="h-[300px]">
            <ChartContainer
              config={config}
              className="[&_.recharts-cartesian-grid-horizontal_line]:stroke-muted [&_.recharts-cartesian-grid-vertical_line]:stroke-muted"
            >
              <BarChart 
                data={timeData} 
                layout="vertical"
                margin={{ left: 100, right: 20, top: 20, bottom: 20 }}
              >
                <XAxis type="number" unit=" hrs" />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={90}
                />
                <Bar
                  dataKey="value"
                  fill="currentColor"
                  className="fill-brand-green [&[dataKey='value'][name='Traditional']]:fill-transparent [&[dataKey='value'][name='Traditional']]:stroke-white [&[dataKey='value'][name='Traditional']]:stroke-2"
                  radius={[4, 4, 4, 4]}
                />
                <ChartTooltip
                  content={CustomTooltip}
                  cursor={{ fillOpacity: 0.1 }}
                />
              </BarChart>
            </ChartContainer>
          </div>
          <p className="text-center text-gray-400 mt-4">
            93.75% reduction in proposal creation time
          </p>
        </div>

        {/* Cost Comparison Chart */}
        <div className="bg-[#181818]/90 rounded-lg p-6 backdrop-blur-sm shadow-lg">
          <h3 className="text-xl font-semibold text-center mb-6 text-gray-100">
            Average Cost per Proposal
          </h3>
          <div className="h-[300px]">
            <ChartContainer
              config={config}
              className="[&_.recharts-cartesian-grid-horizontal_line]:stroke-muted [&_.recharts-cartesian-grid-vertical_line]:stroke-muted"
            >
              <BarChart 
                data={costData} 
                layout="vertical"
                margin={{ left: 100, right: 20, top: 20, bottom: 20 }}
              >
                <XAxis type="number" unit="$" />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={90}
                />
                <Bar
                  dataKey="value"
                  fill="currentColor"
                  className="fill-brand-green [&[dataKey='value'][name='Traditional']]:fill-transparent [&[dataKey='value'][name='Traditional']]:stroke-white [&[dataKey='value'][name='Traditional']]:stroke-2"
                  radius={[4, 4, 4, 4]}
                />
                <ChartTooltip
                  content={CustomTooltip}
                  cursor={{ fillOpacity: 0.1 }}
                />
              </BarChart>
            </ChartContainer>
          </div>
          <p className="text-center text-gray-400 mt-4">
            70% cost savings per proposal
          </p>
        </div>
      </div>
    </div>
  );
}
