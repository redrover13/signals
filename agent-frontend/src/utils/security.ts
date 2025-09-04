/**
 * @fileoverview Security utilities
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains utilities for enhancing application security.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - User input to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Validates input against a regex pattern
 * @param input - Input to validate
 * @param pattern - Regex pattern
 * @param errorMessage - Error message for failed validation
 * @returns Validation result
 */
export const validateInput = (
  input: string | undefined,
  pattern: RegExp,
  errorMessage = 'Input validation failed',
): { isValid: boolean | undefined; error?: string } => {
  if (typeof input !== 'string' || !pattern.test(input)) {
    return { isValid: false, error: errorMessage };
  }
  return { isValid: true };
};

/**
 * Generates a CSRF token for forms
 * @returns CSRF token
 */
export const generateCSRFToken = (): string => {
  const token =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Store the token in localStorage or cookies
  localStorage.setItem('csrf_token', token);

  return token;
};

/**
 * Validates a CSRF token
 * @param token - Token to validate
 * @returns Whether the token is valid
 */
export const validateCSRFToken = (token: string): boolean => {
  const storedToken = localStorage.getItem('csrf_token');
  return token === storedToken;
};

/**
 * Sets security headers for the application
 * Call this in the index.html or entry point
 */
export const setSecurityHeaders = (): void => {
  // This only works on the server side, but we include the definitions
  // to document what headers should be set in the server configuration
  const headers = {
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=()',
  };

  // Log the headers in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Security headers that should be set on the server:', headers);
  }
};
