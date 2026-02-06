

## Fix: Knowledge Base AI Content Generation ("Failed to Generate")

### Root Cause

The edge function logs clearly show the error:

```
Claude API error: {"type":"error","error":{"type":"not_found_error","message":"model: claude-3-opus-20240229"}}
```

The `generate-knowledge-content` Edge Function is calling the Anthropic API with `claude-3-opus-20240229`, a model that has been retired by Anthropic. Every request returns a **404 Not Found** error, which the frontend surfaces as "Failed to Generate."

Additionally, the function is **not registered** in `supabase/config.toml`, which could cause deployment issues.

### Changes Required

**1. Update the Claude model (critical fix)**

File: `supabase/functions/generate-knowledge-content/index.ts`

- Replace the retired model `claude-3-opus-20240229` with `claude-sonnet-4-5-20250929` (the same model used successfully by the `generate-section-content` function)
- This is a one-line change on line 44

**2. Register the function in config.toml**

File: `supabase/config.toml`

- Add a `[[functions]]` entry for `generate-knowledge-content` with `verify_jwt = false` (so the function can handle auth internally, consistent with other AI generation functions)

**3. Redeploy the Edge Function**

- Deploy the updated `generate-knowledge-content` function to apply the model change

### Technical Details

The working `generate-section-content` function already uses current Anthropic models:
- `claude-sonnet-4-5-20250929` for moderate/high complexity (good balance of quality and cost)
- `claude-haiku-4-5-20251001` for low complexity (fast and cost-effective)

For knowledge base content generation, `claude-sonnet-4-5-20250929` is the right choice -- it provides high-quality output at a lower cost than the old Opus model.

### Verification Steps

1. Deploy the updated function
2. Navigate to the Knowledge Base page
3. Click "Add New Entry" and select "Generate with AI"
4. Enter a topic and industry, then click "Generate Content"
5. Confirm the content generates successfully without errors

