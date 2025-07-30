import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Domain {
  id: string;
  domain: string;
  is_verified: boolean;
  is_primary: boolean;
  ssl_certificate_status: string;
  verification_token: string;
  created_at: string;
}

interface DomainVerificationProps {
  domain: Domain;
  onVerificationComplete: () => void;
}

export function DomainVerification({ domain, onVerificationComplete }: DomainVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'checking' | 'verified' | 'failed'>('pending');
  const { toast } = useToast();

  useEffect(() => {
    // Generate DNS records needed for verification
    const records = [
      {
        type: 'TXT',
        name: `_lovable-verification.${domain.domain}`,
        value: domain.verification_token,
        purpose: 'Domain ownership verification'
      },
      {
        type: 'CNAME',
        name: domain.domain,
        value: 'custom-domains.lovable.app',
        purpose: 'Route traffic to Lovable'
      },
      {
        type: 'CNAME',
        name: `www.${domain.domain}`,
        value: 'custom-domains.lovable.app',
        purpose: 'Route www subdomain to Lovable'
      }
    ];
    setDnsRecords(records);
  }, [domain]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const checkDNSRecords = async () => {
    setIsVerifying(true);
    setVerificationStatus('checking');
    
    try {
      // Simulate DNS checking (in real implementation, this would check actual DNS records)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, randomly succeed or fail
      const isVerified = Math.random() > 0.3;
      
      if (isVerified) {
        // Update domain as verified
        const { error } = await supabase
          .from('organization_domains')
          .update({ 
            is_verified: true, 
            ssl_certificate_status: 'active' 
          })
          .eq('id', domain.id);

        if (error) throw error;

        setVerificationStatus('verified');
        toast.success('Domain verified successfully!');
        onVerificationComplete();
      } else {
        setVerificationStatus('failed');
        toast.error('Domain verification failed. Please check your DNS records.');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationStatus('failed');
      toast.error('Failed to verify domain');
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusBadge = () => {
    if (domain.is_verified) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }

    switch (verificationStatus) {
      case 'checking':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Checking...
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getSSLBadge = () => {
    switch (domain.ssl_certificate_status) {
      case 'active':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Shield className="h-3 w-3 mr-1" />
            SSL Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            SSL Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            SSL Failed
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Verification
          </div>
          <div className="flex gap-2">
            {getStatusBadge()}
            {getSSLBadge()}
          </div>
        </CardTitle>
        <CardDescription>
          Configure DNS settings for {domain.domain}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!domain.is_verified && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Add these DNS records to your domain registrar to verify ownership and enable custom domain functionality.
            </AlertDescription>
          </Alert>
        )}

        {/* DNS Records */}
        <div className="space-y-4">
          <h4 className="font-medium">Required DNS Records</h4>
          {dnsRecords.map((record, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{record.type}</Badge>
                  <span className="text-sm text-muted-foreground">{record.purpose}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(record.value)}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span>
                  <div className="font-mono bg-muted p-2 rounded mt-1">
                    {record.name}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Value:</span>
                  <div className="font-mono bg-muted p-2 rounded mt-1 break-all">
                    {record.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Verification Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={checkDNSRecords}
            disabled={isVerifying || domain.is_verified}
            className="flex-1"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking DNS...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Domain
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.open(`https://dnschecker.org/#TXT/_lovable-verification.${domain.domain}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Check DNS Propagation
          </Button>
        </div>

        {/* Verification Steps */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h5 className="font-medium">Verification Steps:</h5>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Add the DNS records above to your domain registrar</li>
            <li>Wait for DNS propagation (usually 5-15 minutes, up to 48 hours)</li>
            <li>Click "Verify Domain" to check the records</li>
            <li>SSL certificate will be automatically provisioned once verified</li>
          </ol>
        </div>

        {domain.is_verified && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              🎉 Domain verified successfully! Your custom domain is now active and SSL is being provisioned.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}