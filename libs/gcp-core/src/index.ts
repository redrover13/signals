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

import memoize from 'lodash-es/memoize';

export class GcpInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GcpInitializationError';
  }
}

export const getProjectId = memoize((): string => {
  const projectId = process.env['GCP_PROJECT_ID'];
  if (!projectId) {
    throw new GcpInitializationError(
      'The GCP_PROJECT_ID environment variable is required but was not set. ' +
        'Please ensure it is provided in the runtime environment.',
    );
  }
  return projectId;
});