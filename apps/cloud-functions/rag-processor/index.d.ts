/**
 * @fileoverview index module for the src component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */
import { CloudEvent } from '@google-cloud/functions-framework';
interface StorageObjectData {
    bucket: string;
    name: string;
    contentType: string;
    size: string;
    timeCreated: string;
    updated: string;
}
/**
 * Cloud Function that processes documents for RAG
 * Triggered by Cloud Storage object creation events
 */
export declare function processDocument(cloudEvent: CloudEvent<StorageObjectData>): Promise<void>;
/**
 * Health check endpoint for the function
 */
export declare function healthCheck(): Promise<{
    status: string;
    timestamp: string;
}>;
export {};
