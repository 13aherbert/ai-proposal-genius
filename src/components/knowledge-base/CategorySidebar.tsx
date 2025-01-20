import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List } from "lucide-react";
import { KnowledgeCategory } from "./types";

interface CategorySidebarProps {
  categories: KnowledgeCategory[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategorySidebar = ({ 
  categories, 
  selectedCategory,
  onSelectCategory 
}: CategorySidebarProps) => {
  return (
    <Card className="lg:col-span-1 bg-secondary/50 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Button 
            key="all" 
            variant={selectedCategory === null ? "default" : "ghost"} 
            className="justify-start gap-2"
            onClick={() => onSelectCategory(null)}
          >
            <List className="h-4 w-4" />
            All Entries
          </Button>
          {categories.map((category) => (
            <Button 
              key={category.name} 
              variant={selectedCategory === category.name ? "default" : "ghost"} 
              className="justify-start gap-2"
              onClick={() => onSelectCategory(category.name)}
            >
              {category.icon}
              {category.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};