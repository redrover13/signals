/**
 * @fileoverview Gemini model configuration and utilities
 */

export interface GeminiConfig {
  /**
   * API key for Gemini models (if not using service account)
   */
  apiKey?: string;
  
  /**
   * Model name to use
   * @default 'gemini-1.5-pro'
   */
  modelName?: string;
  
  /**
   * Maximum number of output tokens
   * @default 1024
   */
  maxOutputTokens?: number;
  
  /**
   * Temperature for text generation (0.0 to 1.0)
   * @default 0.2
   */
  temperature?: number;
  
  /**
   * Top-K sampling parameter
   * @default 40
   */
  topK?: number;
  
  /**
   * Top-P sampling parameter
   * @default 0.8
   */
  topP?: number;
}

/**
 * Extracts text content from a Gemini API response
 * 
 * @param response The response from a Gemini API call
 * @returns The extracted text content
 */
export function extractGeminiResponseText(response: any): string {
  try {
    // Handle different response formats
    if (!response) {
      return '';
    }
    
    // Format for Vertex AI Gemini models
    if (response.candidates && response.candidates[0]?.content?.parts) {
      return response.candidates[0].content.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text)
        .join('');
    }
    
    // Format for Google AI SDK Gemini models
    if (response.response?.text) {
      return response.response.text;
    }
    
    // Generic content extraction
    if (response.text) {
      return response.text;
    }
    
    // Mock response for testing
    return 'This is a mock response from Gemini.';
  } catch (error) {
    console.error('Error extracting Gemini response text:', error);
    return '';
  }
}

/**
 * Formats error messages from Gemini API calls
 * 
 * @param error The error object from a Gemini API call
 * @returns A formatted error message
 */
export function formatGeminiError(error: any): string {
  try {
    if (!error) {
      return 'Unknown error';
    }
    
    if (error.message) {
      return `Error: ${error.message}`;
    }
    
    if (typeof error === 'string') {
      return `Error: ${error}`;
    }
    
    return `Error: ${JSON.stringify(error)}`;
  } catch (formatError) {
    console.error('Error formatting Gemini error:', formatError);
    return 'Unprocessable error occurred';
  }
}
