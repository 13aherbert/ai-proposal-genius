
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SubscriptionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-[180px]" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-[100px]" />
            <Skeleton className="h-5 w-[80px]" />
          </div>
          <Skeleton className="h-8 w-full" />
          <div className="pt-4">
            <Skeleton className="h-5 w-[140px] mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
