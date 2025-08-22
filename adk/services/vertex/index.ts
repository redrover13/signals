import { PredictionServiceClient } from '@google-cloud/aiplatform';
import {
  getVertexAIClient,
  getProjectId,
  } from '@dulce/gcp';

/**
 * Configuration for the VertexAIClient.
 * Chú ý: Các tham số này phải khớp với cấu hình triển khai trên Google Cloud.
 */
export interface VertexAIClientConfig {
  project: string; // GCP Project ID (e.g., '324928471234')
  location: string; // GCP Region (e.g., 'us-central1')
  endpointId: string; // The numerical ID of the Vertex AI Endpoint
}

export class VertexAIClient {
  private readonly client: PredictionServiceClient;
  private readonly endpoint: string;

  /**
   * Initializes the Vertex AI client.
   * Khởi tạo client để tương tác với Vertex AI.
   * @param config Configuration object with project, location, and endpointId.
   */
  constructor(config: VertexAIClientConfig) {
    const { location, endpointId } = config;

    // Use the centralized initialization function from libs/gcp for the PredictionServiceClient
    this.client = getVertexAIClient({ location });

    // Retrieve the project ID from the centralized libs/gcp library
    const projectId = getProjectId();

    // Construct the endpoint using the centrally obtained project ID
    this.endpoint = `projects/${projectId}/locations/${location}/endpoints/${endpointId}`;
  }

  /**
   * Sends a prediction request to the Vertex AI endpoint.
   * Gửi yêu cầu dự đoán đến điểm cuối của Vertex AI.
   *
   * @param instance The instance payload for the model.
   * @returns The prediction result from the model.
   * @throws PredictionAPIError on failure.
   */
  async predict(instance: any): Promise<any> {
    try {
      const [response] = await this.client.predict({
        endpoint: this.endpoint,
        instances: [instance], // Vertex AI expects an array of instances
      });
      return response.predictions;
    } catch (error: any) {
      // Log the structured error for compliance and debugging.
      // Ghi lại lỗi có cấu trúc để tuân thủ và gỡ lỗi.
      console.error(
        JSON.stringify({
          message: 'Vertex AI Prediction Failed',
          endpoint: this.endpoint,
          error: error.message,
          errorCode: error.code,
        })
      );

      // Re-throw as a custom, standardized error.
      throw new PredictionAPIError(error.message, error.code);
    }
  }
}

/**
 * A custom error for a failed prediction.
 * Lỗi tùy chỉnh cho dự đoán không thành công.
 */
export class PredictionAPIError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = 'PredictionAPIError';
  }
}
