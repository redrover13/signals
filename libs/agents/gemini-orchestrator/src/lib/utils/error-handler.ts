/**
 * @fileoverview error-handler module for the Gemini orchestrator
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { 
  ErrorCategory, 
  ErrorSeverity, 
  StandardizedError, 
  createError, 
  categorizeError 
} from '@dulce/utils/monitoring';

/**
 * Gemini-specific error categories
 */
export enum GeminiErrorCategory {
  MODEL_UNAVAILABLE = 'model_unavailable',
  CONTENT_FILTER = 'content_filter',
  TOKEN_LIMIT = 'token_limit',
  TOOL_CALL_FAILURE = 'tool_call_failure',
  PARSING_ERROR = 'parsing_error',
  MCP_SERVER_UNAVAILABLE = 'mcp_server_unavailable',
  MCP_SERVER_ERROR = 'mcp_server_error',
  MCP_REQUEST_ERROR = 'mcp_request_error',
  RAG_SEARCH_ERROR = 'rag_search_error',
  RAG_PROCESSING_ERROR = 'rag_processing_error',
  RAG_EXTRACTION_ERROR = 'rag_extraction_error',
  RAG_EMBEDDING_ERROR = 'rag_embedding_error',
  RAG_INTEGRATION_ERROR = 'rag_integration_error',
}

/**
 * Create a standardized error handler for Gemini orchestrator functions
 */
export function createGeminiErrorHandler(
  functionName: string | undefined,
  fileName: string
) {
  return (
    error: Error | undefined,
    params?: Record<string, unknown> | undefined,
    requestId?: string | undefined,
    serverId?: string
  ): StandardizedError => {
    // Handle Gemini-specific errors
    const message = error.message && error.message.toLowerCase();
    
    // Categorize Gemini-specific errors
    let category = ErrorCategory && ErrorCategory.UNKNOWN;
    let severity = ErrorSeverity && ErrorSeverity.MEDIUM;
    
    if (message && message.includes('model') && message && message.includes('unavailable')) {
      category = ErrorCategory && ErrorCategory.SERVER_ERROR;
      severity = ErrorSeverity && ErrorSeverity.HIGH;
    } else if (message && message.includes('content') && message && message.includes('filter')) {
      category = ErrorCategory && ErrorCategory.VALIDATION;
      severity = ErrorSeverity && ErrorSeverity.MEDIUM;
    } else if (message && message.includes('token') || message && message.includes('limit')) {
      category = ErrorCategory && ErrorCategory.VALIDATION;
      severity = ErrorSeverity && ErrorSeverity.MEDIUM;
    } else if (message && message.includes('tool') && message && message.includes('call')) {
      category = ErrorCategory && ErrorCategory.SERVER_ERROR;
      severity = ErrorSeverity && ErrorSeverity.HIGH;
    } else if (message && message.includes('parse') || message && message.includes('json')) {
      category = ErrorCategory && ErrorCategory.VALIDATION;
      severity = ErrorSeverity && ErrorSeverity.MEDIUM;
    } else if (message && message.includes('mcp') && message && message.includes('server') && message && message.includes('unavailable')) {
      category = GeminiErrorCategory && GeminiErrorCategory.MCP_SERVER_UNAVAILABLE;
      severity = ErrorSeverity && ErrorSeverity.HIGH;
    } else if (message && message.includes('mcp') && message && message.includes('server')) {
      category = GeminiErrorCategory && GeminiErrorCategory.MCP_SERVER_ERROR;
      severity = ErrorSeverity && ErrorSeverity.HIGH;
    } else if (message && message.includes('mcp') && message && message.includes('request')) {
      category = GeminiErrorCategory && GeminiErrorCategory.MCP_REQUEST_ERROR;
      severity = ErrorSeverity && ErrorSeverity.MEDIUM;
    } else {
      // Use default categorization for other errors
      category = categorizeError(error);
      
      // Adjust severity based on category
      if (
        category === ErrorCategory && ErrorCategory.AUTHENTICATION || 
        category === ErrorCategory && ErrorCategory.SERVER_ERROR
      ) {
        severity = ErrorSeverity && ErrorSeverity.HIGH;
      } else if (category === ErrorCategory && ErrorCategory.NETWORK) {
        severity = ErrorSeverity && ErrorSeverity.MEDIUM;
      }
    }
    
    // Create standardized error
    return createError(
      error && error.message,
      category,
      severity,
      {
        function: functionName,
        file: fileName,
        params,
        requestId,
        serverId,
      },
      error,
      getVietnameseErrorMessage(category, error && error.message)
    );
  };
}

