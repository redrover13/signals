/**
 * @fileoverview web-tracker module for the tracking component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { 
  BaseEvent, 
  AgentEvent, 
  SearchEvent, 
  ErrorEvent, 
  EventCategory,
  createBaseEvent
} from './core-events';

/**
 * Web-specific analytics implementation
 */
class WebAnalyticsTracker {
  private sessionId: string;
  private userId?: string;
  private locale: string;
  private endpoint: string;

  constructor(
    endpoint: string = 'https://analytics.dulcesaigon.vn/collect',
    locale: string = 'vi-VN'
  ) {
    this.endpoint = endpoint;
    this.locale = locale;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `web_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  setLocale(locale: string): void {
    this.locale = locale;
  }

  private async sendEvent(event: BaseEvent): Promise<void> {
    try {
      // Add user ID if available
      if (this.userId) {
        event.user_id = this.userId;
      }

      // Send to analytics endpoint
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', event);
      }
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  trackAgentInteraction(
    agentId: string,
    agentAction: string,
    query?: string,
    resultCount?: number,
    durationMs?: number
  ): Promise<void> {
    const event: AgentEvent = {
      ...createBaseEvent('agent_interaction', 'web', this.sessionId, this.locale),
      category: EventCategory.AGENT,
      agent_id: agentId,
      agent_action: agentAction,
      query,
      agent_result_count: resultCount,
      duration_ms: durationMs,
    };

    return this.sendEvent(event);
  }

  trackSearch(
    query: string,
    resultsCount: number,
    filters?: Record<string, string>,
    durationMs?: number
  ): Promise<void> {
    const event: SearchEvent = {
      ...createBaseEvent('search', 'web', this.sessionId, this.locale),
      category: EventCategory.SEARCH,
      query,
      results_count: resultsCount,
      filters_applied: filters,
      duration_ms: durationMs || 0,
    };

    return this.sendEvent(event);
  }

  trackError(
    errorCode: string,
    errorMessage: string,
    component: string,
    stackTrace?: string
  ): Promise<void> {
    const event: ErrorEvent = {
      ...createBaseEvent('error', 'web', this.sessionId, this.locale),
      category: EventCategory.ERROR,
      error_code: errorCode,
      error_message: errorMessage,
      component,
      stack_trace: stackTrace,
    };

    return this.sendEvent(event);
  }
}

export default WebAnalyticsTracker;
