# GA4 Implementation Plan: Phase 3 - Advanced Data Enrichment & AI/ML Integration

This document outlines the third phase of the GA4 implementation, focusing on leveraging the established data foundation to enable advanced analytics, automation, and AI/ML-powered insights.

**Project:** `saigon-signals`

## 1. Enabling Advanced APIs

To support advanced data operations and AI/ML integration, the following Google Cloud APIs must be enabled for the `saigon-signals` project. These APIs provide the necessary programmatic access to Google Analytics data and Google Cloud's powerful machine learning and data processing services.

### API Enablement Commands

Execute the following commands to enable the required APIs:

```bash
# Core Data APIs
gcloud services enable analyticsdata.googleapis.com --project=saigon-signals
gcloud services enable analyticsadmin.googleapis.com --project=saigon-signals

# AI/ML Support APIs
gcloud services enable aiplatform.googleapis.com --project=saigon-signals
gcloud services enable language.googleapis.com --project=saigon-signals
gcloud services enable discoveryengine.googleapis.com --project=saigon-signals
gcloud services enable translate.googleapis.com --project=saigon-signals

# Suggested Additional APIs for Automation and Data Serving
gcloud services enable bigquerydataconnector.googleapis.com --project=saigon-signals
gcloud services enable cloudfunctions.googleapis.com --project=saigon-signals
gcloud services enable run.googleapis.com --project=saigon-signals
gcloud services enable cloudscheduler.googleapis.com --project=saigon-signals
```

### API Justifications

| API Name | Justification |
| :--- | :--- |
| **Google Analytics Data API** | Provides programmatic access to GA4 report data, enabling custom dashboards and data applications. |
| **Google Analytics Admin API**| Allows for programmatic management of GA4 properties, including custom dimensions, metrics, and audiences. Essential for "configuration as code". |
| **Vertex AI API** | The gateway to Google Cloud's unified AI platform. Used for training, deploying, and managing custom and pre-trained ML models. |
| **Cloud Natural Language API** | Provides pre-trained models for sentiment analysis, entity recognition, and syntax analysis on text data from event parameters. |
| **Recommendations AI API** | Enables the creation of personalized recommendation systems based on user behavior data collected in GA4. |
| **Cloud Translation API**       | Useful for processing user-generated content in multiple languages, standardizing it for analysis. |
| **BigQuery Data-QnA API**     | Allows natural language querying of BigQuery datasets, enabling business users to self-serve insights. |
| **Cloud Functions API**       | Enables event-driven automation, such as triggering scripts in response to new data in BigQuery or Cloud Storage. |
| **Cloud Run API**             | Provides a platform for deploying and scaling containerized applications, such as the GA4 Admin API automation script. |
| **Cloud Scheduler API**       | Used for scheduling recurring jobs, like running the BigQuery queries for user segmentation or triggering the Admin API script. |

---

## 2. Custom Dimensions & Audiences as Code

To ensure that our GA4 configuration is version-controlled, repeatable, and aligned with our analytics taxonomy, we will manage custom definitions and audiences as code within the ADK.

### Process Overview

1.  **Define Schema:** Custom dimensions, metrics, and audiences will be defined in YAML or JSON files stored in the `/adk/services/analytics/ga4-definitions/` directory.
2.  **Version Control:** These configuration files will be committed to the Git repository, providing a full history of changes.
3.  **Automated Sync:** A script will read these files and use the Google Analytics Admin API to create or update the corresponding resources in the GA4 property.
4.  **CI/CD Integration:** This script will be integrated into the CI/CD pipeline, running automatically upon changes to the definition files in the `main` branch.

### Sample Implementation (Python)

This sample script demonstrates how to read a YAML file and create a custom dimension using the GA4 Admin API.

**File Structure:**
```
adk/
└── services/
    └── analytics/
        └── ga4-definitions/
            ├── custom-dimensions.yaml
            └── audiences.yaml
        └── scripts/
            └── sync-ga4-definitions.py
```

**`adk/services/analytics/ga4-definitions/custom-dimensions.yaml`:**
```yaml
custom_dimensions:
  - display_name: "User Level"
    parameter_name: "user_level"
    description: "The calculated level of the user based on engagement."
    scope: "USER"
  - display_name: "Comment Sentiment"
    parameter_name: "comment_sentiment"
    description: "The sentiment of a user's comment (Positive, Negative, Neutral)."
    scope: "EVENT"
```