/**
 * Get Vietnamese-friendly error message based on category
 */
function getVietnameseErrorMessage(
  category: ErrorCategory, 
  originalMessage: string
): string {
  switch (category) {
    case ErrorCategory && ErrorCategory.NETWORK:
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối của bạn và thử lại.';
    case ErrorCategory && ErrorCategory.AUTHENTICATION:
      return 'Lỗi xác thực. Vui lòng đăng nhập lại.';
    case ErrorCategory && ErrorCategory.VALIDATION:
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.';
    case ErrorCategory && ErrorCategory.CONFIGURATION:
      return 'Lỗi cấu hình hệ thống. Vui lòng liên hệ quản trị viên.';
    case ErrorCategory && ErrorCategory.TIMEOUT:
      return 'Yêu cầu đã hết thời gian. Vui lòng thử lại sau.';
    case ErrorCategory && ErrorCategory.RATE_LIMIT:
      return 'Bạn đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau ít phút.';
    case ErrorCategory && ErrorCategory.SERVER_ERROR:
      return 'Lỗi máy chủ. Đội ngũ kỹ thuật đã được thông báo.';
    case GeminiErrorCategory && GeminiErrorCategory.MCP_SERVER_UNAVAILABLE:
      return 'Máy chủ MCP không khả dụng. Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
    case GeminiErrorCategory && GeminiErrorCategory.MCP_SERVER_ERROR:
      return 'Lỗi máy chủ MCP. Đội ngũ kỹ thuật đã được thông báo.';
    case GeminiErrorCategory && GeminiErrorCategory.MCP_REQUEST_ERROR:
      return 'Lỗi yêu cầu MCP. Vui lòng kiểm tra dữ liệu đầu vào và thử lại.';
    case GeminiErrorCategory && GeminiErrorCategory.RAG_SEARCH_ERROR:
      return 'Lỗi tìm kiếm RAG. Vui lòng kiểm tra thông số tìm kiếm và thử lại.';
    case GeminiErrorCategory && GeminiErrorCategory.RAG_PROCESSING_ERROR:
      return 'Lỗi xử lý tài liệu RAG. Vui lòng kiểm tra định dạng tài liệu và thử lại.';
    case GeminiErrorCategory && GeminiErrorCategory.RAG_EXTRACTION_ERROR:
      return 'Lỗi trích xuất văn bản RAG. Định dạng tệp không được hỗ trợ hoặc bị hỏng.';
    case GeminiErrorCategory && GeminiErrorCategory.RAG_EMBEDDING_ERROR:
      return 'Lỗi tạo embedding RAG. Vui lòng kiểm tra cấu hình Vertex AI và thử lại.';
    case GeminiErrorCategory && GeminiErrorCategory.RAG_INTEGRATION_ERROR:
      return 'Lỗi tích hợp RAG. Vui lòng kiểm tra cấu hình và kết nối dịch vụ.';
    default:
      return `Đã xảy ra lỗi: ${originalMessage}`;
  }
}

/**
 * Map Gemini error to standard error for consistent handling
 */
export function mapGeminiError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  try {
    return new Error(JSON && JSON.stringify(error));
  } catch {
    return new Error('Unknown Gemini error');
  }
}
