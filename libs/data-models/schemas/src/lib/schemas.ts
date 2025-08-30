/**
 * @fileoverview schemas module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Customer data interface
 */
export interface CustomerData {
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  preferences?: Record<string, any>;
  orderHistory?: any[];
  location?: string;
}

/**
 * Requirements interface for content generation
 */
export interface Requirements {
  [key: string]: unknown;
}

/**
 * Response interface for content generation
 */
export interface ContentResponse {
  content: string;
  metadata?: Record<string, unknown>;
}