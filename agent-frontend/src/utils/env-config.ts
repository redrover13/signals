/**
 * @fileoverview Environment configuration utility
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Centralizes environment variable management.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { AgentConfig } from './types/firebase';

/**
 * Gets environment variables with fallbacks
 * @param key - Environment variable key
 * @param fallback - Fallback value if environment variable is not set
 * @returns The environment variable value or fallback
 */
export const getEnvVar = (key: string, fallback: string = ''): string => {
  return import.meta.env[key] || process.env[key] || fallback;
};

/**
 * Gets agent configuration from environment variables
 * @returns Agent configuration object
 */
export const getAgentConfig = (): AgentConfig => {
  return {
    apiKey: getEnvVar('VITE_GEMINI_API_KEY', 'your-gemini-api-key'),
    projectId: getEnvVar('VITE_GCP_PROJECT_ID', 'your-gcp-project'),
    firebaseConfig: {
      apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'your-firebase-api-key'),
      authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'your-project.firebaseapp.com'),
      projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'your-firebase-project'),
      storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'your-project.appspot.com'),
      messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789'),
      appId: getEnvVar('VITE_FIREBASE_APP_ID', 'your-app-id')
    }
  };
};

/**
 * Checks if the application is running in development mode
 * @returns True if running in development mode
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || process.env.NODE_ENV === 'development';
};

/**
 * Checks if the application is running in production mode
 * @returns True if running in production mode
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD || process.env.NODE_ENV === 'production';
};
