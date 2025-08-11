/**
 * Core Event Instrumentation for GA4
 * 
 * This module defines the core event types and validation logic based on the event taxonomy.
 * It provides type-safe event definitions and validation functions to ensure consistency
 * across all platforms (web, iOS, Android).
 */

// Event name constants based on event-taxonomy.yaml
export const GA4_EVENTS = {
  PAGE_VIEW: 'page_view',
  LOGIN: 'login',
  SIGN_UP: 'sign_up',
  PURCHASE: 'purchase',
  FORM_SUBMISSION: 'form_submission',
} as const;

// Type for event names
export type GA4EventName = typeof GA4_EVENTS[keyof typeof GA4_EVENTS];

// Parameter name constants
export const GA4_PARAMS = {
  // Page view parameters
  PAGE_LOCATION: 'page_location',
  PAGE_TITLE: 'page_title',
  PAGE_PATH: 'page_path',
  
  // Login/Sign up parameters
  METHOD: 'method',
  USER_ID: 'user_id',
  
  // Purchase parameters
  TRANSACTION_ID: 'transaction_id',
  VALUE: 'value',
  CURRENCY: 'currency',
  ITEMS: 'items',
  TAX: 'tax',
  SHIPPING: 'shipping',
  
  // Form submission parameters
  FORM_ID: 'form_id',
  FORM_NAME: 'form_name',
  FORM_DESTINATION: 'form_destination',
} as const;

// Type for parameter names
export type GA4ParamName = typeof GA4_PARAMS[keyof typeof GA4_PARAMS];

// Event parameter interfaces
export interface PageViewEventParams {
  [GA4_PARAMS.PAGE_LOCATION]?: string;
  [GA4_PARAMS.PAGE_TITLE]?: string;
  [GA4_PARAMS.PAGE_PATH]?: string;
}

export interface LoginEventParams {
  [GA4_PARAMS.METHOD]: string;
  [GA4_PARAMS.USER_ID]?: string;
}

export interface SignUpEventParams {
  [GA4_PARAMS.METHOD]: string;
  [GA4_PARAMS.USER_ID]?: string;
}

export interface PurchaseEventParams {
  [GA4_PARAMS.TRANSACTION_ID]: string;
  [GA4_PARAMS.VALUE]: number;
  [GA4_PARAMS.CURRENCY]: string;
  [GA4_PARAMS.ITEMS]?: Array<{
    item_id?: string;
    item_name?: string;
    item_category?: string;
    item_variant?: string;
    price?: number;
    quantity?: number;
  }>;
  [GA4_PARAMS.TAX]?: number;
  [GA4_PARAMS.SHIPPING]?: number;
}

export interface FormSubmissionEventParams {
  [GA4_PARAMS.FORM_ID]: string;
  [GA4_PARAMS.FORM_NAME]?: string;
  [GA4_PARAMS.FORM_DESTINATION]?: string;
}

// Union type for all event parameters
export type GA4EventParams = 
  | PageViewEventParams
  | LoginEventParams
  | SignUpEventParams
  | PurchaseEventParams
  | FormSubmissionEventParams;

// Event configuration interface
export interface GA4EventConfig {
  name: GA4EventName;
  description: string;
  requiredParams: string[];
  optionalParams: string[];
  validator: (params: any) => boolean;
}

// Validation functions for each event type
export const validators = {
  isPageViewParams: (params: any): params is PageViewEventParams => {
    return (
      typeof params === 'object' &&
      params !== null &&
      (params[GA4_PARAMS.PAGE_LOCATION] === undefined || typeof params[GA4_PARAMS.PAGE_LOCATION] === 'string') &&
      (params[GA4_PARAMS.PAGE_TITLE] === undefined || typeof params[GA4_PARAMS.PAGE_TITLE] === 'string') &&
      (params[GA4_PARAMS.PAGE_PATH] === undefined || typeof params[GA4_PARAMS.PAGE_PATH] === 'string')
    );
  },

  isLoginParams: (params: any): params is LoginEventParams => {
    return (
      typeof params === 'object' &&
      params !== null &&
      typeof params[GA4_PARAMS.METHOD] === 'string' &&
      (params[GA4_PARAMS.USER_ID] === undefined || typeof params[GA4_PARAMS.USER_ID] === 'string')
    );
  },

  isSignUpParams: (params: any): params is SignUpEventParams => {
    return (
      typeof params === 'object' &&
      params !== null &&
      typeof params[GA4_PARAMS.METHOD] === 'string' &&
      (params[GA4_PARAMS.USER_ID] === undefined || typeof params[GA4_PARAMS.USER_ID] === 'string')
    );
  },

  isPurchaseParams: (params: any): params is PurchaseEventParams => {
    return (
      typeof params === 'object' &&
      params !== null &&
      typeof params[GA4_PARAMS.TRANSACTION_ID] === 'string' &&
      typeof params[GA4_PARAMS.VALUE] === 'number' &&
      typeof params[GA4_PARAMS.CURRENCY] === 'string' &&
      (params[GA4_PARAMS.ITEMS] === undefined || Array.isArray(params[GA4_PARAMS.ITEMS])) &&
      (params[GA4_PARAMS.TAX] === undefined || typeof params[GA4_PARAMS.TAX] === 'number') &&
      (params[GA4_PARAMS.SHIPPING] === undefined || typeof params[GA4_PARAMS.SHIPPING] === 'number')
    );
  },

  isFormSubmissionParams: (params: any): params is FormSubmissionEventParams => {
    return (
      typeof params === 'object' &&
      params !== null &&
      typeof params[GA4_PARAMS.FORM_ID] === 'string' &&
      (params[GA4_PARAMS.FORM_NAME] === undefined || typeof params[GA4_PARAMS.FORM_NAME] === 'string') &&
      (params[GA4_PARAMS.FORM_DESTINATION] === undefined || typeof params[GA4_PARAMS.FORM_DESTINATION] === 'string')
    );
  },
};

