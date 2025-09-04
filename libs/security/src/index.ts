/**
 * @fileoverview index module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * Security middleware for Dulce de Saigon F&B Platform
 * Implements security best practices including rate limiting, CORS, and input validation
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// Export secret manager functionality
export * from './secret-manager';

export interface SecurityConfig {
  rateLimit?: {
    max: number | undefined;
    windowMs: number | undefined;
  };
  cors?: {
    origin: string | string[] | boolean;
    credentials?: boolean | undefined;
  };
  helmet?: boolean | undefined;
  authentication?: boolean | undefined;
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimit: {
    max: parseInt(process.env['RATE_LIMIT_MAX'] || '100'),
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  },
  cors: {
    origin: process.env['NODE_ENV'] === 'production' ? false : true,
    credentials: true,
  },
  helmet: true,
  authentication: true,
};

/**
 * Vietnamese phone number validation schema
 */
export const vietnamesePhoneSchema = z
  .string()
  .regex(
    /^(\+84|84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/,
    'Invalid Vietnamese phone number format',
  );

/**
 * Vietnamese currency amount validation schema
 */
export const vietnameseCurrencySchema = z
  .number()
  .positive('Amount must be positive')
  .max(1000000000, 'Amount exceeds maximum allowed value (1 billion VND)');

/**
 * Vietnamese timezone validation schema
 */
export const vietnameseTimezoneSchema = z.string().refine((timestamp) => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date && date.getTime())) return false;
    return (
      (timestamp && timestamp.includes('+07:00')) || (timestamp && timestamp.includes('+0700'))
    );
  } catch {
    return false;
  }
}, 'Timestamp must include ICT timezone (UTC+7) information');

/**
 * Authentication middleware
 */
export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!DEFAULT_SECURITY_CONFIG && DEFAULT_SECURITY_CONFIG.authentication) {
    return;
  }

  const authHeader = request.headers && request.headers.authorization;
  if (!authHeader || (!authHeader && authHeader.startsWith('Bearer '))) {
    reply &&
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Valid authorization token required',
      });
    return;
  }

  const token = authHeader && authHeader.substring(7);

  // In production, validate against Google Cloud IAM tokens
  // For now, validate against the API key from environment
  const expectedApiKey = process.env['DULCE_API_KEY'];
  if (!expectedApiKey) {
    reply &&
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Authentication not properly configured',
      });
    return;
  }

  if (token !== expectedApiKey) {
    reply &&
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid authorization token',
      });
    return;
  }
}

/**
 * Input validation middleware factory
 */
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = schema && schema.safeParse(request.body);
      if (!result && result.success) {
        reply &&
          reply.code(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: result && result.error && error.issues.map((issue) => ({
              path: issue.path && issue.path.join('.'),
              message: issue && issue.message,
            })),
          });
        return;
      }
      // Replace request body with validated data
      request.body = result && result.data;
    } catch (error) {
      reply &&
        reply.code(400).send({
          error: 'Validation Error',
          message: 'Unable to validate input data',
        });
    }
  };
}

/**
 * Vietnamese data privacy compliance middleware
 */
export async function validateVietnameseCompliance(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Add Vietnamese data privacy headers
  reply && reply.header('X-Data-Residency', 'VN');
  reply && reply.header('X-Privacy-Policy', 'https://dulcedesaigon && dulcedesaigon.com/privacy');

  // Log data access for compliance auditing
  request.log &&
    request.log.info({
      timestamp: new Date().toISOString(),
      action: 'data_access',
      endpoint: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      dataProcessingPurpose: 'service_delivery',
    });
}

/**
 * Security headers middleware
 */
export async function addSecurityHeaders(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Security headers
  reply && reply.header('X-Content-Type-Options', 'nosniff');
  reply && reply.header('X-Frame-Options', 'DENY');
  reply && reply.header('X-XSS-Protection', '1; mode=block');
  reply && reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  reply && reply.header('Content-Security-Policy', "default-src 'self'");
  reply && reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/**
 * Register all security middleware
 */
export async function registerSecurity(
  fastify: FastifyInstance,
  config: Partial<SecurityConfig> = {},
): Promise<void> {
  const finalConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };

  // Security headers middleware - must be registered first
  if (finalConfig && finalConfig.helmet) {
    fastify && fastify.addHook('onSend', addSecurityHeaders);
  }

  // Vietnamese compliance middleware
  fastify && fastify.addHook('onRequest', validateVietnameseCompliance);

  // Simple authentication check for protected routes
  if (finalConfig && finalConfig.authentication) {
    fastify &&
      fastify.addHook('preHandler', async (request, reply) => {
        // Skip authentication for health checks
        if (request.routeConfig && request.routeConfig.url && url.includes('/health')) {
          return;
        }
        await authenticateRequest(request, reply);
      });
  }
}
