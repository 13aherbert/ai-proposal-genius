// Verify an organization's custom email domain by looking up a TXT record.
// Caller must be owner/admin of the organization. The expected TXT record is:
//   _optirfp-verification.<domain>  ->  optirfp-verify=<token>
import { adminClient, corsHeaders, jsonResponse, requireOrgAdmin, checkRateLimit, getClientIp } from "../_shared/sso.ts";

interface DohAnswer {
  name: string;
  type: number;
  data: string;
}

async function lookupTxt(domain: string): Promise<string[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=_optirfp-verification.${encodeURIComponent(domain)}&type=TXT`;
  const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
  if (!res.ok) throw new Error(`DNS lookup failed: ${res.status}`);
  const json = await res.json() as { Answer?: DohAnswer[] };
  return (json.Answer || [])
    .filter((a) => a.type === 16)
    .map((a) => a.data.replace(/^"|"$/g, '').replace(/""/g, ''));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { domainId } = await req.json();
    if (!domainId || typeof domainId !== 'string') {
      return jsonResponse({ error: 'domainId required' }, 400);
    }

    const client = adminClient();

    const ipOk = await checkRateLimit(client, getClientIp(req), 'verify-organization-domain', 10, 60);
    if (!ipOk) return jsonResponse({ error: 'Too many attempts' }, 429);

    const { data: domainRow, error: domainErr } = await client
      .from('organization_domains')
      .select('id, organization_id, domain, verification_token, is_verified')
      .eq('id', domainId)
      .single();
    if (domainErr || !domainRow) return jsonResponse({ error: 'Domain not found' }, 404);

    const guard = await requireOrgAdmin(req, client, domainRow.organization_id);
    if (guard instanceof Response) return guard;

    if (domainRow.is_verified) {
      return jsonResponse({ verified: true, alreadyVerified: true });
    }

    const expected = `optirfp-verify=${domainRow.verification_token}`;
    let records: string[] = [];
    try {
      records = await lookupTxt(domainRow.domain);
    } catch (err) {
      console.error('DNS lookup failed', err);
      return jsonResponse({ verified: false, error: 'DNS lookup failed. Try again in a few minutes.' }, 200);
    }

    const matched = records.some((r) => r.trim() === expected);
    if (!matched) {
      return jsonResponse({
        verified: false,
        expected,
        host: `_optirfp-verification.${domainRow.domain}`,
        found: records,
      });
    }

    await client
      .from('organization_domains')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', domainRow.id);

    await client.rpc('log_security_event', {
      event_type_param: 'sso_domain_verified',
      details_param: { organization_id: domainRow.organization_id, domain: domainRow.domain },
    });

    return jsonResponse({ verified: true });
  } catch (err) {
    console.error('verify-organization-domain error', err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