// Event configurations based on event-taxonomy.yaml
export const GA4_EVENT_CONFIGS: Record<GA4EventName, GA4EventConfig> = {
  [GA4_EVENTS.PAGE_VIEW]: {
    name: GA4_EVENTS.PAGE_VIEW,
    description: 'Fires when a user views a page. This is often collected automatically.',
    requiredParams: [],
    optionalParams: [GA4_PARAMS.PAGE_LOCATION, GA4_PARAMS.PAGE_TITLE, GA4_PARAMS.PAGE_PATH],
    validator: validators.isPageViewParams,
  },
  [GA4_EVENTS.LOGIN]: {
    name: GA4_EVENTS.LOGIN,
    description: 'Fires when a user successfully logs in.',
    requiredParams: [GA4_PARAMS.METHOD],
    optionalParams: [GA4_PARAMS.USER_ID],
    validator: validators.isLoginParams,
  },
  [GA4_EVENTS.SIGN_UP]: {
    name: GA4_EVENTS.SIGN_UP,
    description: 'Fires when a user successfully creates a new account.',
    requiredParams: [GA4_PARAMS.METHOD],
    optionalParams: [GA4_PARAMS.USER_ID],
    validator: validators.isSignUpParams,
  },
  [GA4_EVENTS.PURCHASE]: {
    name: GA4_EVENTS.PURCHASE,
    description: 'Fires when a user completes a purchase.',
    requiredParams: [GA4_PARAMS.TRANSACTION_ID, GA4_PARAMS.VALUE, GA4_PARAMS.CURRENCY],
    optionalParams: [GA4_PARAMS.ITEMS, GA4_PARAMS.TAX, GA4_PARAMS.SHIPPING],
    validator: validators.isPurchaseParams,
  },
  [GA4_EVENTS.FORM_SUBMISSION]: {
    name: GA4_EVENTS.FORM_SUBMISSION,
    description: 'Fires when a user submits a form.',
    requiredParams: [GA4_PARAMS.FORM_ID],
    optionalParams: [GA4_PARAMS.FORM_NAME, GA4_PARAMS.FORM_DESTINATION],
    validator: validators.isFormSubmissionParams,
  },
};

/**
 * Validate event parameters against the event configuration
 * @param eventName The name of the event
 * @param params The parameters to validate
 * @returns Validation result with success status and any errors
 */
export function validateEventParams(
  eventName: GA4EventName,
  params: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = GA4_EVENT_CONFIGS[eventName];

  if (!config) {
    errors.push(`Unknown event name: ${eventName}`);
    return { valid: false, errors };
  }

  // Check if params is an object
  if (typeof params !== 'object' || params === null) {
    errors.push('Event parameters must be an object');
    return { valid: false, errors };
  }

  // Check required parameters
  for (const requiredParam of config.requiredParams) {
    if (!(requiredParam in params)) {
      errors.push(`Missing required parameter: ${String(requiredParam)}`);
    }
  }

  // Validate using the specific validator
  if (!config.validator(params)) {
    errors.push(`Invalid parameter types for event: ${eventName}`);
  }

  // Check for unknown parameters
  const allowedParams = new Set([...config.requiredParams, ...config.optionalParams]);
  for (const param in params) {
    if (!allowedParams.has(param)) {
      errors.push(`Unknown parameter: ${param}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a type-safe event object
 * @param eventName The name of the event
 * @param params The event parameters
 * @returns The event object or null if validation fails
 */
export function createEvent<T extends GA4EventParams>(
  eventName: GA4EventName,
  params: T
): { name: GA4EventName; params: T } | null {
  const validation = validateEventParams(eventName, params);
  
  if (!validation.valid) {
    console.error(`GA4 Event validation failed for ${eventName}:`, validation.errors);
    return null;
  }

  return {
    name: eventName,
    params,
  };
}

/**
 * Helper function to sanitize event parameters
 * Removes undefined values and ensures proper types
 */
export function sanitizeEventParams(params: any): any {
  if (typeof params !== 'object' || params === null) {
    return {};
  }

  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Get event configuration by name
 */
export function getEventConfig(eventName: GA4EventName): GA4EventConfig | undefined {
  return GA4_EVENT_CONFIGS[eventName];
}

/**
 * Get all available event names
 */
export function getAvailableEvents(): GA4EventName[] {
  return Object.values(GA4_EVENTS);
}

/**
 * Check if a string is a valid GA4 event name
 */
export function isValidEventName(eventName: string): eventName is GA4EventName {
  return Object.values(GA4_EVENTS).includes(eventName as GA4EventName);
}

// Export everything for use in other modules
export default {
  events: GA4_EVENTS,
  params: GA4_PARAMS,
  configs: GA4_EVENT_CONFIGS,
  validators,
  validateEventParams,
  createEvent,
  sanitizeEventParams,
  getEventConfig,
  getAvailableEvents,
  isValidEventName,
};