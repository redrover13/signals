/**
 * @fileoverview Embedding configuration interface
 */

export interface EmbeddingConfig {
  /**
   * The model to use for embeddings
   * @default 'textembedding-gecko'
   */
  model?: string;
  
  /**
   * Task type for the embedding
   * @default 'RETRIEVAL_QUERY'
   */
  taskType?: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' | 'SEMANTIC_SIMILARITY' | 'CLASSIFICATION' | 'CLUSTERING';
  
  /**
   * Whether to truncate input that exceeds the model's maximum input token limit
   * @default true
   */
  truncate?: boolean;
  
  /**
   * The dimensionality of the generated embeddings
   */
  dimensions?: number;
}
