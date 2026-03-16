import { useCSMContact } from "@/hooks/use-csm-contact";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Mail, Calendar } from "lucide-react";

export function CSMContactWidget() {
  const { csm, isEnterprise } = useCSMContact();

  if (!isEnterprise) return null;

  return (
    <Card className="border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-foreground">Your CSM</span>
        </div>
        <p className="text-sm font-medium text-foreground">{csm.name}</p>
        <p className="text-xs text-muted-foreground">Questions? We're here to help.</p>
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="outline" className="w-full justify-start" asChild>
            <a href={`mailto:${csm.email}`}>
              <Mail className="mr-2 h-3.5 w-3.5" /> {csm.email}
            </a>
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start" asChild>
            <a href={csm.calendlyUrl} target="_blank" rel="noopener noreferrer">
              <Calendar className="mr-2 h-3.5 w-3.5" /> Schedule Call
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
