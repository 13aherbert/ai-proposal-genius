
import React from 'react';
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const timeData = [{
  name: 'Traditional',
  value: 32,
  label: '32 Hours'
}, {
  name: 'OptiRFP',
  value: 2,
  label: '2 Hours'
}];

const costData = [{
  name: 'Traditional',
  value: 2000,
  label: '$2,000'
}, {
  name: 'OptiRFP',
  value: 50,
  label: '$50/proposal'
}];

const chartConfig = {
  traditional: {
    color: '#E5E7EB'  // Using a more desaturated gray
  },
  optirfp: {
    color: '#34D399'
  }
};

const CustomTooltip = ({
  active,
  payload,
  label
}: any) => {
  if (active && payload && payload.length) {
    return <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-3 shadow-lg">
        <p className="text-[#F1F1F1] font-medium mb-1">{payload[0].payload.name}</p>
        <p className="text-[#34D399] font-bold">{payload[0].payload.label}</p>
      </div>;
  }
  return null;
};

export function ComparisonCharts() {
  return <div className="w-full space-y-12 py-16 animate-fade-up">
      <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-[#34D399] to-[#059669] bg-clip-text text-transparent">
        Save Time & Money with OptiRFP
      </h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-[#181818]/90 rounded-lg p-6 backdrop-blur-sm shadow-lg">
          <h3 className="text-xl font-semibold text-center mb-6 text-gray-100">
            Average Time to Complete a Proposal
          </h3>
          <div className="h-[300px] flex items-center justify-start">
            <ChartContainer config={chartConfig} className="w-full [&_.recharts-cartesian-grid-horizontal_line]:stroke-muted [&_.recharts-cartesian-grid-vertical_line]:stroke-muted">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={timeData} layout="vertical" margin={{
                left: 50,
                right: 70,
                top: 10,
                bottom: 10
              }}>
                  <XAxis type="number" unit=" hrs" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 4, 4]}
                    fill="#34D399"
                    className="[&[name='Traditional']]:!fill-[#E5E7EB] [&[name='Traditional']]:!opacity-50"
                  />
                  <ChartTooltip content={CustomTooltip} cursor={{
                  fillOpacity: 0.3
                }} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <p className="text-center text-white mt-4 px-4 py-2 rounded-lg bg-brand-green-dark font-medium">
            93.75% reduction in proposal creation time
          </p>
        </div>

        <div className="bg-[#181818]/90 rounded-lg p-6 backdrop-blur-sm shadow-lg">
          <h3 className="text-xl font-semibold text-center mb-6 text-gray-100">
            Average Cost per Proposal
          </h3>
          <div className="h-[300px] flex items-center justify-start">
            <ChartContainer config={chartConfig} className="w-full [&_.recharts-cartesian-grid-horizontal_line]:stroke-muted [&_.recharts-cartesian-grid-vertical_line]:stroke-muted">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={costData} layout="vertical" margin={{
                left: 50,
                right: 70,
                top: 10,
                bottom: 10
              }}>
                  <XAxis type="number" unit="$" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 4, 4]}
                    fill="#34D399"
                    className="[&[name='Traditional']]:!fill-[#E5E7EB] [&[name='Traditional']]:!opacity-50"
                  />
                  <ChartTooltip content={CustomTooltip} cursor={{
                  fillOpacity: 0.3
                }} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <p className="text-center text-white mt-4 px-4 py-2 rounded-lg bg-brand-green-dark font-medium">
            97.55% cost savings per proposal
          </p>
        </div>
      </div>
    </div>;
}
