/**
 * @fileoverview Tests for environment configuration
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains tests for environment variable validation and loading.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { serverSchema, webSchema, viteSchema } from '../src/index';

// Mock environment variables for testing
const mockEnv = {
  // Server variables
  GCP_PROJECT_ID: 'test-project',
  BQ_DATASET: 'test-dataset',
  PUBSUB_TOPIC: 'test.events',
  AGENTS_TOPIC: 'test.agents',
  
  // Web variables
  NEXT_PUBLIC_API_BASE: 'https://api.example.com',
  
  // Vite variables
  VITE_GEMINI_API_KEY: 'test-gemini-key',
  VITE_GCP_PROJECT_ID: 'test-vite-project',
  VITE_FIREBASE_API_KEY: 'test-firebase-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-firebase-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: 'test-app-id',
};

describe('Environment Configuration', () => {
  describe('Schema Validation', () => {
    it('should validate server schema with valid data', () => {
      const result = serverSchema.parse(mockEnv);
      expect(result.GCP_PROJECT_ID).toBe('test-project');
      expect(result.BQ_DATASET).toBe('test-dataset');
      expect(result.PUBSUB_TOPIC).toBe('test.events');
      expect(result.AGENTS_TOPIC).toBe('test.agents');
    });

    it('should validate web schema with valid data', () => {
      const result = webSchema.parse(mockEnv);
      expect(result.NEXT_PUBLIC_API_BASE).toBe('https://api.example.com');
    });

    it('should validate vite schema with valid data', () => {
      const result = viteSchema.parse(mockEnv);
      expect(result.VITE_GEMINI_API_KEY).toBe('test-gemini-key');
      expect(result.VITE_GCP_PROJECT_ID).toBe('test-vite-project');
      expect(result.VITE_FIREBASE_API_KEY).toBe('test-firebase-key');
    });

    it('should apply default values for server schema', () => {
      const minimalEnv = { GCP_PROJECT_ID: 'test-project' };
      const result = serverSchema.parse(minimalEnv);
      expect(result.GCP_PROJECT_ID).toBe('test-project');
      expect(result.BQ_DATASET).toBe('dulce');
      expect(result.PUBSUB_TOPIC).toBe('dulce.events');
      expect(result.AGENTS_TOPIC).toBe('dulce.agents');
    });

    it('should throw error for invalid URL in web schema', () => {
      const invalidEnv = { NEXT_PUBLIC_API_BASE: 'not-a-url' };
      expect(() => webSchema.parse(invalidEnv)).toThrow();
    });

    it('should throw error for missing required fields', () => {
      expect(() => serverSchema.parse({})).toThrow();
      expect(() => webSchema.parse({})).toThrow();
      expect(() => viteSchema.parse({})).toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should ensure server config has correct types', () => {
      const config = serverSchema.parse(mockEnv);
      expect(typeof config.GCP_PROJECT_ID).toBe('string');
      expect(typeof config.BQ_DATASET).toBe('string');
      expect(typeof config.PUBSUB_TOPIC).toBe('string');
      expect(typeof config.AGENTS_TOPIC).toBe('string');
    });

    it('should ensure web config has correct types', () => {
      const config = webSchema.parse(mockEnv);
      expect(typeof config.NEXT_PUBLIC_API_BASE).toBe('string');
      // Validate it's actually a URL
      expect(() => new URL(config.NEXT_PUBLIC_API_BASE)).not.toThrow();
    });

    it('should ensure vite config has correct types', () => {
      const config = viteSchema.parse(mockEnv);
      expect(typeof config.VITE_GEMINI_API_KEY).toBe('string');
      expect(typeof config.VITE_GCP_PROJECT_ID).toBe('string');
      expect(typeof config.VITE_FIREBASE_API_KEY).toBe('string');
      expect(typeof config.VITE_FIREBASE_AUTH_DOMAIN).toBe('string');
      expect(typeof config.VITE_FIREBASE_PROJECT_ID).toBe('string');
      expect(typeof config.VITE_FIREBASE_STORAGE_BUCKET).toBe('string');
      expect(typeof config.VITE_FIREBASE_MESSAGING_SENDER_ID).toBe('string');
      expect(typeof config.VITE_FIREBASE_APP_ID).toBe('string');
    });
  });
});