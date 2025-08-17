# -*- coding: utf-8 -*-
#
# Copyright 2024 Dulce de Saigon. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""End-to-end test for the agent data processing workflow.

This script validates the entire pipeline from event ingestion via Pub/Sub
to data verification in BigQuery, ensuring the `event-parser` Cloud Function
works as expected.

**Workflow:**
1.  A sample agent event is created with a unique `event_id`.
2.  The event is published to the `raw-agent-events` Pub/Sub topic.
3.  The script polls the `processed_events` BigQuery table.
4.  It queries for the row matching the unique `event_id`.
5.  It asserts that the data in BigQuery matches the original payload.
"""

import json
import os
import time
import uuid
from datetime import datetime, timezone

from google.api_core import exceptions
from google.cloud import bigquery, pubsub_v1

# --- Configuration ---
# GCP Project and resource identifiers.
# These are expected to be configured in the environment.
PROJECT_ID = os.environ.get("GCP_PROJECT", "saigon-signals")
TOPIC_ID = "dulce.agents"
DATASET_ID = "dulce"
TABLE_ID = "agent_runs"

# Test configurations
POLLING_TIMEOUT_SECONDS = 60
POLLING_INTERVAL_SECONDS = 5


def generate_sample_payload() -> tuple[dict, str]:
    """Generates a realistic sample agent event payload with a unique ID.

    Returns:
        A tuple containing the event payload dictionary and the unique event_id.
    """
    event_id = str(uuid.uuid4())
    payload = {
        "event_id": event_id,
        "agent_id": f"test_agent_{uuid.uuid4()}",
        "session_id": f"test_session_{uuid.uuid4()}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "e2e_test_event",
        "data": {"test_run_id": event_id, "source": "e2e_workflow.py"},
    }
    print(f"Generated sample payload with event_id: {event_id}")
    return payload, event_id


def publish_event(
    publisher_client: pubsub_v1.PublisherClient, topic_path: str, payload: dict
) -> str:
    """Publishes a single event to the specified Pub/Sub topic.

    Args:
        publisher_client: An initialized Pub/Sub publisher client.
        topic_path: The full path of the topic to publish to.
        payload: The JSON payload to publish.

    Returns:
        The message ID of the published message.

    Raises:
        TimeoutError: If the message fails to publish within the timeout.
    """
    data = json.dumps(payload).encode("utf-8")
    try:
        future = publisher_client.publish(topic_path, data)
        # Wait for the publish call to complete and get the message ID.
        message_id = future.result(timeout=30)
        print(f"Successfully published message {message_id} to {topic_path}.")
        return message_id
    except exceptions.GoogleAPICallError as e:
        print(f"Error: Failed to publish to Pub/Sub topic {topic_path}: {e}")
        raise
    except TimeoutError:
        print("Error: Publishing to Pub/Sub timed out.")
        raise


def verify_event_in_bigquery(
    bigquery_client: bigquery.Client, event_id: str, original_payload: dict
) -> bool:
    """Polls BigQuery to verify the event was processed and inserted correctly.

    This function continuously queries BigQuery for a specific `event_id` until
    it is found or a timeout is reached. It then validates the retrieved data
    against the original payload.

    Args:
        bigquery_client: An initialized BigQuery client.
        event_id: The unique ID of the event to query for.
        original_payload: The original payload that was sent.

    Returns:
        True if the event is found and the data matches, False otherwise.
    """
    query = f"""
        SELECT
            event_id,
            agent_id,
            session_id,
            timestamp
        FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
        WHERE event_id = '{event_id}'
        LIMIT 1
    """
    print(f"\nPolling BigQuery for event_id: {event_id}...")
    start_time = time.time()

    while time.time() - start_time < POLLING_TIMEOUT_SECONDS:
        try:
            query_job = bigquery_client.query(query)
            # .result() waits for the query to complete.
            results_iterator = query_job.result(timeout=30)
            if results_iterator.total_rows > 0:
                print(f"SUCCESS: Found event {event_id} in BigQuery.")
                retrieved_row = dict(list(results_iterator)[0])

                # --- Assertion ---
                original_timestamp = datetime.fromisoformat(
                    original_payload["timestamp"]
                )
                retrieved_timestamp = retrieved_row["timestamp"].replace(
                    tzinfo=timezone.utc
                )
                
                # Timestamps can have microsecond precision differences between Python and BQ.
                # We check if the difference is negligible.
                time_difference_seconds = abs(
                    (retrieved_timestamp - original_timestamp).total_seconds()
                )

                if (
                    retrieved_row["event_id"] == original_payload["event_id"]
                    and retrieved_row["agent_id"] == original_payload["agent_id"]
                    and retrieved_row["session_id"]
                    == original_payload["session_id"]
                    and time_difference_seconds < 2
                ):
                    print(
                        "SUCCESS: Event data in BigQuery matches the "
                        "published payload."
                    )
                    return True
                else:
                    print("FAILURE: Mismatch between published payload and BigQuery data.")
                    print(f"  Expected : {original_payload}")
                    print(f"  Retrieved: {retrieved_row}")
                    return False

        except exceptions.NotFound:
            print("BigQuery table or dataset not found. Please check configuration.")
            return False
        except Exception as e:
            print(f"An error occurred while querying BigQuery: {e}")
            # Continue polling even on transient errors.

        print(
            f"Event not found yet. Retrying in {POLLING_INTERVAL_SECONDS} "
            "seconds..."
        )
        time.sleep(POLLING_INTERVAL_SECONDS)

    print(f"FAILURE: Timed out after {POLLING_TIMEOUT_SECONDS} seconds.")
    return False


def main():
    """Main function to run the end-to-end agent workflow test.

    Initializes GCP clients, publishes a test event, and verifies the
    result in BigQuery. The script exits with status 0 on success and 1
    on failure.
    """
    print("--- Starting Agent E2E Workflow Test ---")

    try:
        # Use Application Default Credentials (ADC) for authentication.
        publisher_client = pubsub_v1.PublisherClient()
        bigquery_client = bigquery.Client(project=PROJECT_ID)
    except Exception as e:
        print(f"FAILURE: Could not initialize GCP clients: {e}")
        print("Please ensure you are authenticated with GCP (e.g., `gcloud auth application-default login`)")
        exit(1)

    topic_path = publisher_client.topic_path(PROJECT_ID, TOPIC_ID)

    # 1. Generate a unique payload for this test run.
    sample_payload, event_id = generate_sample_payload()

    # 2. Publish the event to Pub/Sub.
    try:
        publish_event(publisher_client, topic_path, sample_payload)
    except Exception:
        print("FAILURE: Test stopped due to Pub/Sub publishing error.")
        exit(1)

    # 3. Verify the event is processed and stored correctly in BigQuery.
    success = verify_event_in_bigquery(
        bigquery_client, event_id, sample_payload
    )

    if success:
        print("\n--- E2E Workflow Test PASSED ---")
        exit(0)
    else:
        print("\n--- E2E Workflow Test FAILED ---")
        exit(1)


if __name__ == "__main__":
    main()