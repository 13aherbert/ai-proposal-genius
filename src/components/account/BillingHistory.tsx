
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/utils/network/retry";
import { format } from "date-fns";
import { AlertOctagon, Download, ExternalLink, FileText, Receipt, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

type FetchState = "loading" | "success" | "error" | "empty";

export function BillingHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchBillingHistory = async (showRefreshToast = false) => {
    if (showRefreshToast) {
      setIsRefreshing(true);
    } else {
      setFetchState("loading");
    }

    try {
      const result = await withRetry(async () => {
        const { data, error } = await supabase.functions.invoke('get-billing-history');
        if (error) throw error;
        return data;
      }, 3, 1000, 10000);

      const invoiceList: Invoice[] = result?.invoices || [];
      if (invoiceList.length === 0) {
        setInvoices([]);
        setFetchState("empty");
      } else {
        setInvoices(invoiceList);
        setFetchState("success");
      }

      if (showRefreshToast) toast.success("Billing history refreshed");
    } catch (err) {
      console.error("Failed to fetch billing history:", err);
      setInvoices([]);
      setFetchState("error");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const handleOpenBillingPortal = async () => {
    try {
      toast.loading("Opening billing portal...");
      const { data, error } = await supabase.functions.invoke('renew-subscription', { body: {} });
      toast.dismiss();
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err) {
      console.error('Error opening billing portal:', err);
      toast.error("Failed to open billing portal");
    }
  };

  // --- LOADING STATE ---
  if (fetchState === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg h-[60px]">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- ERROR STATE ---
  if (fetchState === "error") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
            <AlertOctagon className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-1">Unable to load billing history</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This is usually a temporary connection issue. Your billing is secure.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => fetchBillingHistory()}>Try Again</Button>
              <Button variant="outline" asChild>
                <a href="mailto:support@optirfp.ai">Contact Support</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- EMPTY STATE ---
  if (fetchState === "empty") {
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-1">No billing history yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your invoices and payment history will appear here after your first charge.
            </p>
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- SUCCESS STATE ---
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
            <Button variant="ghost" size="sm" onClick={() => fetchBillingHistory(true)} disabled={isRefreshing}>
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
                  <Button variant="ghost" size="icon" asChild>
                    <a href={invoice.invoicePdfUrl} target="_blank" rel="noopener noreferrer" title="Download PDF">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
