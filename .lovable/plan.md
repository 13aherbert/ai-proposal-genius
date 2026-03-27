

## Fix: Texas SmartBuy Results Missing Titles

### Root Cause

The field name mapping in `fetchTexas` (line 466) uses incorrect column names. The actual Socrata dataset fields are:

**TCEQ Contracts (`svjm-sdfz`):**
- `project_name` → title (code looks for `description` — wrong)
- `vendor_name_description` → vendor (code looks for `vendor_name` — wrong)
- `po_contract_number` → external_id (correct)
- `pcc_code` → naics_code field
- `total_amount` → available but unused

**DIR Active Contracts (`vipt-h4ye`):**
- `rfo_description` → title (code looks for `description` — wrong)
- `primary_vendor_name` → vendor
- `contract_number` → external_id (correct)
- `rfo_number` → solicitation number
- `primary_vendor_hub_status` → set_aside (code looks for `hub_status` — wrong)
- `contract_type` / `contract_subtype` → type
- `contract_start` → posted_date (code looks for `start_date` — only works for TCEQ)
- `contract_termination_date` → response_deadline (code looks for `end_date` — only works for TCEQ)
- `contract_manager`, `contract_manager_email` → useful metadata

### Fix

Update the field mapping on lines 463-478 to use the correct column names from both datasets:

```typescript
title: opp.project_name || opp.rfo_description || opp.vendor_name_description || opp.primary_vendor_name || "",
solicitation_number: String(opp.po_contract_number || opp.rfo_number || opp.contract_number || ""),
department: opp.agency_name || opp._tx_dataset || "Texas",
naics_code: opp.pcc_code || opp.commodity_code || "",
posted_date: opp.start_date || opp.contract_start || null,
response_deadline: opp.end_date || opp.contract_termination_date || null,
set_aside: opp.primary_vendor_hub_status || opp.hub_status || "",
type: opp.contract_type || opp.contract_subtype || opp.contract_or_po_2 || "contract",
```

### File to update
- `supabase/functions/search-opportunities/index.ts` — lines 463-478 (field mapping in `fetchTexas`)

### Expected result
Texas SmartBuy results will display proper titles like "Cell Phone Services", "Medical Monitoring", "Software Products, Software as a Service..." instead of empty strings.

