
import { DocsViewer } from "@/components/documentation/DocsViewer";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

const Documentation = () => {
  const { docId = "onboarding" } = useParams<{ docId?: string }>();
  
  // Custom hook for document title - implemented inline since it's simple
  useEffect(() => {
    const prevTitle = document.title;
    const titleText = docId.charAt(0).toUpperCase() + docId.slice(1);
    document.title = `${titleText} | OptiRFP Documentation`;
    
    return () => {
      document.title = prevTitle;
    };
  }, [docId]);
  
  return <DocsViewer />;
};

export default Documentation;
