import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { List, Star, Plus, CheckCircle, Circle, AlertTriangle } from "lucide-react";
import { KnowledgeCategory } from "./types";
import { CategoryCoverage } from "@/hooks/use-knowledge-readiness";
import { enhancedKnowledgeCategories } from "./data/categories";
import { stalenessLevel } from "@/utils/relativeTime";

interface CategorySidebarProps {
  categories: KnowledgeCategory[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  categoryCoverage?: CategoryCoverage[];
  templateOnlyCategories?: string[];
  /** Map of category name → most recent updated_at ISO string */
  categoryLastUpdated?: Record<string, string>;
}

export const CategorySidebar = ({ 
  categories, 
  selectedCategory,
  onSelectCategory,
  categoryCoverage = [],
  templateOnlyCategories = [],
  categoryLastUpdated = {},
}: CategorySidebarProps) => {

  const getStatus = (name: string) => {
    const coverage = categoryCoverage.find(c => c.name === name);
    if (!coverage || !coverage.hasContent) return 'empty';
    if (templateOnlyCategories.includes(name)) return 'template';
    return 'customized';
  };

  const getPriority = (name: string) => {
    const cat = enhancedKnowledgeCategories.find(c => c.name === name);
    return cat?.priority ?? 'optional';
  };

  const StatusIcon = ({ name }: { name: string }) => {
    const status = getStatus(name);
    if (status === 'customized') return <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />;
    if (status === 'template') return <Circle className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />;
    return <Circle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />;
  };

  const PriorityIcon = ({ name }: { name: string }) => {
    const priority = getPriority(name);
    if (priority === 'essential') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Essential categories generate better proposals</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return <Plus className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
  };

  const StaleBadge = ({ name }: { name: string }) => {
    const lastUpdated = categoryLastUpdated[name];
    const level = stalenessLevel(lastUpdated);
    if (level === "needs-review") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="text-[9px] px-1 py-0 leading-tight">
                Review
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Not updated in over 180 days</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    if (level === "stale") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Not updated in over 90 days</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return null;
  };

  return (
    <Card className="lg:col-span-1 bg-secondary/50 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <Button 
            key="all" 
            variant={selectedCategory === null ? "default" : "ghost"} 
            className="justify-start gap-2 hover:bg-brand-green hover:text-white min-h-[2.5rem] h-auto whitespace-normal text-left"
            onClick={() => onSelectCategory(null)}
          >
            <List className="h-4 w-4 flex-shrink-0" />
            All Entries
          </Button>
          {categories.map((category) => (
            <Button 
              key={category.name} 
              variant={selectedCategory === category.name ? "default" : "ghost"} 
              className="justify-start gap-1.5 hover:bg-brand-green hover:text-white min-h-[2.5rem] h-auto whitespace-normal text-left text-xs"
              onClick={() => onSelectCategory(category.name)}
            >
              <StatusIcon name={category.name} />
              <span className="flex-1 text-left">{category.name}</span>
              <StaleBadge name={category.name} />
              <PriorityIcon name={category.name} />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
