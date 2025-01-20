import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KnowledgeCategory } from "../types";

interface EntryCategoryProps {
  isEditing: boolean;
  initialCategory: string;
  editedCategory: string;
  categories: KnowledgeCategory[];
  onEditedCategoryChange: (category: string) => void;
}

export const EntryCategory = ({
  isEditing,
  initialCategory,
  editedCategory,
  categories,
  onEditedCategoryChange,
}: EntryCategoryProps) => {
  return (
    <div>
      {isEditing ? (
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={editedCategory}
            onValueChange={onEditedCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div>
          <span className="text-sm font-medium">Category:</span>
          <span className="ml-2 text-sm text-muted-foreground">
            {initialCategory}
          </span>
        </div>
      )}
    </div>
  );
};