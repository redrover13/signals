# GA4 Implementation Plan: Phase 2 - Technical Task List

This document provides a detailed, actionable checklist for completing Phase 2 of the GA4 implementation. It is derived from the official plan and is designed for engineering execution.

---

### Phase 2 Implementation Checklist

#### 1. Foundational Event Taxonomy & Tracking Setup

-   [ ] **Task 1.1: Implement Web Event Tracking Utility**
    -   **File:** `apps/web/site/components/Track.tsx`
    -   **Action:** Create or update the `trackEvent` utility function as specified in the plan. This function will wrap `window.gtag` calls to standardize event tracking.
    -   **Acceptance Criteria:** The `trackEvent` function is available for use in the web application and correctly sends events to GA4.

-   [ ] **Task 1.2: Implement iOS Analytics Manager**
    -   **File:** `AnalyticsManager.swift`
    -   **Action:** Create a centralized `AnalyticsManager` class using the singleton pattern to wrap the Firebase SDK's `Analytics.logEvent` method.
    -   **Acceptance Criteria:** The `AnalyticsManager.shared.logEvent` method is available and correctly logs events to Firebase Analytics.

-   [ ] **Task 1.3: Implement Android Analytics Manager**
    -   **File:** `AnalyticsManager.kt`
    -   **Action:** Create a centralized `AnalyticsManager` class to wrap the Firebase SDK's `logEvent` method.
    -   **Acceptance Criteria:** The `AnalyticsManager` class is implemented and correctly logs events to Firebase Analytics.

-   [ ] **Task 1.4: Integrate Foundational Event Tracking**
    -   **Action:** Instrument the following core events using the newly created utilities in their respective platforms (Web, iOS, Android):
        -   [ ] `page_view`
        -   [ ] `login`
        -   [ ] `sign_up`
        -   [ ] `purchase`
        -   [ ] `form_submission`
    -   **Acceptance Criteria:** All foundational events are tracked with the correct parameters as defined in the `event-taxonomy.yaml`.

---

#### 2. BigQuery Integration

-   [ ] **Task 2.1: Link GA4 Properties to BigQuery**
    -   **Action:** Manually link the Dev, Staging, and Production GA4 properties to their corresponding BigQuery projects.
    -   **Guidance:** Follow the recommended UI method: `Admin > Property > Product Links > BigQuery Linking`.
    -   **Acceptance Criteria:** Data from GA4 starts populating in the corresponding `analytics_<GA4_PROPERTY_ID>` BigQuery datasets.

-   [ ] **Task 2.2: Create BigQuery Link Verification Script**
    -   **File:** `adk/services/analytics/scripts/verify_bigquery_link.sh`
    -   **Action:** Create the shell script as defined in the plan to verify the existence of the BigQuery dataset and `events_` tables.
    -   **Acceptance Criteria:** The script runs successfully and exits with status `0` when a valid BigQuery link is detected.

---

#### 3. CI/CD Stage Gate for Analytics

-   [ ] **Task 3.1: Develop Staging Event Check Script**
    -   **File:** `adk/services/analytics/scripts/check_staging_events.sh`
    -   **Action:** Create the shell script designed to query the `events_intraday_` table in BigQuery for a specific test event (`ci_stage_gate_check`).
    -   **Acceptance Criteria:** The script can successfully poll BigQuery and exit with status `0` upon finding the specified event within the timeout period.

-   [ ] **Task 3.2: Implement Test Event Endpoint in Staging**
    -   **Action:** Create a secure endpoint or mechanism in the staging environment that, when triggered, sends the `ci_stage_gate_check` event to GA4. This event must include a unique `ci_run_id` parameter.
    -   **Acceptance Criteria:** The staging application reliably sends the test event upon invocation.

-   [ ] **Task 3.3: Configure CI/CD Pipeline**
    -   **File:** `cloudbuild.yaml` (or relevant CI/CD configuration file)
    -   **Action:** Add a new `verify_analytics_tracking` stage to the CI pipeline that runs on Pull Requests targeting `main`. This stage will:
        1.  Trigger the test event in the staging environment.
        2.  Execute the `check_staging_events.sh` script.
    -   **Acceptance Criteria:** The CI pipeline blocks PR merges if the `check_staging_events.sh` script fails (exits with a non-zero status).