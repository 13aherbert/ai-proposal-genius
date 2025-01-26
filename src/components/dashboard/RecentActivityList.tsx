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
    return <p className="text-white text-center py-4">Loading recent activity...</p>;
  }

  if (activities.length === 0) {
    return <p className="text-white text-center py-4">No recent activity to display</p>;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {activities.map((activity) => (
        <div
          key={`${activity.type}-${activity.id}`}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg hover:bg-black/40 cursor-pointer transition-colors gap-3 sm:gap-0"
          onClick={() => onActivityClick(activity)}
        >
          <div className="flex items-center gap-3">
            {activity.type === 'project' ? (
              <FolderOpen className="h-4 w-4 text-brand-green shrink-0" />
            ) : (
              <BookOpen className="h-4 w-4 text-brand-green shrink-0" />
            )}
            <div>
              <p className="font-medium text-white text-sm md:text-base">{activity.title}</p>
              <p className="text-xs md:text-sm text-white/70">
                {format(new Date(activity.date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-brand-green hover:text-brand-green/80 hover:bg-brand-green/10 w-full sm:w-auto"
          >
            View
          </Button>
        </div>
      ))}
    </div>
  );
};