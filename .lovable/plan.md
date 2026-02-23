

## Fix: "View on..." Button Not Appearing

### Root Cause

The "View on..." button is wrapped in a conditional: `{opportunity.description_url && ...}`. The button only renders when `description_url` is a non-empty string. The SAM.gov API field `uiLink` is often missing or empty in search results, and the fallback URL `https://sam.gov/opp/${opp.noticeId}` only works when `noticeId` is present. Similarly, the Grants.gov URL is only constructed when `oppNumber` exists. When these fields are absent, `description_url` is an empty string, so the button never appears.

### Fix (2 files)

**1. Edge Function: `supabase/functions/search-opportunities/index.ts`**

Ensure `description_url` always has a value by improving the fallback logic:

- SAM.gov (line 87): Change from:
  ```
  description_url: opp.uiLink || `https://sam.gov/opp/${opp.noticeId || ""}`
  ```
  To:
  ```
  description_url: opp.uiLink || (opp.noticeId ? `https://sam.gov/opp/${opp.noticeId}` : (opp.solicitationNumber ? `https://sam.gov/search?keywords=${encodeURIComponent(opp.solicitationNumber)}` : "https://sam.gov"))
  ```

- Grants.gov (lines 134-136): Change from only building a URL when `oppNumber` exists, to always providing a fallback:
  ```
  description_url: opp.oppNumber
    ? `https://www.grants.gov/search-results-detail/${opp.oppNumber}`
    : (opp.id ? `https://www.grants.gov/search-results-detail/${opp.id}` : "https://www.grants.gov")
  ```

**2. Component: `src/components/opportunities/OpportunityCard.tsx`**

Remove the conditional wrapper so the button ALWAYS shows, even if `description_url` somehow ends up empty. Use a computed fallback URL based on `source`:

- Remove the `{opportunity.description_url && ...}` condition on line 123
- Compute the link URL: if `description_url` is present use it, otherwise fall back to `https://sam.gov` or `https://www.grants.gov` based on `opportunity.source`
- The button will always appear next to "Details" and "Save"

Updated button section (lines 105-131):
```tsx
<div className="flex items-center gap-2 pt-1 flex-wrap">
  <Button size="sm" variant="outline" onClick={() => onViewDetails(opportunity)}>
    <Eye className="mr-1.5 h-3.5 w-3.5" />
    Details
  </Button>
  <Button
    size="sm"
    variant={isSaved ? "secondary" : "default"}
    onClick={() => onSave(opportunity)}
    disabled={isSaved}
  >
    <Bookmark className="mr-1.5 h-3.5 w-3.5" />
    {isSaved ? "Saved" : "Save"}
  </Button>
  <Button size="sm" variant="outline" asChild>
    <a
      href={opportunity.description_url || getSourceFallbackUrl(opportunity.source)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
      View on {getSourceLabel(opportunity.source)}
    </a>
  </Button>
</div>
```

Add a small helper function:
```tsx
function getSourceFallbackUrl(source: string) {
  switch (source) {
    case "sam_gov": return "https://sam.gov";
    case "grants_gov": return "https://www.grants.gov";
    default: return "#";
  }
}
```

### Summary

| File | Change |
|---|---|
| `supabase/functions/search-opportunities/index.ts` | Improve `description_url` fallback logic so it is never empty |
| `src/components/opportunities/OpportunityCard.tsx` | Remove conditional wrapper on the button; add fallback URL helper so button always renders |