**`adk/services/analytics/scripts/sync-ga4-definitions.py` (Pseudo-code/Python):**
```python
import yaml
from google.analytics.admin import AnalyticsAdminServiceClient
from google.analytics.admin_v1alpha.types import CustomDimension

# Configuration
GA4_PROPERTY_ID = "YOUR_GA4_PROPERTY_ID" # e.g., "123456789"
CONFIG_FILE_PATH = "../ga4-definitions/custom-dimensions.yaml"

def sync_custom_dimensions():
    """Reads dimension definitions and syncs them with the GA4 property."""
    
    client = AnalyticsAdminServiceClient()
    parent = f"properties/{GA4_PROPERTY_ID}"

    with open(CONFIG_FILE_PATH, 'r') as f:
        config = yaml.safe_load(f)

    for dim in config.get('custom_dimensions', []):
        print(f"Processing dimension: {dim['display_name']}")

        # Here you would add logic to check if the dimension already exists
        # and update it if necessary. For simplicity, this example just creates them.

        custom_dimension = CustomDimension(
            parent=parent,
            display_name=dim['display_name'],
            parameter_name=dim['parameter_name'],
            description=dim.get('description', ''),
            scope=CustomDimension.DimensionScope[dim['scope']]
        )

        try:
            response = client.create_custom_dimension(
                parent=parent,
                custom_dimension=custom_dimension
            )
            print(f"Successfully created dimension: {response.name}")
        except Exception as e:
            # Handle cases where the dimension might already exist (e.g., AlreadyExists error)
            print(f"Error creating dimension '{dim['display_name']}': {e}")

if __name__ == "__main__":
    sync_custom_dimensions()
```

### CI/CD Workflow Integration

The `sync-ga4-definitions.py` script can be containerized and run as a step in a Cloud Build pipeline.

```yaml
# cloudbuild.yaml (partial)
steps:
- name: 'gcr.io/cloud-builders/gcloud'
  id: 'Auth'
  entrypoint: 'bash'
  args:
    - '-c'
    - 'gcloud auth application-default login'

- name: 'python:3.9'
  id: 'Sync GA4 Definitions'
  entrypoint: 'pip'
  args:
    - 'install'
    - '-r'
    - 'adk/services/analytics/scripts/requirements.txt'
    - '&&'
    - 'python'
    - 'adk/services/analytics/scripts/sync-ga4-definitions.py'
  # This step would only run on changes to the 'adk/services/analytics/ga4-definitions/' path
```

---

## 3. Initial AI-Powered Insights Project

To demonstrate the value of the integrated data, we propose a starter project that analyzes user comments for sentiment.

**Goal:** Identify user sentiment from `comment` events and use this to create a "High-Value Feedback" audience.

### Workflow Outline

1.  **Data Preparation (BigQuery SQL):** A scheduled query will run daily to unnest GA4 event data, specifically looking for events named `post_comment`.
2.  **Sentiment Analysis (Vertex AI):** The query will pass the comment text to a Vertex AI pre-trained Natural Language model to analyze sentiment.
3.  **Store Results:** The results (user ID, comment, sentiment score, sentiment magnitude) will be stored in a new BigQuery table.
4.  **Audience Creation:** This new table can then be used as a basis for building new audiences in GA4, either manually or via the Admin API.

### Sample BigQuery SQL for Data Prep & Vertex AI Call

This query prepares the data and uses `ML.PREDICT` to call a remote Vertex AI model.

> **Note:** This requires a BigQuery connection to Vertex AI to be configured first, and a remote model to be created in BigQuery that points to the `language.googleapis.com` service.

```sql
-- Step 1: Create a permanent table to store results
CREATE OR REPLACE TABLE `saigon-signals.analytics_derived.user_comment_sentiment` AS

-- Step 2: Select, unnest, and predict sentiment
SELECT
    user_pseudo_id,
    event_timestamp,
    -- Find the 'comment_text' parameter value
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'comment_text') AS comment_text,
    -- Find the 'page_location' parameter value
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
    -- Call the Vertex AI model for sentiment analysis
    ml_predict_result.document_sentiment.score AS sentiment_score,
    ml_predict_result.document_sentiment.magnitude AS sentiment_magnitude
FROM
    `saigon-signals.analytics_YOUR_PROPERTY_ID.events_*`, -- Replace with your actual table
    UNNEST(ML.PREDICT(
        MODEL `saigon-signals.analytics_derived.sentiment_analysis_model`, -- This is the remote model in BQ
        (SELECT (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'comment_text'))
    )) AS ml_predict_result
WHERE
    event_name = 'post_comment'
    AND _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
                          AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY));

```
This plan provides a clear, actionable roadmap for implementing Phase 3. The next steps will involve executing these commands, developing the Python script, and setting up the required BigQuery and Vertex AI resources.