import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List } from "lucide-react";
import { KnowledgeCategory } from "./types";

interface CategorySidebarProps {
  categories: KnowledgeCategory[];
}

export const CategorySidebar = ({ categories }: CategorySidebarProps) => {
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
          {categories.map((category) => (
            <Button key={category.name} variant="ghost" className="justify-start gap-2">
              {category.icon}
              {category.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};