import { ReactNode } from "react";

export interface RFPAnalysisProps {
  filePath: string;
  projectId: string;
}

export interface AnalysisSection {
  title: string;
  content: string[];
  icon: ReactNode;
}

export interface UseRFPAnalysisReturn {
  analysis: string | null;
  isAnalyzing: boolean;
  error: string | null;
  handleAnalyze: () => Promise<void>;
  handleReset: () => void;
}