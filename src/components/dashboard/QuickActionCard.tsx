import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

export const QuickActionCard = ({ icon: Icon, title, description, onClick }: QuickActionCardProps) => {
  return (
    <Card
      className="bg-black/30 backdrop-blur-sm hover:bg-black/40 transition-all cursor-pointer border-brand-silver"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-green">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-brand-gray">{description}</p>
      </CardContent>
    </Card>
  );
};