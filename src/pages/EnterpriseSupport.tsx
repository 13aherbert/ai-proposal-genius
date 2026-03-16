import { useSEO } from "@/hooks/use-seo";
import { useCSMContact } from "@/hooks/use-csm-contact";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, Phone, Calendar, Clock, Shield, BookOpen, 
  Video, MessageSquare, ArrowRight, Crown
} from "lucide-react";
import { Link } from "react-router-dom";

const slaItems = [
  { channel: "Email", responseTime: "4 hours", icon: Mail },
  { channel: "Phone", responseTime: "1 hour", icon: Phone },
  { channel: "Urgent / Critical", responseTime: "30 minutes", icon: Clock },
];

const resources = [
  { title: "Enterprise Onboarding Guide", description: "Step-by-step setup for your team", href: "/docs" },
  { title: "Best Practices Webinar", description: "Learn tips from top-performing teams", href: "#" },
  { title: "Quarterly Business Review", description: "Schedule your next QBR session", href: "#" },
  { title: "API Documentation", description: "Integrate OptiRFP into your workflows", href: "/api-docs" },
];

export default function EnterpriseSupport() {
  useSEO({ title: "Enterprise Support | OptiRFP", description: "Priority support for Enterprise customers." });
  const { csm, isEnterprise, loading } = useCSMContact();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isEnterprise) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <Crown className="h-12 w-12 text-amber-500 mx-auto" />
        <h1 className="text-3xl font-bold text-foreground">Enterprise Priority Support</h1>
        <p className="text-muted-foreground text-lg">
          Dedicated CSM, priority SLA, and direct access to our team are available on the Enterprise plan.
        </p>
        <Button asChild size="lg">
          <Link to="/subscription">Upgrade to Enterprise <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400">
            <Shield className="h-3 w-3 mr-1" />
            Enterprise
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Priority Support</h1>
        <p className="text-muted-foreground mt-1">
          Your dedicated support channels with guaranteed response times.
        </p>
      </div>

      {/* CSM Contact Card */}
      <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-600" />
            Your Customer Success Manager
          </CardTitle>
          <CardDescription>Direct line to your dedicated CSM</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Crown className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-lg text-foreground">{csm.name}</p>
                <p className="text-sm text-muted-foreground">{csm.email}</p>
                {csm.phone && (
                  <p className="text-sm text-muted-foreground">{csm.phone}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 sm:ml-auto">
              <Button asChild>
                <a href={`mailto:${csm.email}`}>
                  <Mail className="mr-2 h-4 w-4" /> Email CSM
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={csm.calendlyUrl} target="_blank" rel="noopener noreferrer">
                  <Calendar className="mr-2 h-4 w-4" /> Book a Call
                </a>
              </Button>
              {csm.phone && (
                <Button variant="outline" asChild>
                  <a href={`tel:${csm.phone}`}>
                    <Phone className="mr-2 h-4 w-4" /> Call
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SLA Response Times */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Response Time SLA</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {slaItems.map((item) => (
            <Card key={item.channel}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.channel}</p>
                  <p className="text-sm text-muted-foreground">Within {item.responseTime}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resources.map((r) => (
            <Card key={r.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{r.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={r.href}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
