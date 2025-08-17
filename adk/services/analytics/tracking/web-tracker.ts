/**
 * GA4 Web Tracking Utility
 * 
 * This module provides a standardized interface for tracking events in Google Analytics 4
 * for web applications. It wraps the gtag function to ensure consistent event tracking
 * across the application.
 */

// Type definitions for GA4 event parameters
interface GA4EventParams {
  [key: string]: any;
}

// Core event parameter interfaces based on event-taxonomy.yaml
interface PageViewParams {
  page_location?: string;
  page_title?: string;
  page_path?: string;
}

interface LoginParams {
  method: string;
  user_id?: string;
}

interface SignUpParams {
  method: string;
  user_id?: string;
}

interface PurchaseParams {
  transaction_id: string;
  value: number;
  currency: string;
  items?: any[];
  tax?: number;
  shipping?: number;
}

interface FormSubmissionParams {
  form_id: string;
  form_name?: string;
  form_destination?: string;
}

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string | Date,
      config?: GA4EventParams
    ) => void;
  }
}

/**
 * GA4 Web Tracker class
 * Provides methods for tracking events, page views, and user properties
 */
export class GA4WebTracker {
  private measurementId: string;
  private debug: boolean;

  constructor(measurementId: string, debug: boolean = false) {
    this.measurementId = measurementId;
    this.debug = debug;
  }

  /**
   * Initialize GA4 tracking
   * This should be called once when the application starts
   */
  initialize(): void {
    if (typeof window === 'undefined' || !window.gtag) {
      console.warn('GA4: gtag not available. Make sure GA4 script is loaded.');
      return;
    }

    // Initialize GA4 with measurement ID
    window.gtag('config', this.measurementId, {
      send_page_view: false, // We'll handle page views manually
    });

    if (this.debug) {
      console.log(`GA4: Initialized with measurement ID ${this.measurementId}`);
    }
  }

  /**
   * Track a page view event
   */
  trackPageView(params?: PageViewParams): void {
    const eventParams: PageViewParams = {
      page_location: params?.page_location || window.location.href,
      page_title: params?.page_title || document.title,
      page_path: params?.page_path || window.location.pathname,
    };

    this.trackEvent('page_view', eventParams);
  }

  /**
   * Track a login event
   */
  trackLogin(params: LoginParams): void {
    this.trackEvent('login', params);
  }

  /**
   * Track a sign up event
   */
  trackSignUp(params: SignUpParams): void {
    this.trackEvent('sign_up', params);
  }

  /**
   * Track a purchase event
   */
  trackPurchase(params: PurchaseParams): void {
    this.trackEvent('purchase', params);
  }

  /**
   * Track a form submission event
   */
  trackFormSubmission(params: FormSubmissionParams): void {
    this.trackEvent('form_submission', params);
  }

  /**
   * Track a custom event
   * @param eventName The name of the event
   * @param eventParams The parameters for the event
   */
  trackEvent(eventName: string, eventParams?: GA4EventParams): void {
    if (typeof window === 'undefined' || !window.gtag) {
      console.warn('GA4: gtag not available');
      return;
    }

    try {
      window.gtag('event', eventName, eventParams);
      
      if (this.debug) {
        console.log('GA4 Event:', eventName, eventParams);
      }
    } catch (error) {
      console.error('GA4: Error tracking event', error);
    }
  }

  /**
   * Set user properties
   * @param properties User properties to set
   */
  setUserProperties(properties: GA4EventParams): void {
    if (typeof window === 'undefined' || !window.gtag) {
      console.warn('GA4: gtag not available');
      return;
    }

    try {
      window.gtag('set', 'user_properties', properties);
      
      if (this.debug) {
        console.log('GA4 User Properties:', properties);
      }
    } catch (error) {
      console.error('GA4: Error setting user properties', error);
    }
  }

  /**
   * Set user ID for cross-device tracking
   * @param userId The user ID to set
   */
  setUserId(userId: string): void {
    if (typeof window === 'undefined' || !window.gtag) {
      console.warn('GA4: gtag not available');
      return;
    }

    try {
      window.gtag('config', this.measurementId, {
        user_id: userId,
      });
      
      if (this.debug) {
        console.log('GA4 User ID set:', userId);
      }
    } catch (error) {
      console.error('GA4: Error setting user ID', error);
    }
  }
}

// Export a singleton instance for convenience
let trackerInstance: GA4WebTracker | null = null;

/**
 * Get or create the GA4 tracker instance
 * @param measurementId GA4 Measurement ID (required on first call)
 * @param debug Enable debug logging
 */
export function getGA4Tracker(measurementId?: string, debug?: boolean): GA4WebTracker {
  if (!trackerInstance) {
    if (!measurementId) {
      throw new Error('GA4: Measurement ID required for initialization');
    }
    trackerInstance = new GA4WebTracker(measurementId, debug);
  }
  return trackerInstance;
}

// Export types for use in other modules
export type {
  GA4EventParams,
  PageViewParams,
  LoginParams,
  SignUpParams,
  PurchaseParams,
  FormSubmissionParams,
};