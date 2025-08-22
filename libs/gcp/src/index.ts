// Export helpers
export { getProjectId };
/**
 * Ensures a Pub/Sub topic exists (stub implementation).
 * Replace with actual logic as needed.
 */
export async function ensureTopic(): Promise<void> {
  // TODO: Implement actual topic creation logic using @google-cloud/pubsub
  return;
}

/**
 * Returns a Pub/Sub topic interface (stub implementation).
 * Replace with actual logic as needed.
 */
export function getPubSub() {
  return {
    topic: (_name: string) => ({
      publishMessage: async (_msg: unknown) => {
        // Mark intentionally unused parameters to satisfy lint rules
        void _name;
        void _msg;
        // TODO: Implement actual publish logic using @google-cloud/pubsub
        // Accept an unknown payload and marshal appropriately when implementing.
        return 'mock-message-id';
      },
    }),
  };
}
import { BigQuery } from '@google-cloud/bigquery';
import { Storage } from '@google-cloud/storage';
import { PredictionServiceClient, v1 } from '@google-cloud/aiplatform';
import { GoogleAuth } from 'google-auth-library';
import { memoize } from 'lodash';

/**
 * @file Thư viện tập trung để xác thực và khởi tạo các client dịch vụ của Google Cloud.
 * @description Centralized library for authenticating and initializing Google Cloud service clients.
 * This library relies on Application Default Credentials (ADC) and expects the
 * GCP_PROJECT_ID environment variable to be set, which is standard in WIF-configured
 * environments like Cloud Run or GKE.
 *
 * @example
 * ```typescript
 * import { getBigQueryClient } from '@dulce/gcp';
 *
 * const bigquery = getBigQueryClient();
 * const [datasets] = await bigquery.getDatasets();
 * console.log(datasets.map(d => d.id));
 * ```
 */

/**
 * Lỗi tùy chỉnh cho các sự cố cấu hình hoặc khởi tạo GCP.
 * Custom error for GCP configuration or initialization failures.
 */
export class GcpInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GcpInitializationError';
  }
}

/**
 * Lấy Google Project ID từ biến môi trường.
 * Retrieves the Google Project ID from the environment variables.
 *
 * @returns {string} The GCP Project ID.
 * @throws {GcpInitializationError} If the GCP_PROJECT_ID environment variable is not set.
 */
const getProjectId = memoize((): string => {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    // Tiếng Việt: "Biến môi trường GCP_PROJECT_ID là bắt buộc nhưng không được đặt.
    // Vui lòng đảm bảo nó được cung cấp trong môi trường chạy."
    throw new GcpInitializationError(
      'The GCP_PROJECT_ID environment variable is required but was not set. ' +
        'Please ensure it is provided in the runtime environment.',
    );
  }
  return projectId;
});

/**
 * Lấy thông tin xác thực Google Cloud mặc định của ứng dụng.
 * Gets the Application Default Credentials for Google Cloud. This is the core
 * authentication function that underpins all client initializations.
 *
 * @returns {Promise<{
 *   auth: GoogleAuth;
 *   projectId: string;
 * }>} A promise that resolves to an object containing the GoogleAuth instance and the project ID.
 */
export async function getGoogleCloudCredentials(): Promise<{
  auth: GoogleAuth;
  projectId: string;
}> {
  try {
    const projectId = getProjectId();
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    return { auth, projectId };
  } catch (error) {
    console.error(
      'Failed to get Google Cloud credentials. Check ADC setup. Lỗi lấy thông tin xác thực Google Cloud. Kiểm tra cài đặt ADC.',
      error,
    );
    let msg = 'An unknown error occurred while fetching GCP credentials.';
    if (error instanceof Error) msg = error.message;
    throw new GcpInitializationError(msg);
  }
}

/**
 * Khởi tạo và trả về một client BigQuery đã được xác thực.
 * Initializes and returns an authenticated BigQuery client. The client is memoized
 * to ensure a single instance is reused.
 *
 * @returns {BigQuery} An instance of the BigQuery client.
 * @throws {GcpInitializationError} If initialization fails.
 */
export const getBigQueryClient = memoize((): BigQuery => {
  try {
    const projectId = getProjectId();
    return new BigQuery({ projectId });
  } catch (error) {
    console.error('Failed to initialize BigQuery client. Lỗi khởi tạo BigQuery client.', error);
    let msg = 'Could not instantiate BigQuery client.';
    if (error instanceof Error) msg = error.message;
    throw new GcpInitializationError(msg);
  }
});

