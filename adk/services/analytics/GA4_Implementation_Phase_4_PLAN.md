# GA4 Implementation Phase 4 - Implementation Plan

**Project:** `saigon-signals`  
**Phase:** 4 - Automation, Operations & Expansion  
**Status:** In Progress

This implementation plan outlines the remaining steps to complete Phase 4, building upon the dbt project structure that has already been created.

## Current State

✅ **Completed:**
- dbt project initialized at `adk/services/analytics/dbt/`
- Basic `dbt_project.yml` configuration with staging and marts materialization settings
- `profiles.yml` created with dev environment configuration
- `packages.yml` corrected with proper dbt-labs/dbt-ga4 package reference

## Implementation Tasks

### 1. BigQuery Data Transformation Setup

#### 1.1 Complete dbt Project Configuration

**Task:** Finalize dbt project setup and directory structure

- [ ] Create missing directory structure:
  ```
  adk/services/analytics/dbt/
  ├── models/
  │   ├── staging/
  │   │   └── ga4/
  │   │       ├── _ga4__sources.yml
  │   │       ├── stg_ga4__events.sql
  │   │       └── stg_ga4__event_params.sql
  │   ├── intermediate/
  │   │   └── int_sessions__grouped.sql
  │   └── marts/
  │       ├── fact_sessions.sql
  │       └── dim_users.sql
  ├── macros/
  │   └── get_custom_dimensions.sql
  ├── tests/
  │   └── assert_sessions_have_duration.sql
  └── seeds/
      └── event_categories.csv
  ```

- [ ] Update `dbt_project.yml` to include:
  - GA4 source configuration
  - Model-specific configurations
  - Variable definitions for GA4 dataset names

- [ ] Create `.gitignore` for dbt-specific files:
  ```
  target/
  dbt_packages/
  logs/
  profiles.yml
  ```

#### 1.2 Configure BigQuery Sources

**Task:** Define GA4 data sources in dbt

- [ ] Create `models/staging/ga4/_ga4__sources.yml`:
  ```yaml
  version: 2
  
  sources:
    - name: ga4
      database: saigon-signals
      schema: analytics_XXXXXXXXX  # GA4 property ID
      tables:
        - name: events_*
          identifier: events_*
          description: "Raw GA4 events table"
        - name: events_intraday_*
          identifier: events_intraday_*
          description: "Intraday GA4 events table"
  ```

#### 1.3 Implement Staging Models

**Task:** Create staging layer models for GA4 data

- [ ] Implement `stg_ga4__events.sql` using dbt-ga4 package macros
- [ ] Implement `stg_ga4__event_params.sql` for unnested parameters
- [ ] Add data quality tests for staging models

#### 1.4 Implement Core Analytics Models

**Task:** Create business-facing marts models

- [ ] Implement `fact_sessions.sql` with:
  - Session identification logic
  - Duration calculations
  - Landing page and referrer extraction
  - Event aggregations

- [ ] Implement `dim_users.sql` with:
  - User pseudo ID mapping
  - First seen/last seen timestamps
  - User properties aggregation
  - Device and geo information

- [ ] Create `intermediate/int_sessions__grouped.sql` for complex session logic

#### 1.5 Add Data Quality Tests

**Task:** Implement comprehensive dbt tests

- [ ] Create schema tests in model YAML files:
  - Uniqueness tests for primary keys
  - Not null tests for required fields
  - Accepted values tests for categorical fields
  - Relationship tests between fact and dimension tables

- [ ] Create custom tests:
  - Session duration reasonability checks
  - Event timestamp sequence validation
  - Data freshness tests

### 2. CI/CD Pipeline Implementation

#### 2.1 Create GitHub Actions Workflow

**Task:** Implement analytics CI/CD pipeline

- [ ] Create `.github/workflows/analytics-pipeline.yml`:
  ```yaml
  name: Analytics CI/CD Pipeline
  
  on:
    pull_request:
      paths:
        - 'adk/**'
    push:
      branches:
        - main
      paths:
        - 'adk/**'
  ```

