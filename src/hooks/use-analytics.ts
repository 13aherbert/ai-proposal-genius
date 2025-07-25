import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/services/analytics';
import { CustomEvent, UserProperties } from '@/types/analytics';

export const useAnalytics = () => {
  const location = useLocation();

  // Track page views on route changes
  useEffect(() => {
    const path = location.pathname + location.search;
    const title = document.title;
    analytics.trackPageView(path, title);
  }, [location]);

  return {
    // Page tracking
    trackPageView: analytics.trackPageView.bind(analytics),
    
    // User properties
    setUserProperties: analytics.setUserProperties.bind(analytics),
    
    // Authentication events
    trackAuth: analytics.trackAuth.bind(analytics),
    
    // Proposal workflow
    trackProposalWorkflow: analytics.trackProposalWorkflow.bind(analytics),
    
    // Feature usage
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    
    // Subscription events
    trackSubscription: analytics.trackSubscription.bind(analytics),
    
    // File uploads
    trackFileUpload: analytics.trackFileUpload.bind(analytics),
    
    // Search
    trackSearch: analytics.trackSearch.bind(analytics),
    
    // Custom events
    trackCustomEvent: analytics.trackCustomEvent.bind(analytics),
    
    // Generic event tracking
    trackEvent: analytics.trackEvent.bind(analytics),
  };
};

// Hook for tracking specific user interactions
export const useTrackUserInteraction = () => {
  const { trackFeatureUsage, trackEvent } = useAnalytics();

  const trackButtonClick = (buttonName: string, context?: string) => {
    trackEvent('button_click', {
      button_name: buttonName,
      context,
    });
  };

  const trackModalOpen = (modalName: string) => {
    trackFeatureUsage('modal', 'open', modalName);
  };

  const trackModalClose = (modalName: string) => {
    trackFeatureUsage('modal', 'close', modalName);
  };

  const trackFormSubmit = (formName: string, success: boolean) => {
    trackEvent('form_submit', {
      form_name: formName,
      success,
    });
  };

  const trackDownload = (fileName: string, fileType: string) => {
    trackEvent('file_download', {
      file_name: fileName,
      file_type: fileType,
    });
  };

  return {
    trackButtonClick,
    trackModalOpen,
    trackModalClose,
    trackFormSubmit,
    trackDownload,
  };
};

// Hook for tracking business-specific events
export const useTrackProposal = () => {
  const { trackProposalWorkflow, trackEvent } = useAnalytics();

  const trackRFPUpload = (projectId: string, fileSize: number, success: boolean) => {
    const startTime = Date.now();
    trackProposalWorkflow('rfp_upload', projectId, success);
    if (success) {
      trackEvent('rfp_upload_success', {
        project_id: projectId,
        file_size: fileSize,
      });
    }
  };

  const trackAnalysisComplete = (projectId: string, durationMs: number, success: boolean) => {
    trackProposalWorkflow('analysis', projectId, success, 'automated', durationMs);
  };

  const trackOutlineGeneration = (projectId: string, method: 'manual' | 'automated', success: boolean) => {
    trackProposalWorkflow('outline', projectId, success, method);
  };

  const trackContentGeneration = (projectId: string, method: 'manual' | 'automated', sectionsCount: number, success: boolean) => {
    trackProposalWorkflow('content_generation', projectId, success, method);
    trackEvent('content_generation_details', {
      project_id: projectId,
      sections_count: sectionsCount,
      method,
      success,
    });
  };

  const trackProposalEvaluation = (projectId: string, score?: number, success: boolean = true) => {
    trackProposalWorkflow('evaluation', projectId, success);
    if (score !== undefined) {
      trackEvent('proposal_score', {
        project_id: projectId,
        score,
      });
    }
  };

  const trackProposalExport = (projectId: string, format: string, success: boolean) => {
    trackProposalWorkflow('export', projectId, success);
    trackEvent('proposal_export', {
      project_id: projectId,
      export_format: format,
      success,
    });
  };

  return {
    trackRFPUpload,
    trackAnalysisComplete,
    trackOutlineGeneration,
    trackContentGeneration,
    trackProposalEvaluation,
    trackProposalExport,
  };
};