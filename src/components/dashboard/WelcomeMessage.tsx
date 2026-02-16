import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";

export function WelcomeMessage() {
  const { session } = useAuth();
  const { plan } = useSubscriptionFeatures();
  const isSubscriptionActive = plan && plan !== 'trial';

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
        Welcome{session?.user?.user_metadata?.first_name ? `, ${session.user.user_metadata.first_name}` : ''}
      </h1>
      <p className="text-muted-foreground mt-0.5 text-sm">
        {isSubscriptionActive ? (
          <>
            You're on the <Badge variant="outline" className="ml-1 font-semibold text-xs">{plan}</Badge> plan
          </>
        ) : (
          "Start creating AI-powered RFP responses"
        )}
      </p>
    </div>
  );
}
