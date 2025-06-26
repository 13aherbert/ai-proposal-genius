
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Globe, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface Domain {
  id: string;
  domain: string;
  status: 'active' | 'pending' | 'failed' | 'verifying';
  partnerId: string;
  partnerName: string;
  sslStatus: 'active' | 'pending' | 'failed';
  createdAt: string;
  verificationRecord?: string;
}

export function DomainManager() {
  const [domains, setDomains] = useState<Domain[]>([
    {
      id: '1',
      domain: 'proposals.acme.com',
      status: 'active',
      partnerId: '1',
      partnerName: 'Acme Solutions',
      sslStatus: 'active',
      createdAt: '2024-01-15',
      verificationRecord: 'proposals-acme-verify-abc123'
    },
    {
      id: '2',
      domain: 'rfp.techstart.io',
      status: 'pending',
      partnerId: '2',
      partnerName: 'TechStart Inc',
      sslStatus: 'pending',
      createdAt: '2024-01-20',
      verificationRecord: 'rfp-techstart-verify-def456'
    }
  ]);

  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'verifying':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: "default" as const, label: "Active" },
      pending: { variant: "secondary" as const, label: "Pending" },
      verifying: { variant: "secondary" as const, label: "Verifying" },
      failed: { variant: "destructive" as const, label: "Failed" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error("Please enter a domain name");
      return;
    }

    setIsAdding(true);
    try {
      // TODO: Implement API call to add domain
      const newDomainObj: Domain = {
        id: Date.now().toString(),
        domain: newDomain.trim(),
        status: 'pending',
        partnerId: '1', // This would come from a selection
        partnerName: 'Selected Partner',
        sslStatus: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
        verificationRecord: `verify-${Date.now()}`
      };

      setDomains(prev => [...prev, newDomainObj]);
      setNewDomain('');
      toast.success("Domain added successfully! Please verify DNS settings.");
    } catch (error) {
      toast.error("Failed to add domain");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteDomain = (domainId: string) => {
    setDomains(prev => prev.filter(d => d.id !== domainId));
    toast.success("Domain removed successfully");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleVerifyDomain = (domainId: string) => {
    // TODO: Implement domain verification
    setDomains(prev => 
      prev.map(d => 
        d.id === domainId 
          ? { ...d, status: 'verifying' as const }
          : d
      )
    );
    toast.info("Domain verification started...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Domain Management</h2>
          <p className="text-muted-foreground">
            Manage custom domains for your white label partners
          </p>
        </div>
      </div>

      {/* Add New Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Domain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="newDomain">Domain Name</Label>
              <Input
                id="newDomain"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="proposals.yourcompany.com"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAddDomain} 
                disabled={isAdding}
              >
                {isAdding ? "Adding..." : "Add Domain"}
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              After adding a domain, you'll need to configure DNS settings and verify ownership 
              before it becomes active.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* DNS Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Configuration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Required DNS Records:</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between items-center">
                <span>Type: CNAME</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard("CNAME")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Name: @ (or your subdomain)</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard("@")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Value: app.proposalpro.com</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard("app.proposalpro.com")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain List */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Domains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {domains.map((domain) => (
              <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getStatusIcon(domain.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{domain.domain}</h4>
                      {getStatusBadge(domain.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Partner: {domain.partnerName} | Added: {domain.createdAt}
                    </p>
                    {domain.status === 'pending' && domain.verificationRecord && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Verification: {domain.verificationRecord}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {domain.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {domain.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyDomain(domain.id)}
                    >
                      Verify
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDomain(domain.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {domains.length === 0 && (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No custom domains configured yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
