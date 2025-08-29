# Signals Monorepo Architecture

## Overview

This document outlines the architecture of the Signals monorepo, detailing its components, data flows, and key integrations. The system is designed to ingest data from various sources, process it, and leverage AI agents to provide insights and actions through a user-friendly frontend.

## Data Flow Diagram

```
+-----------------+
| Data Sources    |
| (GA4, CRM,      |
| Social, CMS)    |
+--------+--------+
         |
         v
+--------+--------+
| Google Cloud    |
| Pub/Sub         |
+--------+--------+
         |
         v
+--------+--------+
| Cloud Functions |
| (Social API,    |
| CRM API,        |
| CMS API,        |
| Reviews API)    |
+--------+--------+
         |
         v
+--------+--------+
| BigQuery        |
| (Raw Data,      |
| Transformed Data)|
+--------+--------+
         |
         v
+--------+--------+
| dbt Models      |
| (Transformations)|
+--------+--------+
         |
         v
+--------+--------+
| AI Agents       |
| (BQ Agent,      |
| Looker Agent,   |
| CRM Agent,      |
| Content Agent,  |
| Reviews Agent)  |
+--------+--------+
         |
         v
+--------+--------+
| Gemini          |
| Orchestrator    |
+--------+--------+
         |
         v
+--------+--------+
| Frontend Agents |
| (Next.js UI)    |
+--------+--------+
```

## System Components

### Data Ingestion

*   **GA4 Exports**: Data from Google Analytics 4 is exported to BigQuery.
*   **CRM Systems**: Data from CRM platforms is ingested via dedicated APIs.
*   **Social Media Platforms**: Data from social media is ingested via dedicated APIs.
*   **CMS Platforms**: Data from Content Management Systems is ingested via dedicated APIs.
*   **Google Cloud Pub/Sub**: Acts as a messaging backbone for event-driven ingestion and inter-service communication.

### Data Transformation

*   **BigQuery**: Central data warehouse for raw and transformed data.
*   **dbt Models**: Used for defining and executing data transformations within BigQuery, ensuring data quality and consistency.

### AI Agents & Orchestration

*   **BQ Agent**: Interacts with BigQuery for data retrieval and analysis.
*   **Looker Agent**: Integrates with Looker for reporting and dashboarding.
*   **CRM Agent**: Interacts with CRM systems for data updates and actions.
*   **Content Agent**: Manages and interacts with content platforms.
*   **Reviews Agent**: Handles and analyzes customer reviews.
*   **Gemini Orchestrator**: Coordinates the execution and interaction of various AI agents, leveraging Google Gemini for advanced reasoning and decision-making.

### Frontend

*   **Frontend Agents (Next.js)**: The user interface for interacting with the AI agents and visualizing insights.

### CI/CD & Operations

*   **GitHub Actions / Google Cloud Build**: Automated pipelines for continuous integration and continuous deployment.
*   **Terraform**: Infrastructure as Code for managing GCP resources (BigQuery, Cloud Functions, Vertex AI Agents, Looker).
*   **Google Cloud Workflows**: Orchestrates complex sequences of microservices and API calls.
*   **Google Secret Manager**: Securely stores and manages sensitive information like API keys and credentials.
*   **Google IAM**: Manages access control and permissions across GCP resources.

## Document Owner

This document is owned by `garretnelson368@gmail.com`.
