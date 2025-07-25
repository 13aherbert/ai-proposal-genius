import { CustomEvent, UserProperties } from '@/types/analytics';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

class AnalyticsService {
  private isInitialized = false;
  private measurementId: string | null = null;
  private isDevelopment = import.meta.env.DEV;

  constructor() {
    this.measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID || null;
    
    if (this.measurementId && !this.isDevelopment) {
      this.initialize();
    } else if (this.isDevelopment) {
      console.log('[Analytics] Development mode - tracking disabled');
    }
  }

  private initialize() {
    if (!this.measurementId || this.isInitialized) return;

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: any[]) {
      window.dataLayer.push(args);
    };

    // Configure GA4
    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: false, // We'll handle page views manually
    });

    this.isInitialized = true;
    console.log('[Analytics] GA4 initialized with ID:', this.measurementId);
  }

  /**
   * Track page views for SPA routing
   */
  trackPageView(path: string, title?: string) {
    if (!this.isEnabled()) return;

    window.gtag('config', this.measurementId!, {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });

    if (this.isDevelopment) {
      console.log('[Analytics] Page view:', { path, title });
    }
  }

  /**
   * Set user properties for analytics
   */
  setUserProperties(properties: UserProperties) {
    if (!this.isEnabled()) return;

    window.gtag('config', this.measurementId!, {
      user_properties: properties,
    });

    if (this.isDevelopment) {
      console.log('[Analytics] User properties set:', properties);
    }
  }

  /**
   * Track custom events
   */
  trackEvent(eventName: string, parameters: Record<string, any> = {}) {
    if (!this.isEnabled()) return;

    window.gtag('event', eventName, parameters);

    if (this.isDevelopment) {
      console.log('[Analytics] Event tracked:', eventName, parameters);
    }
  }

  /**
   * Track authentication events
   */
  trackAuth(action: 'sign_up' | 'login' | 'logout', method?: string) {
    this.trackEvent(action, {
      method: method || 'email',
    });
  }

  /**
   * Track proposal workflow events
   */
  trackProposalWorkflow(step: string, projectId: string, success: boolean, method?: string, durationMs?: number) {
    this.trackEvent('proposal_workflow', {
      workflow_step: step,
      project_id: projectId,
      success,
      method,
      duration_ms: durationMs,
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, action: string, context?: string) {
    this.trackEvent('feature_usage', {
      feature_name: feature,
      action,
      context,
    });
  }

  /**
   * Track subscription events
   */
  trackSubscription(action: string, fromPlan?: string, toPlan?: string) {
    this.trackEvent('subscription', {
      action,
      from_plan: fromPlan,
      to_plan: toPlan,
    });
  }

  /**
   * Track file uploads
   */
  trackFileUpload(fileType: string, fileSize: number, success: boolean) {
    this.trackEvent('file_upload', {
      file_type: fileType,
      file_size: fileSize,
      success,
    });
  }

  /**
   * Track search and navigation
   */
  trackSearch(searchTerm: string, resultsCount: number) {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }

  /**
   * Track custom events with flexible parameters
   */
  trackCustomEvent(event: CustomEvent) {
    if ('step' in event) {
      // ProposalWorkflowEvent
      this.trackProposalWorkflow(event.step, event.project_id, event.success, event.method, event.duration_ms);
    } else if ('feature' in event) {
      // FeatureUsageEvent
      this.trackFeatureUsage(event.feature, event.action, event.context);
    } else if ('action' in event && 'from_plan' in event) {
      // SubscriptionEvent
      this.trackSubscription(event.action, event.from_plan, event.to_plan);
    } else if ('action' in event && 'category' in event) {
      // Generic AnalyticsEvent
      this.trackEvent(event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.custom_parameters,
      });
    }
  }

  private isEnabled(): boolean {
    return !this.isDevelopment && this.isInitialized && this.measurementId !== null;
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();