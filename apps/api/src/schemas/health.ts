/**
 * @fileoverview This file contains the health check schemas for the API.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */
import { z } from 'zod';

/**
 * The schema for the detailed health check response.
 */
export const detailedHealthCheckResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  checks: z.object({
    filesystem: z.object({
      status: z.string(),
      message: z.string(),
    }),
    memory: z.object({
      status: z.string(),
      usage: z.any(),
    }),
    cpu: z.object({
      status: z.string(),
      load: z.any(),
    }),
    network: z.object({
      status: z.string(),
      message: z.string(),
    }),
  }),
});
