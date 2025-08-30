/**
 * @fileoverview Schema validation for MCP requests and responses
 * 
 * This module provides validation functions for MCP requests and responses
 * to ensure they conform to the expected schema.
 */

import { MCPRequest, MCPResponse } from '../client';

/**
 * Validates an MCP request
 * 
 * @param request - The request to validate
 * @throws If the request is invalid
 */
export function validateMCPRequest<T>(request: MCPRequest<T>): void {
  if (!request) {
    throw new Error('Request cannot be null or undefined');
  }
  
  if (!request.command) {
    throw new Error('Request must have a command');
  }
  
  if (typeof request.command !== 'string') {
    throw new Error('Command must be a string');
  }
  
  if (request.parameters === undefined || request.parameters === null) {
    throw new Error('Request must have parameters (can be an empty object)');
  }
}

/**
 * Validates an MCP response
 * 
 * @param response - The response to validate
 * @throws If the response is invalid
 */
export function validateMCPResponse<T>(response: MCPResponse<T>): void {
  if (!response) {
    throw new Error('Response cannot be null or undefined');
  }
  
  if (typeof response.success !== 'boolean') {
    throw new Error('Response must have a boolean success property');
  }
  
  if (response.success && response.error) {
    throw new Error('Successful response cannot have an error property');
  }
  
  if (!response.success && !response.error) {
    throw new Error('Failed response must have an error property');
  }
  
  if (response.error) {
    if (!response.error.code) {
      throw new Error('Error must have a code');
    }
    
    if (!response.error.message) {
      throw new Error('Error must have a message');
    }
  }
}
