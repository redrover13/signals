/**
 * @fileoverview Database services module index
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Exports all database service modules.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Export Firestore service
export * from './firestore';

// Export BigQuery service
export * from './bigquery';

// Export factory function for creating appropriate database service
import { FirestoreService, FirestoreConfig } from './firestore';
import { BigQueryService, BigQueryConfig } from './bigquery';

/**
 * Database service type
 */
export enum DatabaseServiceType {
  FIRESTORE = 'firestore',
  BIG_QUERY = 'bigquery'
}

/**
 * Create a database service of the specified type
 * @param type Database service type
 * @param config Configuration for the service
 * @returns Database service instance
 */
export function createDatabaseService(
  type: DatabaseServiceType,
  config: FirestoreConfig | BigQueryConfig
) {
  switch (type) {
    case DatabaseServiceType.FIRESTORE:
      return new FirestoreService(config as FirestoreConfig);
    case DatabaseServiceType.BIG_QUERY:
      return new BigQueryService(config as BigQueryConfig);
    default:
      throw new Error(`Unsupported database service type: ${type}`);
  }
}
