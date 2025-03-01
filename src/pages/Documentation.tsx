
import { DocsViewer } from "@/components/documentation/DocsViewer";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";

const Documentation = () => {
  const { docId = "onboarding" } = useParams<{ docId?: string }>();
  
  // Custom hook for document title - creating inline since it's a simple one
  const useDocumentTitle = (title: string) => {
    useEffect(() => {
      const prevTitle = document.title;
      document.title = `${title} | OptiRFP Documentation`;
      
      return () => {
        document.title = prevTitle;
      };
    }, [title]);
  };
  
  // Set document title based on current doc
  useDocumentTitle(docId.charAt(0).toUpperCase() + docId.slice(1));
  
  return <DocsViewer />;
};

export default Documentation;
