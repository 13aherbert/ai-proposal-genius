
import { Button } from "@/components/ui/button";
import { BookOpen, FolderOpen, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { memo } from 'react';

export interface RecentActivity {
  type: 'project' | 'knowledge';
  title: string;
  date: string;
  id: string;
  isUpdate?: boolean;
}

interface RecentActivityListProps {
  activities: RecentActivity[];
  isLoading: boolean;
  onActivityClick: (activity: RecentActivity) => void;
}

// Use memo to prevent unnecessary re-renders
export const RecentActivityList = memo(({ activities, isLoading, onActivityClick }: RecentActivityListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-5 w-5 text-white animate-spin mr-2" />
        <p className="text-white text-center">Loading recent activity...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return <p className="text-white text-center py-4">No recent activity to display</p>;
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {activities.map((activity) => (
        <div
          key={`${activity.type}-${activity.id}`}
          className="flex items-center justify-between p-2 md:p-3 rounded-lg hover:bg-black/40 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            {activity.type === 'project' ? (
              <FolderOpen className="h-4 w-4 text-brand-green shrink-0" />
            ) : (
              <BookOpen className="h-4 w-4 text-brand-green shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white text-sm md:text-base truncate">{activity.title}</p>
              <p className="text-xs md:text-sm text-white/70">
                {activity.isUpdate ? 'Updated' : 'Created'} {format(new Date(activity.date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-brand-green hover:text-brand-green/80 hover:bg-brand-green/10 ml-2 shrink-0"
            onClick={() => onActivityClick(activity)}
          >
            View
          </Button>
        </div>
      ))}
    </div>
  );
});

// Add display name for debugging
RecentActivityList.displayName = 'RecentActivityList';
