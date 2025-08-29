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
    prefix = "bigquery"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# BigQuery Dataset for Analytics
resource "google_bigquery_dataset" "analytics" {
  dataset_id                  = "analytics"
  friendly_name              = "Analytics Dataset"
  description                = "Dataset for storing analytics data from various sources"
  location                   = var.region
  default_table_expiration_ms = 3600000 # 1 hour

  labels = {
    environment = var.environment
    project     = "dulce-de-saigon"
    managed_by  = "terraform"
  }

  access {
    role          = "OWNER"
    user_by_email = var.data_owner_email
  }

  access {
    role   = "READER"
    domain = var.organization_domain
  }
}

# BigQuery Dataset for Social Media Data
resource "google_bigquery_dataset" "social_media" {
  dataset_id                  = "social_media"
  friendly_name              = "Social Media Dataset"
  description                = "Dataset for storing social media analytics and engagement data"
  location                   = var.region
  default_table_expiration_ms = 7776000000 # 90 days

  labels = {
    environment = var.environment
    project     = "dulce-de-saigon"
    managed_by  = "terraform"
  }

  access {
    role          = "OWNER"
    user_by_email = var.data_owner_email
  }

  access {
    role   = "READER"
    domain = var.organization_domain
  }
}

# BigQuery Dataset for CRM Data
resource "google_bigquery_dataset" "crm" {
  dataset_id                  = "crm"
  friendly_name              = "CRM Dataset"
  description                = "Dataset for storing customer relationship management data"
  location                   = var.region
  default_table_expiration_ms = 31536000000 # 1 year

  labels = {
    environment = var.environment
    project     = "dulce-de-saigon"
    managed_by  = "terraform"
  }

  access {
    role          = "OWNER"
    user_by_email = var.data_owner_email
  }

  access {
    role   = "READER"
    domain = var.organization_domain
  }
}

# BigQuery Dataset for Reviews Data
resource "google_bigquery_dataset" "reviews" {
  dataset_id                  = "reviews"
  friendly_name              = "Reviews Dataset"
  description                = "Dataset for storing customer reviews and feedback data"
  location                   = var.region
  default_table_expiration_ms = 15552000000 # 6 months

  labels = {
    environment = var.environment
    project     = "dulce-de-saigon"
    managed_by  = "terraform"
  }

  access {
    role          = "OWNER"
    user_by_email = var.data_owner_email
  }

  access {
    role   = "READER"
    domain = var.organization_domain
  }
}

# BigQuery Table for Social Media Posts
resource "google_bigquery_table" "social_posts" {
  dataset_id = google_bigquery_dataset.social_media.dataset_id
  table_id   = "posts"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  schema = jsonencode([
    {
      name = "post_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "platform"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "content"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "engagement_metrics"
      type = "RECORD"
      mode = "NULLABLE"
      fields = [
        {
          name = "likes"
          type = "INTEGER"
          mode = "NULLABLE"
        },
        {
          name = "shares"
          type = "INTEGER"
          mode = "NULLABLE"
        },
        {
          name = "comments"
          type = "INTEGER"
          mode = "NULLABLE"
        }
      ]
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "updated_at"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    }
  ])
}

# BigQuery Table for Customer Reviews
resource "google_bigquery_table" "customer_reviews" {
  dataset_id = google_bigquery_dataset.reviews.dataset_id
  table_id   = "customer_reviews"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  schema = jsonencode([
    {
      name = "review_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "customer_id"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "rating"
      type = "INTEGER"
      mode = "REQUIRED"
    },
    {
      name = "review_text"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "sentiment_score"
      type = "FLOAT"
      mode = "NULLABLE"
    },
    {
      name = "source"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    }
  ])
}

# BigQuery Table for CRM Customers
resource "google_bigquery_table" "customers" {
  dataset_id = google_bigquery_dataset.crm.dataset_id
  table_id   = "customers"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }

  schema = jsonencode([
    {
      name = "customer_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "email"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "phone"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "preferences"
      type = "RECORD"
      mode = "NULLABLE"
      fields = [
        {
          name = "language"
          type = "STRING"
          mode = "NULLABLE"
        },
        {
          name = "communication_channel"
          type = "STRING"
          mode = "NULLABLE"
        }
      ]
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "updated_at"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    }
  ])
}

# Data Transfer Service for automated data ingestion (if needed)
resource "google_bigquery_data_transfer_config" "analytics_transfer" {
  count = var.enable_data_transfer ? 1 : 0
  
  display_name   = "Analytics Data Transfer"
  data_source_id = "scheduled_query"
  destination_dataset_id = google_bigquery_dataset.analytics.dataset_id
  
  params = {
    query = "SELECT * FROM `${var.project_id}.social_media.posts` WHERE DATE(created_at) = CURRENT_DATE()"
  }
  
  schedule = "every day 02:00"
}