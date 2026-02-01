
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { Loader2 } from "lucide-react";

interface UsageStatsProps {
  projectLimit: number;
  planType: string;
}

/**
 * UsageStats - Displays plan utilization
 * Shows project usage with progress bar
 */
export function UsageStats({ projectLimit, planType }: UsageStatsProps) {
  const { session } = useAuth();
  const { organization } = useCurrentOrganization();
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjectCount = async () => {
      if (!session?.user?.id || !organization?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { count, error } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id);

        if (error) {
          console.error('Error fetching project count:', error);
        } else {
          setProjectCount(count || 0);
        }
      } catch (err) {
        console.error('Error fetching project count:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectCount();
  }, [session?.user?.id, organization?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading usage...</span>
      </div>
    );
  }

  const count = projectCount ?? 0;
  const percentage = projectLimit > 0 ? Math.min((count / projectLimit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = count >= projectLimit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Projects Used</span>
        <span className={`font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
          {count} / {projectLimit}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
      />
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          You're approaching your project limit
        </p>
      )}
      {isAtLimit && (
        <p className="text-xs text-destructive">
          You've reached your project limit. Upgrade to create more projects.
        </p>
      )}
    </div>
  );
}
