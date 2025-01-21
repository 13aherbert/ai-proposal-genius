export interface RFPAnalysisProps {
  filePath: string;
  projectId: string;
}

export interface AnalysisSection {
  title: string;
  content: string[];
  icon: React.ReactNode;
}

export interface UseRFPAnalysisReturn {
  analysis: string | null;
  isAnalyzing: boolean;
  error: string | null;
  handleAnalyze: () => Promise<void>;
  handleReset: () => void;
}