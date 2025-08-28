/**
 * @fileoverview route module for the hello component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

export async function GET(request: Request) {
  return new Response('Hello, from API!');
}
