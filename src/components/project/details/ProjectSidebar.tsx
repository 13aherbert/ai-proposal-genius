import { Button } from "@/components/ui/button";
import { FileText, LayoutTemplate, CheckSquare, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function ProjectSidebar({ activeSection, onSectionChange }: ProjectSidebarProps) {
  const sections = [
    {
      id: "info",
      label: "Project Info",
      icon: FileText,
    },
    {
      id: "analysis",
      label: "RFP Analysis",
      icon: ScrollText,
    },
    {
      id: "outline",
      label: "Proposal Outline",
      icon: LayoutTemplate,
    },
    {
      id: "evaluation",
      label: "Evaluation",
      icon: CheckSquare,
    },
  ];

  return (
    <div className="w-64 border-r bg-background p-4 space-y-2">
      {sections.map((section) => (
        <Button
          key={section.id}
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2",
            activeSection === section.id && "bg-muted"
          )}
          onClick={() => onSectionChange(section.id)}
        >
          <section.icon className="h-4 w-4" />
          {section.label}
        </Button>
      ))}
    </div>
  );
}