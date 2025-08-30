/**
 * @fileoverview Firestore database service
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Provides Firestore database integration.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { Firestore, CollectionReference, DocumentReference } from '@google-cloud/firestore';

/**
 * Configuration for the Firestore database service
 */
export interface FirestoreConfig {
  /**
   * GCP project ID
   */
  projectId: string;
  
  /**
   * Collection prefix (optional)
   */
  collectionPrefix?: string;
  
  /**
   * Database ID (for multi-database setups)
   */
  databaseId?: string;
}

/**
 * Document data with Firestore ID
 */
export interface DocumentWithId<T> extends T {
  id: string;
}

/**
 * Firestore database service for Dulce de Saigon F&B platform
 */
export class FirestoreService {
  private firestore: Firestore;
  private config: FirestoreConfig;
  
  /**
   * Creates a new FirestoreService
   * @param config Firestore configuration
   */
  constructor(config: FirestoreConfig) {
    this.config = {
      collectionPrefix: 'dds_',
      ...config
    };
    
    // Initialize Firestore
    this.firestore = new Firestore({
      projectId: config.projectId,
      databaseId: config.databaseId
    });
    
    console.log(`[FirestoreService] Initialized for project ${config.projectId}`);
  }
  
  /**
   * Get a collection reference with the proper prefix
   * @param collectionName Collection name without prefix
   * @returns Firestore collection reference
   */
  collection<T>(collectionName: string): CollectionReference {
    const fullName = `${this.config.collectionPrefix}${collectionName}`;
    return this.firestore.collection(fullName);
  }
  
  /**
   * Get a document reference
   * @param collectionName Collection name
   * @param documentId Document ID
   * @returns Firestore document reference
   */
  document<T>(collectionName: string, documentId: string): DocumentReference {
    return this.collection<T>(collectionName).doc(documentId);
  }
  
  /**
   * Create a new document
   * @param collectionName Collection name
   * @param data Document data
   * @returns Promise with the document ID
   */
  async create<T>(collectionName: string, data: T): Promise<string> {
    const docRef = await this.collection<T>(collectionName).add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return docRef.id;
  }
  
  /**
   * Update an existing document
   * @param collectionName Collection name
   * @param documentId Document ID
   * @param data Document data
   * @returns Promise resolving when update is complete
   */
  async update<T>(collectionName: string, documentId: string, data: Partial<T>): Promise<void> {
    const docRef = this.document<T>(collectionName, documentId);
    
    await docRef.update({
      ...data,
      updatedAt: new Date()
    });
  }
  
  /**
   * Get a document by ID
   * @param collectionName Collection name
   * @param documentId Document ID
   * @returns Promise with the document data or null if not found
   */
  async get<T>(collectionName: string, documentId: string): Promise<DocumentWithId<T> | null> {
    const docRef = this.document<T>(collectionName, documentId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    } as DocumentWithId<T>;
  }
  
  /**
   * Delete a document
   * @param collectionName Collection name
   * @param documentId Document ID
   * @returns Promise resolving when deletion is complete
   */
  async delete(collectionName: string, documentId: string): Promise<void> {
    const docRef = this.document(collectionName, documentId);
    await docRef.delete();
  }
  
  /**
   * Query documents in a collection
   * @param collectionName Collection name
   * @param queryFn Function to build the query
   * @returns Promise with array of documents
   */
  async query<T>(
    collectionName: string,
    queryFn: (collectionRef: CollectionReference) => any
  ): Promise<DocumentWithId<T>[]> {
    const collectionRef = this.collection<T>(collectionName);
    const query = queryFn(collectionRef);
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DocumentWithId<T>[];
  }
}
