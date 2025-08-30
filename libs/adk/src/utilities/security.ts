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
  allowHtml: boolean;
  maxLength?: number;
  stripNumbers: boolean;
}

/**
 * Security utility for ADK
 */
export class Security {
  private config: ConfigManager;
  private encryptionKey?: Buffer;
  
  constructor(config: ConfigManager) {
    this.config = config;
    
    // Initialize encryption key if available
    const keyString = this.config.get('security.encryptionKey');
    if (keyString) {
      this.encryptionKey = Buffer.from(keyString, 'base64');
    }
  }
  
  /**
   * Encrypt a string or object
   */
  encrypt(data: string | object): string {
    if (!this.encryptionKey) {
      throw new ADKError({
        message: 'Encryption key not configured',
        type: ADKErrorType.SECURITY,
      });
    }
    
    try {
      // Convert object to string if needed
      const stringData = typeof data === 'string' 
        ? data 
        : JSON.stringify(data);
      
      // Generate initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv(
        'aes-256-cbc', 
        this.encryptionKey, 
        iv
      );
      
      // Encrypt data
      let encrypted = cipher.update(stringData, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Combine IV and encrypted data
      return `${iv.toString('base64')}:${encrypted}`;
    } catch (error) {
      throw new ADKError({
        message: 'Encryption failed',
        type: ADKErrorType.SECURITY,
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
        type: ADKErrorType.SECURITY,
      });
    }
    
    try {
      // Split IV and encrypted data
      const [ivString, encrypted] = encryptedData.split(':');
      
      if (!ivString || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }
      
      // Convert IV from base64
      const iv = Buffer.from(ivString, 'base64');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc', 
        this.encryptionKey, 
        iv
      );
      
      // Decrypt data
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new ADKError({
        message: 'Decryption failed',
        type: ADKErrorType.SECURITY,
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
  
  /**
   * Generate a secure hash of data
   */
  hash(data: string, algorithm = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }
  
  /**
   * Generate a random token
   */
  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Sanitize user input
   */
  sanitizeInput(input: string, options: Partial<SanitizeOptions> = {}): string {
    const defaults: SanitizeOptions = {
      allowHtml: false,
      maxLength: undefined,
      stripNumbers: false,
    };
    
    const opts = { ...defaults, ...options };
    let sanitized = input;
    
    // Remove HTML if not allowed
    if (!opts.allowHtml) {
      sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    // Strip numbers if requested
    if (opts.stripNumbers) {
      sanitized = sanitized.replace(/\d/g, '');
    }
    
    // Truncate if needed
    if (opts.maxLength && sanitized.length > opts.maxLength) {
      sanitized = sanitized.substring(0, opts.maxLength);
    }
    
    return sanitized;
  }
  
  /**
   * Validate email address format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Compare strings in constant time (to prevent timing attacks)
   */
  constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(a, 'utf8'),
      Buffer.from(b, 'utf8')
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
    includeSpecial = true
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
        type: ADKErrorType.SECURITY,
      });
    }
    
    let password = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % chars.length;
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
    text = text.replace(ccRegex, '[REDACTED_CC]');
    
    // Redact potential API keys (long alphanumeric strings)
    const apiKeyRegex = /\b[A-Za-z0-9_-]{32,}\b/g;
    text = text.replace(apiKeyRegex, '[REDACTED_KEY]');
    
    // Redact potential Vietnamese national IDs
    const vietnameseIdRegex = /\b\d{9,12}\b/g;
    text = text.replace(vietnameseIdRegex, '[REDACTED_ID]');
    
    // Redact phone numbers
    const phoneRegex = /\b(?:\+84|0)(?:\d[-\s]?){8,9}\d\b/g;
    text = text.replace(phoneRegex, '[REDACTED_PHONE]');
    
    return text;
  }
  
  /**
   * Validate data against a schema (simplified implementation)
   */
  validateSchema(data: any, schema: Record<string, any>): boolean {
    for (const [key, requirements] of Object.entries(schema)) {
      if (!(key in data)) {
        if (requirements.required) {
          return false;
        }
        continue;
      }
      
      const value = data[key];
      
      // Type validation
      if (requirements.type && typeof value !== requirements.type) {
        return false;
      }
      
      // Min/max validation for strings and arrays
      if ((typeof value === 'string' || Array.isArray(value)) && 
          requirements.minLength && 
          value.length < requirements.minLength) {
        return false;
      }
      
      if ((typeof value === 'string' || Array.isArray(value)) && 
          requirements.maxLength && 
          value.length > requirements.maxLength) {
        return false;
      }
      
      // Min/max validation for numbers
      if (typeof value === 'number') {
        if (requirements.min !== undefined && value < requirements.min) {
          return false;
        }
        if (requirements.max !== undefined && value > requirements.max) {
          return false;
        }
      }
      
      // Pattern validation
      if (typeof value === 'string' && 
          requirements.pattern && 
          !new RegExp(requirements.pattern).test(value)) {
        return false;
      }
    }
    
    return true;
  }
}
