## GSC setup — current state

The `OptiRFP GSC` connector (Google account `optirfp@gmail.com`) is linked to this project with the right scopes. Calling the GSC API returns two properties on that account:

- `sc-domain:optirfp.ai` — **unverified**
- `https://optirfp.ai/` — **unverified**

The Lovable subdomain (`ai-proposal-genius.lovable.app`) is **not** added to GSC at all.

Good news: `https://optirfp.ai/` is already live, and the verification meta tag for it is already in the served HTML:

```
<meta name="google-site-verification" content="8c5AICeD0FddzJPwep6N_0fhJBuQGzm6-Kv3TxmUA4c" />
```

So verification can be completed right now via the API — no publish needed for that step.

## Plan

You chose **optirfp.ai** as the primary GSC property. I'll align everything to it and finish verification.

### 1. Clean up `index.html`
- Remove the stale `ai-proposal-genius.lovable.app` verification tag (`EDVlpjkK_RDMRCTCZ0cELKHPjxtsw27lZH3SapgOsAo`) — it points to a property you don't intend to verify.
- Keep the `optirfp.ai` verification tag.
- Leave `og:url` as `https://optirfp.ai` (already correct).

### 2. Re-point sitemap + robots to optirfp.ai
The SEO scanner currently flagged these because they pointed at the lovable.app subdomain. Since optirfp.ai is the canonical:
- `public/robots.txt` → `Sitemap: https://optirfp.ai/sitemap.xml`
- `public/sitemap.xml` → rewrite every `<loc>` from `https://ai-proposal-genius.lovable.app/...` to `https://optirfp.ai/...`

### 3. Call GSC verification (no publish needed)
Run the Site Verification API against the live `https://optirfp.ai/` (it already serves the tag):

```
POST /siteVerification/v1/webResource?verificationMethod=META
{ "site": { "identifier": "https://optirfp.ai/", "type": "SITE" } }
```

### 4. Add the verified property in Search Console
```
PUT /webmasters/v3/sites/https%3A%2F%2Foptirfp.ai%2F
```

### 5. Submit the sitemap
```
PUT /webmasters/v3/sites/https%3A%2F%2Foptirfp.ai%2F/sitemaps/https%3A%2F%2Foptirfp.ai%2Fsitemap.xml
```

### 6. Mark SEO findings fixed
Update `gsc:gsc` (and re-confirm `http:robots`, `http:sitemap`) as fixed.

## Notes / trade-offs

- The `sc-domain:optirfp.ai` property in your GSC account requires **DNS TXT** verification, which the META flow can't satisfy. If you want domain-wide coverage (all subdomains, both http/https) I'd need a DNS record added at your registrar — say the word and I'll generate the token and give you the exact TXT record. Otherwise the URL-prefix property `https://optirfp.ai/` is fully sufficient for indexing data.
- After step 5, GSC takes a few hours to a couple of days to populate impressions/clicks data.
- Publishing the cleanup edits in steps 1–2 is not required for verification, but recommended so the served HTML stays clean.
