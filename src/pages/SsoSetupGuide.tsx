import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Globe, KeyRound, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

const REDIRECT_URI = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sso-oidc-callback`;

export default function SsoSetupGuide() {
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <SEO
        title="SSO Setup Guide — OptiRFP"
        description="Configure SAML or OIDC single sign-on for your organization in OptiRFP."
        canonical="https://optirfp.ai/docs/sso-setup"
      />
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" /> SSO setup guide
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure SAML or OIDC single sign-on for your organization. For configuration UI, go to{' '}
          <Link to="/organization" className="text-primary underline">Organization → SSO</Link>.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Choose your path</AlertTitle>
        <AlertDescription className="text-sm">
          <strong>SAML (Path A)</strong> uses Supabase native SAML — best for Okta, Azure AD, OneLogin
          when your Supabase project is on Pro plan or higher.<br />
          <strong>OIDC (Path B)</strong> works with any OIDC-compliant IdP (Auth0, Keycloak, Google,
          custom) and runs on every plan.
        </AlertDescription>
      </Alert>

      {/* Step 1 — domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Step 1 — Verify your domain</CardTitle>
          <CardDescription>SSO will only accept logins from email addresses on a verified domain.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open <Link to="/organization" className="text-primary underline">Organization → SSO</Link> and add your email domain (e.g. <code>acme.com</code>).</li>
            <li>Copy the generated <code>_optirfp-verification</code> TXT record.</li>
            <li>Add the TXT record at your DNS provider. Propagation usually takes a few minutes.</li>
            <li>Click <strong>Verify</strong>. Once verified, the domain shows a green badge.</li>
          </ol>
        </CardContent>
      </Card>

      {/* Step 2 — provider */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2 — Configure your identity provider</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="saml">
            <TabsList>
              <TabsTrigger value="saml">SAML (Path A)</TabsTrigger>
              <TabsTrigger value="oidc">OIDC (Path B)</TabsTrigger>
            </TabsList>

            <TabsContent value="saml" className="space-y-3 pt-4 text-sm">
              <Badge variant="outline">Requires Supabase Pro plan</Badge>
              <ol className="list-decimal pl-5 space-y-1">
                <li>In your IdP, create a new SAML 2.0 application.</li>
                <li>From the SSO panel's "Add provider → SAML" wizard, copy the <strong>Metadata URL</strong> field hint and paste your IdP's metadata URL (or the raw XML).</li>
                <li>Click <strong>Register provider</strong>. We'll return the <strong>ACS URL</strong> and <strong>Entity ID</strong>.</li>
                <li>Paste those two values back into your IdP's SAML application settings.</li>
                <li>Map these SAML attributes:
                  <ul className="list-disc pl-5 mt-1">
                    <li><code>email</code> → user email (required)</li>
                    <li><code>first_name</code> → given name</li>
                    <li><code>last_name</code> → family name</li>
                  </ul>
                </li>
                <li>Assign your test user to the IdP application and try a login from <Link to="/" className="text-primary underline">your sign-in page</Link>.</li>
              </ol>
            </TabsContent>

            <TabsContent value="oidc" className="space-y-3 pt-4 text-sm">
              <ol className="list-decimal pl-5 space-y-1">
                <li>In your IdP, create a new OIDC / OAuth2 web application.</li>
                <li>Register this redirect URI:
                  <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">{REDIRECT_URI}</pre>
                </li>
                <li>Copy the IdP's <strong>discovery URL</strong> (ends in <code>/.well-known/openid-configuration</code>) and <strong>client ID</strong>.</li>
                <li>In <Link to="/organization" className="text-primary underline">Organization → SSO → Add provider → OIDC</Link>, paste those values and save.</li>
                <li>If your IdP issued a <strong>client secret</strong>, click the <KeyRound className="inline h-3 w-3" /> button on the provider row and paste it. The secret is encrypted before storage.</li>
                <li>Required ID-token claims: <code>email</code>, <code>email_verified</code> (must be true), and one of <code>given_name</code>/<code>name</code>.</li>
              </ol>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Step 3 — enforcement */}
      <Card>
        <CardHeader>
          <CardTitle>Step 3 — Enforcement options</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>SSO required</strong> — blocks password sign-ins for verified-domain emails.</li>
            <li><strong>Auto-redirect</strong> — sends users straight to the IdP after they enter their email.</li>
            <li><strong>Allow password fallback</strong> — leave on while you're still rolling SSO out.</li>
            <li><strong>JIT provisioning</strong> — first-time SSO logins create a user and add them to the org (subject to seat limits).</li>
          </ul>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <dl className="space-y-2">
            <div><dt className="font-medium">"Email domain not authorized"</dt><dd className="text-muted-foreground">The domain isn't verified yet, or the user's email is on a different domain than the one you verified.</dd></div>
            <div><dt className="font-medium">"Token exchange failed"</dt><dd className="text-muted-foreground">Wrong client ID, wrong client secret, or the redirect URI registered at the IdP doesn't match exactly.</dd></div>
            <div><dt className="font-medium">"Nonce mismatch"</dt><dd className="text-muted-foreground">The handoff state expired (more than 5 minutes between init and callback). Try again.</dd></div>
            <div><dt className="font-medium">"Too many attempts"</dt><dd className="text-muted-foreground">Rate-limit hit. Wait a minute before retrying.</dd></div>
            <div><dt className="font-medium">SAML registration fails with 403</dt><dd className="text-muted-foreground">The <code>SB_MGMT_API_TOKEN</code> isn't set, doesn't have access to this Supabase project, or your Supabase plan doesn't include SAML.</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per-IdP quickstarts</CardTitle>
        </CardHeader>
        <CardContent className="text-sm grid sm:grid-cols-2 gap-2">
          {[
            ['Okta (SAML)', 'https://help.okta.com/oie/en-us/Content/Topics/Apps/Apps_App_Integration_Wizard_SAML.htm'],
            ['Azure AD (SAML)', 'https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/add-application-portal-setup-sso'],
            ['Google Workspace (SAML)', 'https://support.google.com/a/answer/6087519'],
            ['Auth0 (OIDC)', 'https://auth0.com/docs/get-started/applications/application-settings'],
            ['Keycloak (OIDC)', 'https://www.keycloak.org/docs/latest/server_admin/#_oidc_clients'],
          ].map(([name, href]) => (
            <a key={name} href={href} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-2 border rounded hover:bg-muted">
              <span>{name}</span><ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
