import os
from typing import BinaryIO
from google.cloud import bigquery

def load_data_to_bigquery(dataset_id: str, table_id: str, source_file_path: str) -> None:
    client: bigquery.Client = bigquery.Client()

    table_ref: bigquery.TableReference = client.dataset(dataset_id).table(table_id)
    job_config: bigquery.LoadJobConfig = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
    )

    with open(source_file_path, "rb") as source_file:  # BinaryIO for file object
        load_job: bigquery.LoadJob = client.load_table_from_file(source_file, table_ref, job_config=job_config)

    load_job.result()  # Wait for the job to complete.
    print(f"Loaded {load_job.output_rows} rows into {dataset_id}:{table_id}.")

if __name__ == "__main__":
    dataset_id: str = os.getenv("BQ_DATASET_ID", "dulce")
    table_id: str = os.getenv("BQ_TABLE_ID", "raw_data")
    source_file_path: str = os.getenv("SOURCE_FILE", "data.json")

    load_data_to_bigquery(dataset_id, table_id, source_file_path)
