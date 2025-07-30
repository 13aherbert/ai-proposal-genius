import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReportRequest {
  reportId: string;
  format: string;
  organizationId: string;
}

interface AnalyticsData {
  metric_date: string;
  projects_created: number;
  active_users: number;
  avg_engagement: number;
  total_revenue: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    const { reportId, format, organizationId }: ReportRequest = await req.json()

    console.log(`Generating report ${reportId} in ${format} format for organization ${organizationId}`)

    // Verify user has access to the organization
    const { data: membership, error: membershipError } = await supabaseClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      throw new Error('User does not have access to this organization')
    }

    // Get the report configuration
    const { data: report, error: reportError } = await supabaseClient
      .from('organization_reports')
      .select('*')
      .eq('id', reportId)
      .eq('organization_id', organizationId)
      .single()

    if (reportError || !report) {
      throw new Error('Report not found')
    }

    // Fetch analytics data based on report configuration
    const analytics = await fetchAnalyticsData(supabaseClient, organizationId, report.report_config)
    
    // Generate the report content
    const reportContent = await generateReportContent(analytics, report, format)
    
    // For demo purposes, we'll return a mock file URL
    // In production, you would upload to storage and return the real URL
    const mockFileUrl = `https://example.com/reports/${reportId}.${format}`
    
    // Save the report output record
    const { data: output, error: outputError } = await supabaseClient
      .from('organization_report_outputs')
      .insert({
        report_id: reportId,
        organization_id: organizationId,
        output_format: format,
        file_url: mockFileUrl,
        file_size: reportContent.length,
        generated_by: user.id
      })
      .select()
      .single()

    if (outputError) {
      console.error('Error saving report output:', outputError)
      throw outputError
    }

    // Update the report's last_generated_at timestamp
    await supabaseClient
      .from('organization_reports')
      .update({ last_generated_at: new Date().toISOString() })
      .eq('id', reportId)

    console.log(`Report generated successfully: ${output.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        outputId: output.id,
        fileUrl: mockFileUrl,
        format: format
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error generating report:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate report' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})

async function fetchAnalyticsData(supabaseClient: any, organizationId: string, config: any): Promise<AnalyticsData[]> {
  try {
    // Calculate date range
    const daysBack = config.dateRange === '7d' ? 7 : config.dateRange === '30d' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    const { data, error } = await supabaseClient
      .from('organization_metrics_summary')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: true })

    if (error) {
      console.error('Error fetching analytics data:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchAnalyticsData:', error)
    return []
  }
}

async function generateReportContent(analytics: AnalyticsData[], report: any, format: string): Promise<string> {
  const reportData = {
    title: report.report_name,
    type: report.report_type,
    generatedAt: new Date().toISOString(),
    metrics: report.report_config.metrics,
    data: analytics,
    summary: generateSummary(analytics)
  }

  switch (format) {
    case 'json':
      return JSON.stringify(reportData, null, 2)
    
    case 'csv':
      return generateCSV(analytics)
    
    case 'pdf':
      return generatePDFContent(reportData)
    
    case 'excel':
      return generateExcelContent(reportData)
    
    default:
      return JSON.stringify(reportData, null, 2)
  }
}

function generateSummary(analytics: AnalyticsData[]) {
  if (analytics.length === 0) return null

  const totalProjects = analytics.reduce((sum, item) => sum + item.projects_created, 0)
  const maxUsers = Math.max(...analytics.map(item => item.active_users))
  const avgEngagement = analytics.reduce((sum, item) => sum + item.avg_engagement, 0) / analytics.length

  return {
    totalProjects,
    maxActiveUsers: maxUsers,
    averageEngagement: Math.round(avgEngagement * 100) / 100,
    reportPeriod: {
      start: analytics[0]?.metric_date,
      end: analytics[analytics.length - 1]?.metric_date
    }
  }
}

function generateCSV(analytics: AnalyticsData[]): string {
  const headers = ['Date', 'Projects Created', 'Active Users', 'Avg Engagement', 'Total Revenue']
  const rows = analytics.map(item => [
    item.metric_date,
    item.projects_created,
    item.active_users,
    item.avg_engagement,
    item.total_revenue || 0
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

function generatePDFContent(data: any): string {
  // In a real implementation, you would use a PDF generation library
  // For now, return HTML that could be converted to PDF
  return `
    <html>
      <head>
        <title>${data.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .metric { background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${data.title}</h1>
          <p>Generated on: ${new Date(data.generatedAt).toLocaleDateString()}</p>
          <p>Report Type: ${data.type}</p>
        </div>
        
        ${data.summary ? `
          <div class="summary">
            <h2>Summary</h2>
            <div class="metric">Total Projects: ${data.summary.totalProjects}</div>
            <div class="metric">Max Active Users: ${data.summary.maxActiveUsers}</div>
            <div class="metric">Average Engagement: ${data.summary.averageEngagement}%</div>
          </div>
        ` : ''}
        
        <h2>Detailed Analytics</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Projects Created</th>
              <th>Active Users</th>
              <th>Avg Engagement</th>
            </tr>
          </thead>
          <tbody>
            ${data.data.map((item: AnalyticsData) => `
              <tr>
                <td>${item.metric_date}</td>
                <td>${item.projects_created}</td>
                <td>${item.active_users}</td>
                <td>${item.avg_engagement.toFixed(2)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
}

function generateExcelContent(data: any): string {
  // In a real implementation, you would generate actual Excel file content
  // For now, return CSV format which Excel can open
  return generateCSV(data.data)
}