variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "asia-southeast1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "chunk_size" {
  description = "Size of document chunks for embedding"
  type        = number
  default     = 1000
}

variable "chunk_overlap" {
  description = "Overlap between document chunks"
  type        = number
  default     = 200
}

variable "embedding_model" {
  description = "Vertex AI embedding model to use"
  type        = string
  default     = "textembedding-gecko@003"
}

variable "max_concurrent_processing" {
  description = "Maximum number of concurrent document processing instances"
  type        = number
  default     = 10
}