- [ ] Implement pipeline stages:
  1. **Lint & Validate Stage:**
     - YAML/JSON linting with `yamllint`
     - SQL linting with `sqlfluff`
     - dbt parse validation
  
  2. **Test Stage:**
     - dbt compile
     - dbt test on sample data
  
  3. **Deploy Staging Stage:**
     - dbt run --target staging
     - GA4 configuration sync to staging property
  
  4. **Integration Test Stage:**
     - Query validation scripts
     - End-to-end event verification
  
  5. **Manual Approval Stage:**
     - GitHub environment protection rules
     - Required reviewers configuration
  
  6. **Deploy Production Stage:**
     - dbt run --target prod
     - GA4 configuration sync to production property

#### 2.2 Configure Secrets and Service Accounts

**Task:** Set up secure authentication for CI/CD

- [ ] Create dedicated service accounts:
  - `analytics-ci-staging@saigon-signals.iam.gserviceaccount.com`
  - `analytics-ci-prod@saigon-signals.iam.gserviceaccount.com`

- [ ] Configure GitHub secrets:
  - `DBT_STAGING_KEYFILE`
  - `DBT_PROD_KEYFILE`
  - `GA4_STAGING_PROPERTY_ID`
  - `GA4_PROD_PROPERTY_ID`

- [ ] Update `profiles.yml` template for CI/CD environments

#### 2.3 Create Testing Infrastructure

**Task:** Implement automated testing scripts

- [ ] Create `adk/services/analytics/scripts/test_staging_models.sh`:
  - Query row counts for all models
  - Validate data freshness
  - Check for null values in critical fields

- [ ] Create `adk/services/analytics/scripts/validate_ga4_sync.py`:
  - Verify custom dimensions are created
  - Check audience configurations
  - Validate conversion events

### 3. Documentation and Monitoring

#### 3.1 Generate dbt Documentation

**Task:** Set up automated documentation generation

- [ ] Configure dbt docs generation in CI/CD
- [ ] Create model descriptions in YAML files
- [ ] Document business logic and assumptions
- [ ] Set up GitHub Pages for documentation hosting

#### 3.2 Implement Monitoring and Alerting

**Task:** Create operational monitoring

- [ ] Create BigQuery scheduled queries for:
  - Data freshness monitoring
  - Model execution time tracking
  - Data quality metrics

- [ ] Set up Cloud Monitoring alerts for:
  - dbt run failures
  - Data freshness violations
  - Anomaly detection in key metrics

### 4. Future Roadmap Preparation

#### 4.1 Looker Studio Integration

**Task:** Prepare for BI-as-code implementation

- [ ] Create `adk/services/analytics/looker-studio/` directory structure
- [ ] Document Looker Studio API requirements
- [ ] Design JSON schema for report configurations

#### 4.2 GTM Automation Foundation

**Task:** Prepare for GTM configuration-as-code

- [ ] Create `adk/services/analytics/gtm/` directory structure
- [ ] Research GTM API capabilities and limitations
- [ ] Design YAML schema for tag configurations

#### 4.3 Cloud Functions Library

**Task:** Establish foundation for reusable functions

- [ ] Create `adk/services/functions/` directory structure
- [ ] Define standard function templates
- [ ] Document deployment patterns

## Implementation Timeline

**Week 1-2:** Complete dbt project setup and core models  
**Week 3:** Implement CI/CD pipeline and testing  
**Week 4:** Documentation, monitoring, and future roadmap preparation

## Success Criteria

1. All dbt models successfully run and pass tests
2. CI/CD pipeline automatically deploys changes to staging and production
3. Documentation is automatically generated and accessible
4. Monitoring alerts are configured and operational
5. Foundation is laid for future roadmap items

## Dependencies

- BigQuery datasets created (staging and production)
- Service accounts with appropriate permissions
- GA4 staging property configured
- GitHub repository access and secrets management

## Risk Mitigation

1. **Data Quality Issues:** Implement comprehensive testing at each layer
2. **Pipeline Failures:** Use retry logic and detailed error reporting
3. **Permission Issues:** Document all required IAM roles clearly
4. **Breaking Changes:** Use semantic versioning for models and careful migration strategies

---

This plan provides a clear path to complete Phase 4 implementation, transforming raw GA4 data into business-ready analytics assets with robust automation and operational excellence.