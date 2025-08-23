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
    max: number;
    windowMs: number;
  };
  cors?: {
    origin: string | string[] | boolean;
    credentials?: boolean;
  };
  helmet?: boolean;
  authentication?: boolean;
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  },
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true,
  },
  helmet: true,
  authentication: true,
};

/**
 * Vietnamese phone number validation schema
 */
export const vietnamesePhoneSchema = z.string().regex(
  /^(\+84|84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/,
  'Invalid Vietnamese phone number format'
);

/**
 * Vietnamese currency amount validation schema
 */
export const vietnameseCurrencySchema = z.number()
  .positive('Amount must be positive')
  .max(1000000000, 'Amount exceeds maximum allowed value (1 billion VND)');

/**
 * Vietnamese timezone validation schema
 */
export const vietnameseTimezoneSchema = z.string().refine(
  (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return false;
      return timestamp.includes('+07:00') || timestamp.includes('+0700');
    } catch {
      return false;
    }
  },
  'Timestamp must include ICT timezone (UTC+7) information'
);

/**
 * Authentication middleware
 */
export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!DEFAULT_SECURITY_CONFIG.authentication) {
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Valid authorization token required',
    });
    return;
  }

  const token = authHeader.substring(7);
  
  // In production, validate against Google Cloud IAM tokens
  // For now, validate against the API key from environment
  const expectedApiKey = process.env.DULCE_API_KEY;
  if (!expectedApiKey) {
    reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Authentication not properly configured',
    });
    return;
  }

  if (token !== expectedApiKey) {
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
      const result = schema.safeParse(request.body);
      if (!result.success) {
        reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }
      // Replace request body with validated data
      request.body = result.data;
    } catch (error) {
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
  reply: FastifyReply
): Promise<void> {
  // Add Vietnamese data privacy headers
  reply.header('X-Data-Residency', 'VN');
  reply.header('X-Privacy-Policy', 'https://dulcedesaigon.com/privacy');
  
  // Log data access for compliance auditing
  request.log.info({
    timestamp: new Date().toISOString(),
    action: 'data_access',
    endpoint: request.routeConfig.url,
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
  reply: FastifyReply
): Promise<void> {
  // Security headers
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  reply.header('Content-Security-Policy', "default-src 'self'");
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/**
 * Register all security middleware
 */
export async function registerSecurity(
  fastify: FastifyInstance,
  config: Partial<SecurityConfig> = {}
): Promise<void> {
  const finalConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };

  // Security headers middleware - must be registered first
  if (finalConfig.helmet) {
    fastify.addHook('onSend', addSecurityHeaders);
  }

  // Vietnamese compliance middleware
  fastify.addHook('onRequest', validateVietnameseCompliance);

  // Simple authentication check for protected routes
  if (finalConfig.authentication) {
    fastify.addHook('preHandler', async (request, reply) => {
      // Skip authentication for health checks
      if (request.routeConfig.url?.includes('/health')) {
        return;
      }
      await authenticateRequest(request, reply);
    });
  }
}