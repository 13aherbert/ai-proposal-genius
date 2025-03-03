
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

export function QuickActionCard({ icon: Icon, title, description, onClick }: QuickActionCardProps) {
  return (
    <Card
      className="bg-black/30 backdrop-blur-sm border-brand-silver hover:bg-black/40 transition-colors cursor-pointer overflow-hidden h-full"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start space-x-4">
          <div className="bg-brand-green/20 p-3 rounded-full">
            <Icon className="h-6 w-6 text-brand-green" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-white mb-0.5">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
