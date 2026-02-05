

## Knowledge Base Audit & Migration for Proposal Generation

### Current Situation

Your knowledge base currently contains **14 entries** across **7 categories**, but several issues require attention:

**Category Mismatch**: The database shows entries in legacy categories like:
- `process-&-methodology` (4 entries)
- `prior-rfp-responses` (3 entries) 
- `other-company-information` (3 entries)
- `pricing-templates` (1 entry)

However, the new proposal generation system expects entries in the **enhanced 12-category structure**:
- 6 Essential: Company Overview, Team Bios, Past Performance, Technical Capabilities, Pricing & Rates, Differentiators
- 2 Recommended: Certifications & Compliance, Process & Methodology
- 4 Optional: Client Testimonials, Industry Expertise, Legal & Terms, Tools & Technology

A `categoryMigrationMap` already exists in the codebase to map old categories to new ones, but it's not being applied to existing entries.

### Proposed Solution

#### Phase 1: Knowledge Base Audit Tool
Create an audit feature that analyzes existing entries for:
1. **Category alignment** - Map legacy categories to new essential/recommended/optional structure
2. **Content quality assessment** - Check if parsed content is substantive for proposal use
3. **Essential coverage gaps** - Identify which of the 6 essential categories need attention

#### Phase 2: Migration & Re-parsing System
1. **Category Migration**
   - Create a migration edge function that applies the `categoryMigrationMap` to existing entries
   - Update entries with legacy categories to their new category names

2. **Content Quality Review**
   - Add a "Content Review" status to entries
   - AI-powered analysis to extract and summarize essential proposal information from parsed content
   - Flag entries that need human review or enhancement

#### Phase 3: Knowledge Base Readiness Dashboard Enhancement
Update the existing `KnowledgeBaseReadiness` component to:
- Show legacy vs. new category distribution
- Display content quality scores per category
- Provide one-click migration action
- Show "proposal-ready" status for each entry

### Technical Implementation

**New Edge Function**: `audit-knowledge-base`
```text
POST /audit-knowledge-base
{
  "organizationId": "uuid",
  "action": "analyze" | "migrate" | "review"
}

Response:
{
  "analysis": {
    "totalEntries": 14,
    "legacyEntries": 8,
    "needsMigration": [...],
    "needsContentReview": [...],
    "essentialGaps": ["Company Overview & Mission", "Team Bios", ...],
    "readinessScore": 45
  }
}
```

**New Frontend Component**: `KnowledgeBaseAudit.tsx`
- Visual dashboard showing migration status
- Category mapping preview
- Bulk migration action button
- Content quality indicators

**Database Changes**:
- Add `content_quality_score` column to `knowledge_entries`
- Add `migration_status` column (null, 'pending', 'migrated', 'reviewed')

**Files to Create/Modify**:
1. `supabase/functions/audit-knowledge-base/index.ts` - Main audit logic
2. `src/components/knowledge-base/KnowledgeBaseAudit.tsx` - Audit dashboard UI
3. `src/components/knowledge-base/MigrationPreview.tsx` - Preview before migration
4. Database migration for new columns
5. Update `KnowledgeBase.tsx` to include audit panel

### User Workflow

1. User opens Knowledge Base page
2. New "Audit & Migrate" button appears in the sidebar
3. Clicking it shows:
   - Current category distribution (pie chart)
   - List of entries needing category migration
   - List of entries needing content review
   - Essential category gaps with recommendations
4. User can:
   - Preview category migrations before applying
   - Run bulk migration with one click
   - Request AI content review for quality assessment
5. After migration, readiness score updates automatically

