import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}
export function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  variant = 'secondary',
  onClick
}: QuickActionCardProps) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };
  return <Card onClick={handleClick} className="">
      <CardContent className="p-5">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${variant === 'primary' ? 'bg-primary/20' : 'bg-muted'}`}>
            <Icon className={`h-6 w-6 ${variant === 'primary' ? 'text-primary' : 'text-foreground'}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-0.5">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>;
}