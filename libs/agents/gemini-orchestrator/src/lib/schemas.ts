/**
 * @fileoverview This file contains the schemas for the Gemini Orchestrator.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */
import { z } from 'zod';

/**
 * The schema for the orchestrator input.
 */
export const orchestratorInputSchema = z.object({
  query: z.string(),
});

/**
 * The schema for the orchestrator output.
 */
export const orchestratorOutputSchema = z.any();
