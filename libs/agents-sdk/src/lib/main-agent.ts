/**
 * @fileoverview Main Agent class for orchestrating sub-agents via Gemini
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for the main orchestration agent.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BigQuery } from '@google-cloud/bigquery';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Sub-agent for BigQuery operations
export class BQSubAgent {
  private bigquery: BigQuery;

  constructor(projectId: string) {
    this.bigquery = new BigQuery({ projectId });
  }

  async execute(sql: string): Promise<any> {
    try {
      const [rows] = await this.bigquery.query({ query: sql });
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Sub-agent for Firebase operations
export class FirebaseSubAgent {
  private db: any;

  constructor(firebaseConfig: any) {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  async execute(data: { path: string; value: any }): Promise<any> {
    try {
      const docRef = doc(this.db, data.path);
      await setDoc(docRef, data.value);
      return { success: true, message: 'Data updated successfully' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Main orchestrator class
export class MainAgent {
  private genAI: GoogleGenerativeAI;
  private subAgents: { bq: BQSubAgent; firebase: FirebaseSubAgent };

  constructor(apiKey: string, projectId: string, firebaseConfig: any) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.subAgents = {
      bq: new BQSubAgent(projectId),
      firebase: new FirebaseSubAgent(firebaseConfig),
    };
  }

  async orchestrate(query: string): Promise<any> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(`
        Analyze this query and determine the appropriate action:
        Query: ${query}
        
        Respond with one of:
        - "BIGQUERY: <SQL_QUERY>" for data analysis queries
        - "FIREBASE: <PATH>|<DATA>" for real-time updates
        - "ERROR: <REASON>" if the query cannot be processed
      `);
      
      const response = result.response.text();

      if (response.startsWith('BIGQUERY:')) {
        const sql = response.replace('BIGQUERY:', '').trim();
        return await this.subAgents.bq.execute(sql);
      } else if (response.startsWith('FIREBASE:')) {
        const parts = response.replace('FIREBASE:', '').trim().split('|');
        const path = parts[0];
        const data = JSON.parse(parts[1] || '{}');
        return await this.subAgents.firebase.execute({ path, value: data });
      } else {
        return { success: false, error: 'No suitable sub-agent found for query' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}