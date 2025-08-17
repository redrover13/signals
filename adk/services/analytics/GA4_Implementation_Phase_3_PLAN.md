# GA4 Implementation Plan: Phase 3 - Technical Task Checklist

This document provides a detailed checklist of technical subtasks required to implement Phase 3 of the GA4 Implementation plan.

## 1. Environment Setup: Enable Advanced APIs

Execute the following `gcloud` commands to enable the necessary APIs for the `saigon-signals` project.

### Subtasks:

- [ ] **Enable Core Data APIs:**
  - [ ] `gcloud services enable analyticsdata.googleapis.com --project=saigon-signals`
  - [ ] `gcloud services enable analyticsadmin.googleapis.com --project=saigon-signals`

- [ ] **Enable AI/ML Support APIs:**
  - [ ] `gcloud services enable aiplatform.googleapis.com --project=saigon-signals`
  - [ ] `gcloud services enable language.googleapis.com --project=saigon-signals`
  - [ ] `gcloud services enable discoveryengine.googleapis.com --project=saigon-signals`
  - [ ] `gcloud services enable translate.googleapis.com --project=saigon-signals`

- [ ] **Enable Automation and Data Serving APIs:**
  - [ ] `gcloud services enable bigquerydataconnector.googleapis.com --project=saigon-signals`
  - [ ] `gcloud services enable cloudfunctions.googleapis.com --project=saigon-signals`
  - [ ] `gcloud services enable run.googleapis.com --project=saigon-signals`
  - [ ] `gcloud services enable cloudscheduler.googleapis.com --project=saigon-signals`

---

## 2. Configuration as Code: Custom Dimensions & Audiences

Implement a system to manage GA4 custom definitions and audiences as version-controlled code.

### Subtasks:

- [ ] **Create Directory Structure:**
  - [ ] Create directory `adk/services/analytics/ga4-definitions/`
  - [ ] Create directory `adk/services/analytics/scripts/`

- [ ] **Define GA4 Configurations in YAML:**
  - [ ] Create and populate `adk/services/analytics/ga4-definitions/custom-dimensions.yaml` with initial dimension definitions (`User Level`, `Comment Sentiment`).
  - [ ] Create `adk/services/analytics/ga4-definitions/audiences.yaml` (to be populated later).

- [ ] **Develop Synchronization Script:**
  - [ ] Create the Python script `adk/services/analytics/scripts/sync-ga4-definitions.py`.
  - [ ] Implement logic to read `custom-dimensions.yaml`.
  - [ ] Add `google-analytics-admin` to a `requirements.txt` file in the same directory.
  - [ ] Implement GA4 Admin API calls to create custom dimensions.
  - [ ] **(Stretch Goal)** Add logic to check if a dimension already exists to prevent errors.
  - [ ] **(Stretch Goal)** Extend the script to handle audiences defined in `audiences.yaml`.

- [ ] **Integrate with CI/CD (Cloud Build):**
  - [ ] Update `cloudbuild.yaml` to include a new step for syncing GA4 definitions.
  - [ ] Configure the step to authenticate with Google Cloud.
  - [ ] Add commands to install Python dependencies from `requirements.txt`.
  - [ ] Add the command to execute `sync-ga4-definitions.py`.
  - [ ] Configure the build trigger to run this step only when files in `adk/services/analytics/ga4-definitions/` are changed.

---

## 3. AI-Powered Insights: User Comment Sentiment Analysis

Build a pipeline to analyze user comments for sentiment and store the results for audience creation.

### Subtasks:

- [ ] **Configure BigQuery-Vertex AI Integration:**
  - [ ] Create a BigQuery connection to Vertex AI in the `saigon-signals` project.
  - [ ] Create a remote model in BigQuery (`analytics_derived.sentiment_analysis_model`) that points to the pre-trained Natural Language API (`language.googleapis.com`).

- [ ] **Develop and Schedule BigQuery SQL Workflow:**
  - [ ] Create the `analytics_derived.user_comment_sentiment` table in BigQuery to store the output.
  - [ ] Develop the SQL query to unnest `post_comment` events from the raw GA4 data table.
  - [ ] Integrate the `ML.PREDICT` function call into the query to pass comment text to the sentiment analysis model.
  - [ ] Replace placeholder `analytics_YOUR_PROPERTY_ID` with the correct GA4 export table name.
  - [ ] Set up a Cloud Scheduler job to run the SQL query daily.

- [ ] **Create "High-Value Feedback" Audience:**
  - [ ] Use the `analytics_derived.user_comment_sentiment` table as a data source to build a new audience in the GA4 UI or via the Admin API.
  - [ ] Define audience criteria (e.g., `sentiment_score > 0.7` and `sentiment_magnitude > 0.8`).