/**
 * Khởi tạo và trả về một client Google Cloud Storage đã được xác thực.
 * Initializes and returns an authenticated Google Cloud Storage client. The client
 * is memoized for reuse.
 *
 * @returns {Storage} An instance of the Storage client.
 * @throws {GcpInitializationError} If initialization fails.
 */
export const getStorageClient = memoize((): Storage => {
  try {
    const projectId = getProjectId();
    return new Storage({ projectId });
  } catch (error) {
    console.error('Failed to initialize Storage client. Lỗi khởi tạo Storage client.', error);
    let msg = 'Could not instantiate Storage client.';
    if (error instanceof Error) msg = error.message;
    throw new GcpInitializationError(msg);
  }
});

/**
 * Execute a SQL query against BigQuery and return the result rows.
 * This is a convenience wrapper used by other libraries in the monorepo.
 */
export async function query(sql: string, params?: Record<string, unknown>) {
  const bigquery = getBigQueryClient();
  const [rows] = await bigquery.query({ query: sql, params });
  return rows;
}

/**
 * Insert rows into a BigQuery table. The `datasetTable` parameter expects the
 * format `dataset.table` or `dataset/table`. This is a small helper wrapper
 * for convenience in libraries that interact with BigQuery.
 */
export async function insertRows(datasetTable: string, rows: Array<Record<string, unknown>>) {
  const bigquery = getBigQueryClient();
  let datasetName = '';
  let tableName = '';
  if (datasetTable.includes('.')) {
    const parts = datasetTable.split('.');
    tableName = parts.pop() as string;
    datasetName = parts.join('.');
  } else if (datasetTable.includes('/')) {
    const parts = datasetTable.split('/');
    datasetName = parts[0];
    tableName = parts[1];
  } else {
    throw new Error('insertRows expects dataset.table or dataset/table');
  }

  const dataset = bigquery.dataset(datasetName);
  const table = dataset.table(tableName);
  // BigQuery Node client table.insert will throw on failure; return the result for callers if needed
  // table.insert has complex types from the BigQuery client; use unknown result type
  // to avoid cascading type issues here while preserving runtime behavior.
  // Use a safe typed cast for the BigQuery insert helper to avoid cascading type issues.
  const res: unknown = await (
    table as unknown as { insert: (r: unknown) => Promise<unknown> }
  ).insert(rows);
  return res;
}

/**
 * Upload a string or buffer to Cloud Storage.
 * `path` must be in the form `bucket/path/to/object`.
 */
export async function uploadString(path: string, contents: string | Buffer, contentType?: string) {
  const storage = getStorageClient();
  const firstSlash = path.indexOf('/');
  if (firstSlash === -1)
    throw new Error('uploadString expects path in the form "bucket/objectPath"');
  const bucketName = path.slice(0, firstSlash);
  const objectName = path.slice(firstSlash + 1);
  const file = storage.bucket(bucketName).file(objectName);
  await file.save(typeof contents === 'string' ? Buffer.from(contents) : contents, { contentType });
  return `gs://${bucketName}/${objectName}`;
}

/**
 * Khởi tạo và trả về một client Vertex AI Prediction đã được xác thực.
 * Initializes and returns an authenticated Vertex AI Prediction client. The client
 * is memoized for reuse.
 *
 * @param {object} options - Tùy chọn cấu hình cho client.
 * @param {string} options.location - Vị trí của tài nguyên Vertex AI (ví dụ: 'us-central1').
 * @returns {v1.PredictionServiceClient} An instance of the PredictionServiceClient.
 * @throws {GcpInitializationError} If initialization fails.
 */
export const getVertexAIClient = memoize(
  (options: { location: string }): v1.PredictionServiceClient => {
    try {
      getProjectId(); // Ensures project ID is available before proceeding
      return new PredictionServiceClient({
        apiEndpoint: `${options.location}-aiplatform.googleapis.com`,
      });
    } catch (error) {
      console.error('Failed to initialize Vertex AI client. Lỗi khởi tạo Vertex AI client.', error);
      let msg = 'Could not instantiate Vertex AI client.';
      if (error instanceof Error) msg = error.message;
      throw new GcpInitializationError(msg);
    }
  },
);
