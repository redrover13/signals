/**
 * @fileoverview Firebase configuration type definitions
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains type definitions for Firebase configurations.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface AgentConfig {
  apiKey: string;
  projectId: string;
  firebaseConfig: FirebaseConfig;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}
