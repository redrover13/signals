/**
 * @fileoverview app module for the app component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import { AgentInterface } from './components/agent-interface';

// Configuration - in production, these should come from environment variables
const agentConfig = {
  apiKey: process.env['REACT_APP_GEMINI_API_KEY'] || 'your-gemini-api-key',
  projectId: process.env['REACT_APP_GCP_PROJECT_ID'] || 'your-gcp-project',
  firebaseConfig: {
    apiKey: process.env['REACT_APP_FIREBASE_API_KEY'] || 'your-firebase-api-key',
    authDomain: process.env['REACT_APP_FIREBASE_AUTH_DOMAIN'] || 'your-project.firebaseapp.com',
    projectId: process.env['REACT_APP_FIREBASE_PROJECT_ID'] || 'your-firebase-project',
    storageBucket: process.env['REACT_APP_FIREBASE_STORAGE_BUCKET'] || 'your-project.appspot.com',
    messagingSenderId: process.env['REACT_APP_FIREBASE_MESSAGING_SENDER_ID'] || '123456789',
    appId: process.env['REACT_APP_FIREBASE_APP_ID'] || 'your-app-id'
  }
};

export function App() {
  return (
    <div className="app">
      <header>
        <h1>Dulce de Saigon Agent Frontend</h1>
        <p>Interact with AI agents for BigQuery and Firebase operations</p>
      </header>
      <main>
        <AgentInterface config={agentConfig} />
      </main>
    </div>
  );
}

export default App;


