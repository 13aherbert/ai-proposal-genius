import { BookOpen, FileText, Folder, List, Scale, DollarSign, LineChart, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CategorySidebar } from "@/components/knowledge-base/CategorySidebar";
import { SearchBar } from "@/components/knowledge-base/SearchBar";
import { RecentEntries } from "@/components/knowledge-base/RecentEntries";
import { AddEntryDialog } from "@/components/knowledge-base/AddEntryDialog";
import { KnowledgeCategory } from "@/components/knowledge-base/types";

const KnowledgeBase = () => {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const categories: KnowledgeCategory[] = [
    { icon: <BookOpen className="h-4 w-4" />, name: "Company Boilerplates" },
    { icon: <Scale className="h-4 w-4" />, name: "Legal Disclaimers" },
    { icon: <FileText className="h-4 w-4" />, name: "Prior RFP Responses" },
    { icon: <LineChart className="h-4 w-4" />, name: "Industry Benchmarks" },
    { icon: <Folder className="h-4 w-4" />, name: "Competitive Insights" },
    { icon: <DollarSign className="h-4 w-4" />, name: "Pricing Templates" },
    { icon: <FileText className="h-4 w-4" />, name: "Estimation Tools" },
  ];

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-8 h-full">
          <header className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                Knowledge Base
              </h1>
              <AddEntryDialog 
                categories={categories}
                open={open}
                onOpenChange={setOpen}
              />
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-5rem)]">
            <CategorySidebar 
              categories={categories} 
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <div className="lg:col-span-3 space-y-6">
              <SearchBar />
              <RecentEntries 
                selectedCategory={selectedCategory} 
                categories={categories}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;