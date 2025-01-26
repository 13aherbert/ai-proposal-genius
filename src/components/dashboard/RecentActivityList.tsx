import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FolderOpen } from "lucide-react";
import { format } from "date-fns";

export interface RecentActivity {
  type: 'project' | 'knowledge';
  title: string;
  date: string;
  id: string;
}

interface RecentActivityListProps {
  activities: RecentActivity[];
  isLoading: boolean;
  onActivityClick: (activity: RecentActivity) => void;
}

export const RecentActivityList = ({ activities, isLoading, onActivityClick }: RecentActivityListProps) => {
  if (isLoading) {
    return <p className="text-brand-gray text-center">Loading recent activity...</p>;
  }

  if (activities.length === 0) {
    return <p className="text-brand-gray text-center">No recent activity to display</p>;
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={`${activity.type}-${activity.id}`}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-brand-silver/10 cursor-pointer transition-colors"
          onClick={() => onActivityClick(activity)}
        >
          <div className="flex items-center gap-3">
            {activity.type === 'project' ? (
              <FolderOpen className="h-4 w-4 text-brand-green" />
            ) : (
              <BookOpen className="h-4 w-4 text-brand-green" />
            )}
            <div>
              <p className="font-medium text-brand-gray">{activity.title}</p>
              <p className="text-sm text-brand-gray/70">
                {format(new Date(activity.date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-brand-green hover:text-brand-green/80 hover:bg-brand-green/10"
          >
            View
          </Button>
        </div>
      ))}
    </div>
  );
};