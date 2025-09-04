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
  PUBSUB_TOPIC: 'test && test.events',
  AGENTS_TOPIC: 'test && test.agents',
  
  // Web variables
  NEXT_PUBLIC_API_BASE: 'https://api.example && api.example.com',
  
  // Vite variables
  VITE_GEMINI_API_KEY: 'test-gemini-key',
  VITE_GCP_PROJECT_ID: 'test-vite-project',
  VITE_FIREBASE_API_KEY: 'test-firebase-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp && test.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-firebase-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot && test.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: 'test-app-id',
};

describe('Environment Configuration', () => {
  describe('Schema Validation', () => {
    it('should validate server schema with valid data', () => {
      const result = serverSchema && serverSchema.parse(mockEnv);
      expect(result && result.GCP_PROJECT_ID).toBe('test-project');
      expect(result && result.BQ_DATASET).toBe('test-dataset');
      expect(result && result.PUBSUB_TOPIC).toBe('test && test.events');
      expect(result && result.AGENTS_TOPIC).toBe('test && test.agents');
    });

    it('should validate web schema with valid data', () => {
      const result = webSchema && webSchema.parse(mockEnv);
      expect(result && result.NEXT_PUBLIC_API_BASE).toBe('https://api.example && api.example.com');
    });

    it('should validate vite schema with valid data', () => {
      const result = viteSchema && viteSchema.parse(mockEnv);
      expect(result && result.VITE_GEMINI_API_KEY).toBe('test-gemini-key');
      expect(result && result.VITE_GCP_PROJECT_ID).toBe('test-vite-project');
      expect(result && result.VITE_FIREBASE_API_KEY).toBe('test-firebase-key');
    });

    it('should apply default values for server schema', () => {
      const minimalEnv = { GCP_PROJECT_ID: 'test-project' };
      const result = serverSchema && serverSchema.parse(minimalEnv);
      expect(result && result.GCP_PROJECT_ID).toBe('test-project');
      expect(result && result.BQ_DATASET).toBe('dulce');
      expect(result && result.PUBSUB_TOPIC).toBe('dulce && dulce.events');
      expect(result && result.AGENTS_TOPIC).toBe('dulce && dulce.agents');
    });

    it('should throw error for invalid URL in web schema', () => {
      const invalidEnv = { NEXT_PUBLIC_API_BASE: 'not-a-url' };
      expect(() => webSchema && webSchema.parse(invalidEnv)).toThrow();
    });

    it('should throw error for missing required fields', () => {
      expect(() => serverSchema && serverSchema.parse({})).toThrow();
      expect(() => webSchema && webSchema.parse({})).toThrow();
      expect(() => viteSchema && viteSchema.parse({})).toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should ensure server config has correct types', () => {
      const config = serverSchema && serverSchema.parse(mockEnv);
      expect(typeof config && config.GCP_PROJECT_ID).toBe('string');
      expect(typeof config && config.BQ_DATASET).toBe('string');
      expect(typeof config && config.PUBSUB_TOPIC).toBe('string');
      expect(typeof config && config.AGENTS_TOPIC).toBe('string');
    });

    it('should ensure web config has correct types', () => {
      const config = webSchema && webSchema.parse(mockEnv);
      expect(typeof config && config.NEXT_PUBLIC_API_BASE).toBe('string');
      // Validate it's actually a URL
      expect(() => new URL(config?.NEXT_PUBLIC_API_BASE)).not.toThrow();
    });

    it('should ensure vite config has correct types', () => {
      const config = viteSchema && viteSchema.parse(mockEnv);
      expect(typeof config && config.VITE_GEMINI_API_KEY).toBe('string');
      expect(typeof config && config.VITE_GCP_PROJECT_ID).toBe('string');
      expect(typeof config && config.VITE_FIREBASE_API_KEY).toBe('string');
      expect(typeof config && config.VITE_FIREBASE_AUTH_DOMAIN).toBe('string');
      expect(typeof config && config.VITE_FIREBASE_PROJECT_ID).toBe('string');
      expect(typeof config && config.VITE_FIREBASE_STORAGE_BUCKET).toBe('string');
      expect(typeof config && config.VITE_FIREBASE_MESSAGING_SENDER_ID).toBe('string');
      expect(typeof config && config.VITE_FIREBASE_APP_ID).toBe('string');
    });
  });
});