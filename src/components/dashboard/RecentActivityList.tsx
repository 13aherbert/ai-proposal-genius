
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FolderOpen, Upload, FileText } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

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

export const RecentActivityList = ({ activities, isLoading, onActivityClick }: RecentActivityListProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-4">Loading recent activity...</p>;
  }

  if (activities.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-3">
          <div className="p-3 rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground">Your recent projects and knowledge base updates will appear here</p>
          </div>
          <Button 
            onClick={() => navigate('/upload-rfp')}
            className="mt-2 flex items-center gap-2"
            size="sm"
          >
            <Upload className="h-4 w-4" />
            Upload Your First RFP
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {activities.map((activity) => (
        <div
          key={`${activity.type}-${activity.id}`}
          className="flex items-center justify-between p-2 md:p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => onActivityClick(activity)}
        >
          <div className="flex items-center gap-3 min-w-0">
            {activity.type === 'project' ? (
              <FolderOpen className="h-4 w-4 text-brand-green shrink-0" />
            ) : (
              <BookOpen className="h-4 w-4 text-brand-green shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground text-sm md:text-base truncate">{activity.title}</p>
              <p className="text-xs md:text-sm text-muted-foreground">
                {activity.isUpdate ? 'Updated' : 'Created'} {format(new Date(activity.date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-brand-green hover:text-brand-green/80 hover:bg-brand-green/10 ml-2 shrink-0"
          >
            View
          </Button>
        </div>
      ))}
    </div>
  );
};
