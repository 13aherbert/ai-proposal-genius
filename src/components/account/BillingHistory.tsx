
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Download, ExternalLink, FileText, Loader2, Receipt, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  currency: string;
  status: string | null;
  created: number;
  periodStart: number;
  periodEnd: number;
  invoicePdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  description: string;
}

/**
 * BillingHistory - Displays invoice history from Stripe
 * Shows date, amount, status with download/view options
 */
export function BillingHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingHistory = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('get-billing-history');

      if (fnError) {
        throw fnError;
      }

      setInvoices(data?.invoices || []);
      
      if (showRefreshToast) {
        toast.success("Billing history refreshed");
      }
    } catch (err) {
      console.error('Error fetching billing history:', err);
      // Gracefully handle errors for free-tier users (no Stripe customer)
      // Show empty state instead of error
      setInvoices([]);
      setError(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-600">Paid</Badge>;
      case 'open':
        return <Badge variant="secondary">Pending</Badge>;
      case 'void':
        return <Badge variant="outline">Void</Badge>;
      case 'uncollectible':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleOpenBillingPortal = async () => {
    try {
      toast.loading("Opening billing portal...");
      
      const { data, error } = await supabase.functions.invoke('renew-subscription', {
        body: {}
      });

      toast.dismiss();

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening billing portal:', err);
      toast.error("Failed to open billing portal");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>View and download your past invoices</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchBillingHistory(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenBillingPortal}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => fetchBillingHistory()}
            >
              Try Again
            </Button>
          </div>
        )}

        {!error && invoices.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No billing history yet</p>
            <p className="text-sm mt-1">Your invoices will appear here once you have a paid subscription.</p>
          </div>
        )}

        {!error && invoices.length > 0 && (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div 
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex h-10 w-10 items-center justify-center bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{invoice.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(invoice.created), 'MMM d, yyyy')}
                      {invoice.number && ` • ${invoice.number}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(invoice.amount, invoice.currency)}</p>
                    {getStatusBadge(invoice.status)}
                  </div>
                  {invoice.invoicePdfUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a 
                        href={invoice.invoicePdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
