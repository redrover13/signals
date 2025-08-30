terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    bucket = "saigon-signals-terraform-state"
    prefix = "main"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ============================================================================
# CORE INFRASTRUCTURE MODULE
# ============================================================================

# Deploy core infrastructure
module "core_infrastructure" {
  source = "./core-infrastructure"
  
  project_id   = var.project_id
  region       = var.region
  environment  = var.environment
  
  data_owner_email    = var.data_owner_email
  organization_domain = var.organization_domain
  create_github_sa    = var.create_github_sa
  
  table_expiration_days = var.table_expiration_days
  enable_monitoring     = var.enable_monitoring
  
  labels = var.labels
}

# ============================================================================
# LEGACY MODULES (for backwards compatibility)
# ============================================================================

# BigQuery module (now consolidated in core infrastructure)
module "bigquery" {
  source = "./bigquery"
  
  project_id = var.project_id
  region     = var.region
  environment = var.environment
  
  data_owner_email     = var.data_owner_email
  organization_domain  = var.organization_domain
  enable_data_transfer = false
  
  # Disable to avoid conflicts with core infrastructure
  count = var.enable_legacy_modules ? 1 : 0
}

# Functions module
module "functions" {
  source = "./functions"
  
  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  
  # Disable to avoid conflicts with core infrastructure
  count = var.enable_legacy_modules ? 1 : 0
}

# Vertex Agents module
module "vertex_agents" {
  source = "./vertex-agents"
  
  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  
  # Disable to avoid conflicts with core infrastructure
  count = var.enable_legacy_modules ? 1 : 0
}

# Looker module
module "looker" {
  source = "./looker"
  
  project_id  = var.project_id
  region      = var.region
  environment = var.environment
  
  # Disable to avoid conflicts with core infrastructure
  count = var.enable_legacy_modules ? 1 : 0
}