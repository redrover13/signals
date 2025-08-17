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

"""End-to-end test for the agent data processing workflow."""

import json
import os
import time
import uuid
from datetime import datetime, timezone

from google.api_core import exceptions
from google.cloud import bigquery, pubsub_v1

PROJECT_ID = os.environ.get("GCP_PROJECT", "saigon-signals")
TOPIC_ID = "dulce.agents"
DATASET_ID = "dulce"
TABLE_ID = "agent_runs"
POLLING_TIMEOUT_SECONDS = 60
POLLING_INTERVAL_SECONDS = 5


def generate_sample_payload() -> tuple[dict, str]:
    """Generates a realistic sample agent event payload with a unique ID."""
    event_id = str(uuid.uuid4())
    payload = {
        "event_id": event_id,
        "agent_id": f"test_agent_{uuid.uuid4()}",
        "session_id": f"test_session_{uuid.uuid4()}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "e2e_test_event",
        "data": {"test_run_id": event_id, "source": "e2e_workflow.py"},
    }
    return payload, event_id


def publish_event(
    publisher_client: pubsub_v1.PublisherClient, topic_path: str, payload: dict
) -> str:
    """Publishes a single event to the specified Pub/Sub topic."""
    data = json.dumps(payload).encode("utf-8")
    future = publisher_client.publish(topic_path, data)
    try:
        return future.result(timeout=30)
    except exceptions.GoogleAPICallError as api_error:
        print(f"Google API call error while publishing event: {api_error}")
        raise
    except exceptions.TimeoutError as timeout_error:
        print(f"Timeout error while publishing event: {timeout_error}")
        raise
    except Exception as e:
        print(f"Unexpected error while publishing event: {e}")
        raise


def verify_event_in_bigquery(
    bigquery_client: bigquery.Client, event_id: str, original_payload: dict
) -> bool:
    """Polls BigQuery to verify the event was processed and inserted correctly."""
    query = """
        SELECT event_id, agent_id, session_id, timestamp
        FROM `{}.{}.{}`
        WHERE event_id = @event_id
        LIMIT 1
    """.format(PROJECT_ID, DATASET_ID, TABLE_ID)
    
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("event_id", "STRING", event_id)
        ]
    )
    
    start_time = time.time()
    while time.time() - start_time < POLLING_TIMEOUT_SECONDS:
        try:
            query_job = bigquery_client.query(query, job_config=job_config)
            results = list(query_job.result(timeout=30))
            
            if results:
                retrieved_row = results[0]
                original_timestamp = datetime.fromisoformat(original_payload["timestamp"])
                retrieved_timestamp = retrieved_row["timestamp"].replace(tzinfo=timezone.utc)
                time_diff = abs((retrieved_timestamp - original_timestamp).total_seconds())
                
                return (
                    retrieved_row["event_id"] == original_payload["event_id"]
                    and retrieved_row["agent_id"] == original_payload["agent_id"]
                    and retrieved_row["session_id"] == original_payload["session_id"]
                    and time_diff < 2
                )
                
        except exceptions.NotFound:
            return False
        except Exception as e:
            print(f"An error occurred while querying BigQuery: {e}")
            
        time.sleep(POLLING_INTERVAL_SECONDS)
    
    return False


def main():
    """Main function to run the end-to-end agent workflow test."""
    try:
        publisher_client = pubsub_v1.PublisherClient()
        bigquery_client = bigquery.Client(project=PROJECT_ID)
        topic_path = publisher_client.topic_path(PROJECT_ID, TOPIC_ID)
        
        sample_payload, event_id = generate_sample_payload()
        publish_event(publisher_client, topic_path, sample_payload)
        
        success = verify_event_in_bigquery(bigquery_client, event_id, sample_payload)
        exit(0 if success else 1)
        
    except Exception as e:
        print(f"E2E test failed with an exception: {e}")
        exit(1)


if __name__ == "__main__":
    main()