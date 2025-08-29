/**
 * @fileoverview Environment variable schemas for the Dulce de Saigon F&B Data Platform
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains Zod schemas for validating environment variables across different targets.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// ESM module
import { z } from 'zod';

/**
 * Server-side environment variables schema
 * Used by API and Agents services
 */
export const serverSchema = z.object({
  GCP_PROJECT_ID: z.string().min(1),
  BQ_DATASET: z.string().min(1).default('dulce'),
  PUBSUB_TOPIC: z.string().min(1).default('dulce.events'),
  AGENTS_TOPIC: z.string().min(1).default('dulce.agents'),
});

/**
 * Web application environment variables schema
 * Used by Next.js web application
 */
export const webSchema = z.object({
  NEXT_PUBLIC_API_BASE: z.string().url(),
});

/**
 * Vite-based frontend environment variables schema
 * Used by agent-frontend application
 */
export const viteSchema = z.object({
  VITE_GEMINI_API_KEY: z.string().min(1),
  VITE_GCP_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),
});

export type ServerConfig = z.infer<typeof serverSchema>;
export type WebConfig = z.infer<typeof webSchema>;
export type ViteConfig = z.infer<typeof viteSchema>;