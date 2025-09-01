/**
 * @fileoverview gcp-secret-manager module for the lib component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export class DulceSecretManager {
  private client: SecretManagerServiceClient;
  private projectId: string;

  constructor(projectId: string) {
    this.client = new SecretManagerServiceClient();
    this.projectId = projectId;
  }

  async getSecret(secretName: string): Promise<string> {
    const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
    
    try {
      const [version] = await this.client.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString() || '';
      return payload;
    } catch (error) {
      console.error(`Error retrieving secret ${secretName}:`, error);
      throw error;
    }
  }

  async createSecret(secretName: string, secretValue: string): Promise<void> {
    const parent = `projects/${this.projectId}`;
    
    try {
      await this.client.createSecret({
        parent,
        secretId: secretName,
        secret: {
          replication: {
            automatic: {},
          },
        },
      });
      
      await this.client.addSecretVersion({
        parent: `${parent}/secrets/${secretName}`,
        payload: {
          data: Buffer.from(secretValue, 'utf8'),
        },
      });
    } catch (error) {
      console.error(`Error creating secret ${secretName}:`, error);
      throw error;
    }
  }
}
