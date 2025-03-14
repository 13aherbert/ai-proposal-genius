
import { BookOpen, FileText, Folder, List, Scale, DollarSign, LineChart, Building } from "lucide-react";
import { KnowledgeCategory } from "../types";

/**
 * Knowledge base categories with their associated icons
 * Used for categorizing knowledge base entries
 */
export const knowledgeCategories: KnowledgeCategory[] = [
  { icon: <BookOpen className="h-4 w-4" />, name: "Company Boilerplates" },
  { icon: <Scale className="h-4 w-4" />, name: "Legal Disclaimers" },
  { icon: <FileText className="h-4 w-4" />, name: "Prior RFP Responses" },
  { icon: <LineChart className="h-4 w-4" />, name: "Industry Benchmarks" },
  { icon: <Folder className="h-4 w-4" />, name: "Competitive Insights" },
  { icon: <DollarSign className="h-4 w-4" />, name: "Pricing Templates" },
  { icon: <FileText className="h-4 w-4" />, name: "Estimation Tools" },
  { icon: <Building className="h-4 w-4" />, name: "Other Company Information" },
];
