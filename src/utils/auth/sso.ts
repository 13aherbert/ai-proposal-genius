import { supabase } from "@/integrations/supabase/client";

export interface SSODomainInfo {
  ssoEnabled: boolean;
  providerType?: "supabase_native" | "oidc" | "saml" | string;
  providerName?: string;
  organizationName?: string;
  organizationId?: string;
  ssoRequired?: boolean;
  ssoAutoRedirect?: boolean;
  passwordFallbackAllowed?: boolean;
  domain?: string;
  initiateUrl?: string | null;
}

/**
 * Check whether an email domain is governed by an organization SSO config.
 * Returns minimal info — never use this for authorization decisions.
 */
export async function lookupSSOForEmail(email: string): Promise<SSODomainInfo | null> {
  if (!email || !email.includes("@")) return null;
  try {
    const { data, error } = await supabase.functions.invoke("check-sso-domain", {
      body: { email },
    });
    if (error) return null;
    return data as SSODomainInfo;
  } catch {
    return null;
  }
}

/**
 * Initiate SSO for an email — handles all three provider types.
 * Returns true if a redirect/initiation was started; caller should not continue
 * with password sign-in in that case.
 */
export async function initiateSSO(info: SSODomainInfo, email: string): Promise<boolean> {
  if (!info.ssoEnabled) return false;

  if (info.providerType === "supabase_native" && info.domain) {
    const { data, error } = await supabase.auth.signInWithSSO({ domain: info.domain });
    if (error) {
      console.error("signInWithSSO failed", error);
      return false;
    }
    if (data?.url) {
      window.location.href = data.url;
      return true;
    }
    return false;
  }

  if (info.initiateUrl) {
    window.location.href = info.initiateUrl;
    return true;
  }

  return false;
}
