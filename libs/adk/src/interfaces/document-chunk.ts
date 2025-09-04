/**
 * @fileoverview Document chunk interface
 */

export interface FeatureDetails {
  name: string;
  type: string;
  value: unknown;
}

export interface DocumentChunk {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
  features?: FeatureDetails[];
  embedding?: number[];
}
