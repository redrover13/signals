/**
 * @fileoverview Firebase client service for the Gemini orchestrator
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Provides Firebase Firestore access for the Gemini orchestrator.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue, CollectionReference, DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { createGeminiErrorHandler } from '../utils/error-handler';
import { getSecret } from '../config/config.service';

// Firebase client singleton
let firestoreInstance: Firestore | null = null;

// Error handler for Firebase client
const errorHandler = createGeminiErrorHandler(
  'FirebaseClient',
  'firebase.client.ts'
);

/**
 * Initialize Firebase client
 * @param projectId - Firebase project ID
 * @returns Firestore instance
 */
export async function initFirebase(projectId: string): Promise<Firestore> {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  try {
    // Try to get service account from Secret Manager
    let serviceAccount: ServiceAccount;
    try {
      const serviceAccountJson = await getSecret('firebase-service-account', projectId);
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (error) {
      // Fall back to default credentials if secret not available
      console.warn('Firebase service account not found in Secret Manager, using default credentials');
      
      // Initialize with project ID only (uses default credentials)
      const app = initializeApp({
        projectId
      });
      
      firestoreInstance = getFirestore(app);
      return firestoreInstance;
    }

    // Initialize with service account
    const app = initializeApp({
      credential: cert(serviceAccount)
    });

    firestoreInstance = getFirestore(app);
    return firestoreInstance;
  } catch (error) {
    throw errorHandler(error as Error, { projectId });
  }
}

/**
 * Get a collection reference
 * @param collection - Collection name
 * @returns Collection reference
 */
export async function getCollection(
  projectId: string,
  collection: string
): Promise<CollectionReference<DocumentData>> {
  try {
    const db = await initFirebase(projectId);
    return db.collection(collection);
  } catch (error) {
    throw errorHandler(error as Error, { projectId, collection });
  }
}

/**
 * Query documents from a collection
 * @param projectId - Firebase project ID
 * @param collection - Collection name
 * @param filters - Query filters
 * @param limit - Maximum number of documents to return
 * @param orderBy - Order by field and direction
 * @returns Query results
 */
export async function queryDocuments(
  projectId: string,
  collection: string,
  filters?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>,
  limit?: number,
  orderBy?: {
    field: string;
    direction?: 'asc' | 'desc';
  }
): Promise<Record<string, unknown>[]> {
  try {
    const collectionRef = await getCollection(projectId, collection);
    
    // Build query
    let query = collectionRef;
    
    // Apply filters
    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        // @ts-expect-error - The operator types are compatible but TypeScript doesn't know
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }
    
    // Apply order by
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }
    
    // Execute query
    const snapshot = await query.get();
    
    // Process results
    return snapshot.docs.map(formatDocument);
  } catch (error) {
    throw errorHandler(error as Error, { 
      projectId, 
      collection, 
      filters,
      limit,
      orderBy
    });
  }
}

/**
 * Get a document by ID
 * @param projectId - Firebase project ID
 * @param collection - Collection name
 * @param id - Document ID
 * @returns Document data
 */
export async function getDocument(
  projectId: string,
  collection: string,
  id: string
): Promise<Record<string, unknown> | null> {
  try {
    const collectionRef = await getCollection(projectId, collection);
    const doc = await collectionRef.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return formatDocument(doc);
  } catch (error) {
    throw errorHandler(error as Error, { projectId, collection, id });
  }
}

/**
 * Create or update a document
 * @param projectId - Firebase project ID
 * @param collection - Collection name
 * @param data - Document data
 * @param id - Document ID (optional, will generate if not provided)
 * @returns Document ID
 */
export async function writeDocument(
  projectId: string,
  collection: string,
  data: Record<string, unknown>,
  id?: string
): Promise<string> {
  try {
    const collectionRef = await getCollection(projectId, collection);
    
    // Add timestamps
    const timestampedData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    };
    
    if (id) {
      // Update existing document
      const docRef = collectionRef.doc(id);
      await docRef.set(timestampedData, { merge: true });
      return id;
    } else {
      // Create new document
      const docData = {
        ...timestampedData,
        createdAt: FieldValue.serverTimestamp()
      };
      
      const docRef = await collectionRef.add(docData);
      return docRef.id;
    }
  } catch (error) {
    throw errorHandler(error as Error, { projectId, collection, id });
  }
}

/**
 * Delete a document
 * @param projectId - Firebase project ID
 * @param collection - Collection name
 * @param id - Document ID
 * @returns Success status
 */
export async function deleteDocument(
  projectId: string,
  collection: string,
  id: string
): Promise<boolean> {
  try {
    const collectionRef = await getCollection(projectId, collection);
    await collectionRef.doc(id).delete();
    return true;
  } catch (error) {
    throw errorHandler(error as Error, { projectId, collection, id });
  }
}

/**
 * Format a document snapshot into a plain object
 * @param doc - Document snapshot
 * @returns Formatted document
 */
function formatDocument(doc: QueryDocumentSnapshot<DocumentData>): Record<string, unknown> {
  const data = doc.data();
  
  // Convert timestamps to ISO strings
  const formatted: Record<string, unknown> = {
    id: doc.id,
    ...Object.entries(data).reduce((acc, [key, value]) => {
      // Handle Firestore timestamps
      if (value && typeof value.toDate === 'function') {
        acc[key] = value.toDate().toISOString();
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>)
  };
  
  return formatted;
}
