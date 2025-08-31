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
} from '@nx-monorepo/utils/monitoring';

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
}

/**
 * Create a standardized error handler for Gemini orchestrator functions
 */
export function createGeminiErrorHandler(
  functionName: string,
  fileName: string
) {
  return (
    error: Error,
    params?: Record<string, unknown>,
    requestId?: string,
    serverId?: string
  ): StandardizedError => {
    // Handle Gemini-specific errors
    const message = error.message.toLowerCase();
    
    // Categorize Gemini-specific errors
    let category = ErrorCategory.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    
    if (message.includes('model') && message.includes('unavailable')) {
      category = ErrorCategory.SERVER_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (message.includes('content') && message.includes('filter')) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.MEDIUM;
    } else if (message.includes('token') || message.includes('limit')) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.MEDIUM;
    } else if (message.includes('tool') && message.includes('call')) {
      category = ErrorCategory.SERVER_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (message.includes('parse') || message.includes('json')) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.MEDIUM;
    } else if (message.includes('mcp') && message.includes('server') && message.includes('unavailable')) {
      category = GeminiErrorCategory.MCP_SERVER_UNAVAILABLE;
      severity = ErrorSeverity.HIGH;
    } else if (message.includes('mcp') && message.includes('server')) {
      category = GeminiErrorCategory.MCP_SERVER_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (message.includes('mcp') && message.includes('request')) {
      category = GeminiErrorCategory.MCP_REQUEST_ERROR;
      severity = ErrorSeverity.MEDIUM;
    } else {
      // Use default categorization for other errors
      category = categorizeError(error);
      
      // Adjust severity based on category
      if (
        category === ErrorCategory.AUTHENTICATION || 
        category === ErrorCategory.SERVER_ERROR
      ) {
        severity = ErrorSeverity.HIGH;
      } else if (category === ErrorCategory.NETWORK) {
        severity = ErrorSeverity.MEDIUM;
      }
    }
    
    // Create standardized error
    return createError(
      error.message,
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
      getVietnameseErrorMessage(category, error.message)
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
    case ErrorCategory.NETWORK:
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối của bạn và thử lại.';
    case ErrorCategory.AUTHENTICATION:
      return 'Lỗi xác thực. Vui lòng đăng nhập lại.';
    case ErrorCategory.VALIDATION:
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.';
    case ErrorCategory.CONFIGURATION:
      return 'Lỗi cấu hình hệ thống. Vui lòng liên hệ quản trị viên.';
    case ErrorCategory.TIMEOUT:
      return 'Yêu cầu đã hết thời gian. Vui lòng thử lại sau.';
    case ErrorCategory.RATE_LIMIT:
      return 'Bạn đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau ít phút.';
    case ErrorCategory.SERVER_ERROR:
      return 'Lỗi máy chủ. Đội ngũ kỹ thuật đã được thông báo.';
    case GeminiErrorCategory.MCP_SERVER_UNAVAILABLE:
      return 'Máy chủ MCP không khả dụng. Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
    case GeminiErrorCategory.MCP_SERVER_ERROR:
      return 'Lỗi máy chủ MCP. Đội ngũ kỹ thuật đã được thông báo.';
    case GeminiErrorCategory.MCP_REQUEST_ERROR:
      return 'Lỗi yêu cầu MCP. Vui lòng kiểm tra dữ liệu đầu vào và thử lại.';
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
    return new Error(JSON.stringify(error));
  } catch {
    return new Error('Unknown Gemini error');
  }
}
