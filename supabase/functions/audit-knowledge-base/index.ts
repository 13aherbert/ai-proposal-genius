import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const categoryMigrationMap: Record<string, string> = {
  "Company Boilerplates": "Company Overview & Mission",
  "company-boilerplates": "Company Overview & Mission",
  "Legal Disclaimers": "Legal & Terms",
  "legal-disclaimers": "Legal & Terms",
  "Prior RFP Responses": "Past Performance & Case Studies",
  "prior-rfp-responses": "Past Performance & Case Studies",
  "Industry Benchmarks": "Industry Expertise",
  "industry-benchmarks": "Industry Expertise",
  "Competitive Insights": "Differentiators & Value Props",
  "competitive-insights": "Differentiators & Value Props",
  "Pricing Templates": "Pricing & Rates",
  "pricing-templates": "Pricing & Rates",
  "Estimation Tools": "Process & Methodology",
  "estimation-tools": "Process & Methodology",
  "Other Company Information": "Company Overview & Mission",
  "other-company-information": "Company Overview & Mission",
  "process-&-methodology": "Process & Methodology",
};

const validCategories = [
  "Company Overview & Mission",
  "Team Bios & Qualifications",
  "Past Performance & Case Studies",
  "Technical Capabilities",
  "Pricing & Rates",
  "Differentiators & Value Props",
  "Certifications & Compliance",
  "Process & Methodology",
  "Client Testimonials",
  "Industry Expertise",
  "Legal & Terms",
  "Tools & Technology",
];

const essentialCategories = [
  "Company Overview & Mission",
  "Team Bios & Qualifications",
  "Past Performance & Case Studies",
  "Technical Capabilities",
  "Pricing & Rates",
  "Differentiators & Value Props",
];

function mapCategory(category: string): string | null {
  if (validCategories.includes(category)) return null;
  if (categoryMigrationMap[category]) return categoryMigrationMap[category];
  const normalized = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
  for (const [key, value] of Object.entries(categoryMigrationMap)) {
    if (key.toLowerCase().replace(/[^a-z0-9]/g, '-') === normalized) {
      return value;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, organizationId, entryIds, entryId, qualityScore } = await req.json();

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organizationId is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let result;

    if (action === 'analyze') {
      const { data: entries, error } = await supabase
        .from('knowledge_entries')
        .select('entry_id, category, title, content, parsed_content, migration_status, content_quality_score')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const needsMigration: any[] = [];
      const needsContentReview: any[] = [];
      const categoryDistribution: Record<string, number> = {};
      let legacyCount = 0, migratedCount = 0;

      for (const entry of entries || []) {
        categoryDistribution[entry.category] = (categoryDistribution[entry.category] || 0) + 1;
        const suggestedCategory = mapCategory(entry.category);
        if (suggestedCategory) {
          legacyCount++;
          if (entry.migration_status !== 'migrated') {
            needsMigration.push({ entry_id: entry.entry_id, title: entry.title, currentCategory: entry.category, suggestedCategory });
          }
        }
        if (entry.migration_status === 'migrated') migratedCount++;
        const content = entry.parsed_content || entry.content || '';
        if (content.length < 100 && entry.migration_status !== 'reviewed') {
          needsContentReview.push({ entry_id: entry.entry_id, title: entry.title, category: entry.category, reason: content.length === 0 ? 'No content' : 'Content too short' });
        }
      }

      const coveredEssentials = new Set<string>();
      for (const entry of entries || []) {
        const cat = mapCategory(entry.category) || entry.category;
        if (essentialCategories.includes(cat)) coveredEssentials.add(cat);
      }
      const essentialGaps = essentialCategories.filter(c => !coveredEssentials.has(c));
      
      const totalEntries = (entries || []).length;
      const essentialCoverage = (essentialCategories.length - essentialGaps.length) / essentialCategories.length;
      const migrationProgress = totalEntries > 0 ? (totalEntries - needsMigration.length) / totalEntries : 0;
      const contentQuality = totalEntries > 0 && needsContentReview.length > 0 ? Math.max(0.5, 1 - (needsContentReview.length / totalEntries)) : 1;
      const readinessScore = Math.round((essentialCoverage * 0.5 + migrationProgress * 0.3 + contentQuality * 0.2) * 100);

      result = { totalEntries, legacyEntries: legacyCount, migratedEntries: migratedCount, needsMigration, needsContentReview, categoryDistribution, essentialGaps, readinessScore };
    } else if (action === 'migrate') {
      let query = supabase.from('knowledge_entries').select('entry_id, category, title').eq('organization_id', organizationId).is('migration_status', null);
      if (entryIds?.length) query = query.in('entry_id', entryIds);
      const { data: entries, error } = await query;
      if (error) throw error;

      let migrated = 0;
      const errors: string[] = [];
      for (const entry of entries || []) {
        const suggested = mapCategory(entry.category);
        if (suggested) {
          const { error: upErr } = await supabase.from('knowledge_entries').update({ category: suggested, migration_status: 'migrated', updated_at: new Date().toISOString() }).eq('entry_id', entry.entry_id);
          if (upErr) errors.push(`Failed: ${entry.title}`);
          else migrated++;
        }
      }
      result = { migrated, errors };
    } else if (action === 'review') {
      if (!entryId) return new Response(JSON.stringify({ error: 'entryId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { error } = await supabase.from('knowledge_entries').update({ migration_status: 'reviewed', content_quality_score: qualityScore || 100, updated_at: new Date().toISOString() }).eq('entry_id', entryId);
      result = { success: !error };
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
