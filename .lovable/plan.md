

## Integrate Apify CaleProcure Scraper for California RFPs

### How it works

The Apify scraper (`fortuitous_pirate/caleprocure-scraper`) is a hosted actor that scrapes the CaleProcure website. Your edge function will call the Apify API to run the actor, wait for results, then normalize them into the existing opportunity format.

### What I need from you

1. **Apify API Token** -- You need an Apify account with an API token. Get it from [Apify Console → Settings → Integrations](https://console.apify.com/account/integrations). I will securely store it as `APIFY_API_TOKEN` in your Supabase edge function secrets.

2. **Billing awareness** -- The scraper costs ~$0.002 per result ($2 per 1,000 results). Each search your users run will trigger an Apify actor run. With a default limit of 25 results per page, that's ~$0.05 per search.

That's it. No other keys or accounts are needed.

### What I will build

**Replace the current `fetchCalifornia` function** in `supabase/functions/search-opportunities/index.ts`:

1. Call Apify's REST API to start a synchronous actor run:
   - `POST https://api.apify.com/v2/acts/fortuitous_pirate~caleprocure-scraper/run-sync-get-dataset-items`
   - Pass input: `keyword`, `startDate`/`endDate` (mm/dd/yyyy format), `departments`, `status: "Open"`, `limit: 25`
   - Use `APIFY_API_TOKEN` as the `?token=` query param

2. Normalize the Apify output (fields like `eventId`, `eventName`, `department`, `endDate`, `type`, `status`) to the existing `NormalizedOpportunity` interface

3. Keep the existing 15s timeout and provider status tracking

4. Remove the current `CALIFORNIA_API_KEY` dependency since Apify replaces the direct CaleProcure API

### Files to update
- `supabase/functions/search-opportunities/index.ts` -- replace `fetchCalifornia` internals
- No frontend changes needed -- California is already in the source dropdown

