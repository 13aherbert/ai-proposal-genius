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
      className="bg-black/30 backdrop-blur-sm hover:bg-black/40 transition-all cursor-pointer border-brand-silver h-full"
      onClick={onClick}
    >
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-brand-green">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <p className="text-sm md:text-base text-white">{description}</p>
      </CardContent>
    </Card>
  );
};