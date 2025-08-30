/**
 * @fileoverview core-events module for the tracking component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Core event definitions for Dulce de Saigon analytics
 * These events should be consistent across all platforms
 */

export enum EventCategory {
  USER = 'user',
  CONTENT = 'content',
  AGENT = 'agent',
  SEARCH = 'search',
  ERROR = 'error',
}

export interface BaseEvent {
  event_name: string;
  timestamp: number;
  user_id?: string;
  session_id: string;
  locale: string;
  platform: 'web' | 'ios' | 'android';
  app_version: string;
}

export interface AgentEvent extends BaseEvent {
  category: EventCategory.AGENT;
  agent_id: string;
  agent_action: string;
  agent_result_count?: number;
  query?: string;
  duration_ms?: number;
}

export interface SearchEvent extends BaseEvent {
  category: EventCategory.SEARCH;
  query: string;
  results_count: number;
  filters_applied?: Record<string, string>;
  duration_ms: number;
}

export interface ErrorEvent extends BaseEvent {
  category: EventCategory.ERROR;
  error_code: string;
  error_message: string;
  component: string;
  stack_trace?: string;
}

/**
 * Utility function to create timestamps
 */
export function createTimestamp(): number {
  return Date.now();
}

/**
 * Creates a basic event object with common properties
 */
export function createBaseEvent(
  eventName: string,
  platform: 'web' | 'ios' | 'android',
  sessionId: string,
  locale: string = 'vi-VN',
): BaseEvent {
  return {
    event_name: eventName,
    timestamp: createTimestamp(),
    session_id: sessionId,
    locale,
    platform,
    app_version: '1.0.0', // Should be dynamically set
  };
}
