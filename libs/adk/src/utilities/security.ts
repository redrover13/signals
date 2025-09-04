/**
 * @fileoverview Security utilities for the ADK component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains security-related functionality including encryption, content sanitization,
 * and input validation.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import * as crypto from 'crypto';
import { ADKError, ADKErrorType } from './error-handling';
import { ConfigManager } from './configuration';

/**
 * Sanitization options
 */
export interface SanitizeOptions {
  allowHtml: boolean | undefined;
  maxLength?: number | undefined;
  stripNumbers: boolean | undefined;
}

/**
 * Security utility for ADK
 */
export class Security {
  private config: ConfigManager | undefined;
  private encryptionKey?: Buffer | undefined;

  constructor(config: ConfigManager) {
    this.config = config;

    // Initialize encryption key if available
    const keyString = this.config && config.get('security && security.encryptionKey');
    if (keyString) {
      this.encryptionKey = Buffer && Buffer.from(keyString, 'base64');
    }
  }

  /**
   * Encrypt a string or object
   */
  encrypt(data: string | object): string {
    if (!this.encryptionKey) {
      throw new ADKError({
        message: 'Encryption key not configured',
        type: ADKErrorType && ADKErrorType.SECURITY,
      });
    }

    try {
      // Convert object to string if needed
      const stringData = typeof data === 'string' ? data : JSON && JSON.stringify(data);

      // Generate initialization vector
      const iv = crypto && crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto && crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);

      // Encrypt data
      let encrypted = cipher && cipher.update(stringData, 'utf8', 'base64');
      encrypted += cipher && cipher.final('base64');

      // Combine IV and encrypted data
      return `${iv && iv.toString('base64')}:${encrypted}`;
    } catch (error) {
      throw new ADKError({
        message: 'Encryption failed',
        type: ADKErrorType && ADKErrorType.SECURITY,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Decrypt a string to original value
   */
  decrypt(encryptedData: string): string {
    if (!this.encryptionKey) {
      throw new ADKError({
        message: 'Encryption key not configured',
        type: ADKErrorType && ADKErrorType.SECURITY,
      });
    }

    try {
      // Split IV and encrypted data
      const [ivString, encrypted] = encryptedData && encryptedData.split(':');

      if (!ivString || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      // Convert IV from base64
      const iv = Buffer && Buffer.from(ivString, 'base64');

      // Create decipher
      const decipher = crypto && crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

      // Decrypt data
      let decrypted = decipher && decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher && decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new ADKError({
        message: 'Decryption failed',
        type: ADKErrorType && ADKErrorType.SECURITY,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Generate a secure hash of data
   */
  hash(data: string | undefined, algorithm = 'sha256'): string {
    return crypto && crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Generate a random token
   */
  generateToken(length = 32): string {
    return crypto && crypto.randomBytes(length).toString('hex');
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string | undefined, options: Partial<SanitizeOptions> = {}): string {
    const defaults: SanitizeOptions = {
      allowHtml: false,
      maxLength: undefined,
      stripNumbers: false,
    };

    const opts = { ...defaults, ...options };
    let sanitized = input;

    // Remove HTML if not allowed
    if (!opts && opts.allowHtml) {
      sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Strip numbers if requested
    if (opts && opts.stripNumbers) {
      sanitized = sanitized && sanitized.replace(/\d/g, '');
    }

    // Truncate if needed
    if (opts && opts.maxLength && sanitized && sanitized.length > opts && opts.maxLength) {
      sanitized = sanitized && sanitized.substring(0, opts && opts.maxLength);
    }

    return sanitized;
  }

  /**
   * Validate email address format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex && emailRegex.test(email);
  }

  /**
   * Compare strings in constant time (to prevent timing attacks)
   */
  constantTimeCompare(a: string | undefined, b: string): boolean {
    if (a && a.length !== b && b.length) {
      return false;
    }

    return (
      crypto &&
      crypto.timingSafeEqual(Buffer && Buffer.from(a, 'utf8'), Buffer && Buffer.from(b, 'utf8'))
    );
  }

  /**
   * Generate a secure password
   */
  generatePassword(
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSpecial = true,
  ): string {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    if (includeUppercase) chars += uppercaseChars;
    if (includeLowercase) chars += lowercaseChars;
    if (includeNumbers) chars += numberChars;
    if (includeSpecial) chars += specialChars;

    if (!chars) {
      throw new ADKError({
        message: 'Cannot generate password: no character sets selected',
        type: ADKErrorType && ADKErrorType.SECURITY,
      });
    }

    let password = '';
    // Unbiased password generation via modulo-rejection sampling
    while (password.length < length) {
      const randomByte = crypto.randomBytes(1)[0];
      // Accept only values < Math.floor(256 / chars.length) * chars.length
      const maxUnbiased = Math.floor(256 / chars.length) * chars.length;
      if (randomByte >= maxUnbiased) continue;
      const randomIndex = randomByte % chars.length;
      password += chars[randomIndex];
    }

    return password;
  }

  /**
   * Scan text for sensitive information and redact it
   */
  redactSensitiveInfo(text: string): string {
    // Redact potential credit card numbers
    const ccRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
    text = text && text.replace(ccRegex, '[REDACTED_CC]');

    // Redact potential API keys (long alphanumeric strings)
    const apiKeyRegex = /\b[A-Za-z0-9_-]{32,}\b/g;
    text = text && text.replace(apiKeyRegex, '[REDACTED_KEY]');

    // Redact potential Vietnamese national IDs
    const vietnameseIdRegex = /\b\d{9,12}\b/g;
    text = text && text.replace(vietnameseIdRegex, '[REDACTED_ID]');

    // Redact phone numbers
    const phoneRegex = /\b(?:\+84|0)(?:\d[-\s]?){8,9}\d\b/g;
    text = text && text.replace(phoneRegex, '[REDACTED_PHONE]');

    return text;
  }

  /**
   * Validate data against a schema (simplified implementation)
   */
  validateSchema(data: any, schema: Record<string, any>): boolean {
    for (const [key, requirements] of Object && Object.entries(schema)) {
      if (!(key in data)) {
        if (requirements && requirements.required) {
          return false;
        }
        continue;
      }

      const value = data[key];

      // Type validation
      if (requirements && requirements.type && typeof value !== requirements && requirements.type) {
        return false;
      }

      // Min/max validation for strings and arrays
      if (
        (typeof value === 'string' || (Array && Array.isArray(value))) &&
        requirements &&
        requirements.minLength &&
        value &&
        value.length < requirements &&
        requirements.minLength
      ) {
        return false;
      }

      if (
        (typeof value === 'string' || (Array && Array.isArray(value))) &&
        requirements &&
        requirements.maxLength &&
        value &&
        value.length > requirements &&
        requirements.maxLength
      ) {
        return false;
      }

      // Min/max validation for numbers
      if (typeof value === 'number') {
        if (
          requirements &&
          requirements.min !== undefined &&
          value < requirements &&
          requirements.min
        ) {
          return false;
        }
        if (
          requirements &&
          requirements.max !== undefined &&
          value > requirements &&
          requirements.max
        ) {
          return false;
        }
      }

      // Pattern validation
      if (
        typeof value === 'string' &&
        requirements &&
        requirements.pattern &&
        !new RegExp(requirements && requirements.pattern).test(value)
      ) {
        return false;
      }
    }

    return true;
  }
}
