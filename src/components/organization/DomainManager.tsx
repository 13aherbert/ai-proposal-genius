import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Globe, Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCurrentOrganization } from '@/hooks/use-current-organization';

interface Domain {
  id: string;
  domain: string;
  is_verified: boolean;
  is_primary: boolean;
  ssl_certificate_status: string;
  verification_token: string;
  created_at: string;
}

export function DomainManager() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingDomain, setAddingDomain] = useState(false);
  const { organization } = useCurrentOrganization();

  useEffect(() => {
    if (organization?.id) {
      fetchDomains();
    }
  }, [organization?.id]);

  const fetchDomains = async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_domains')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error: any) {
      console.error('Error fetching domains:', error);
      toast.error('Failed to fetch domains');
    } finally {
      setLoading(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim() || !organization?.id) return;

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain)) {
      toast.error('Please enter a valid domain name');
      return;
    }

    setAddingDomain(true);
    try {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const verificationToken = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { error } = await supabase
        .from('organization_domains')
        .insert({
          organization_id: organization.id,
          domain: newDomain.toLowerCase(),
          verification_token: verificationToken,
          is_verified: false,
          ssl_certificate_status: 'pending'
        });

      if (error) throw error;

      toast.success('Domain added! Please verify ownership.');
      setNewDomain('');
      fetchDomains();
    } catch (error: any) {
      console.error('Error adding domain:', error);
      toast.error(error.message || 'Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const verifyDomain = async (domain: Domain) => {
    try {
      // Perform real DNS TXT record verification via DNS-over-HTTPS
      const dnsResponse = await fetch(
        `https://dns.google/resolve?name=_lovable-verification.${domain.domain}&type=TXT`
      );
      const dnsData = await dnsResponse.json();
      
      const txtRecords = dnsData.Answer?.filter((r: any) => r.type === 16) || [];
      const isVerified = txtRecords.some((record: any) => 
        record.data?.replace(/"/g, '').includes(domain.verification_token)
      );

      if (!isVerified) {
        toast.error('DNS verification failed. Please ensure the TXT record is configured correctly and DNS has propagated.');
        return;
      }

      const { error } = await supabase
        .from('organization_domains')
        .update({ is_verified: true, ssl_certificate_status: 'active' })
        .eq('id', domain.id);

      if (error) throw error;

      toast.success('Domain verified successfully!');
      fetchDomains();
    } catch (error: any) {
      console.error('Error verifying domain:', error);
      toast.error('Failed to verify domain');
    }
  };

  const setPrimaryDomain = async (domainId: string) => {
    if (!organization?.id) return;

    try {
      // First, unset all primary domains
      await supabase
        .from('organization_domains')
        .update({ is_primary: false })
        .eq('organization_id', organization.id);

      // Then set the selected domain as primary
      const { error } = await supabase
        .from('organization_domains')
        .update({ is_primary: true })
        .eq('id', domainId);

      if (error) throw error;

      toast.success('Primary domain updated!');
      fetchDomains();
    } catch (error: any) {
      console.error('Error setting primary domain:', error);
      toast.error('Failed to set primary domain');
    }
  };

  const getStatusBadge = (domain: Domain) => {
    if (domain.is_verified) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getSSLBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">SSL Active</Badge>;
      case 'pending':
        return <Badge variant="outline">SSL Pending</Badge>;
      default:
        return <Badge variant="destructive">SSL Failed</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Custom Domains
          </CardTitle>
          <CardDescription>
            Configure custom domains for your white-label application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="yourdomain.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addDomain()}
            />
            <Button onClick={addDomain} disabled={addingDomain || !newDomain.trim()}>
              {addingDomain ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Domain
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              After adding a domain, you'll need to configure DNS records at your domain registrar.
              Point your domain to <code className="bg-muted px-1 rounded">185.158.133.1</code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {domains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configured Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{domain.domain}</span>
                      {domain.is_primary && (
                        <Badge variant="outline">Primary</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(domain)}
                      {getSSLBadge(domain.ssl_certificate_status)}
                    </div>
                    {!domain.is_verified && (
                      <p className="text-xs text-muted-foreground">
                        Verification token: <code className="bg-muted px-1 rounded">{domain.verification_token}</code>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!domain.is_verified && (
                      <Button size="sm" variant="outline" onClick={() => verifyDomain(domain)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                    )}
                    {domain.is_verified && !domain.is_primary && (
                      <Button size="sm" onClick={() => setPrimaryDomain(domain.id)}>
                        Set Primary
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}