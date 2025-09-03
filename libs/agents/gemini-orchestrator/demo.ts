#!/usr/bin/env tsx
/**
 * @fileoverview Demonstration script for the Gemini Orchestrator
 *
 * This file showcases the capabilities of the Gemini Orchestrator
 * with various types of queries and routing scenarios.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { GeminiOrchestrator } from './src/lib/gemini-orchestrator';
import { SubAgentType } from './src/lib/schemas';

/**
 * Demo queries that showcase different routing patterns
 */
const DEMO_QUERIES = [
  {
    query: "SELECT COUNT(*) FROM orders WHERE date >= '2024-01-01'",
    expectedRoute: SubAgentType.BIGQUERY,
    description: "SQL query - should route to BigQuery"
  },
  {
    query: "Get all documents from the users collection",
    expectedRoute: SubAgentType.FIREBASE,
    description: "Document query - should route to Firebase"
  },
  {
    query: "Search for information about Vietnamese pho recipes",
    expectedRoute: SubAgentType.RAG,
    description: "Knowledge search - should route to RAG"
  },
  {
    query: "Upload customer feedback to storage",
    expectedRoute: SubAgentType.TOOL,
    description: "Tool operation - should route to Tools"
  },
  {
    query: "What are the best selling menu items this month?",
    expectedRoute: SubAgentType.BIGQUERY,
    description: "Analytics query - should route to BigQuery"
  },
  {
    query: "Update document in the restaurants collection",
    expectedRoute: SubAgentType.FIREBASE,
    description: "Document update - should route to Firebase"
  }
];

/**
 * Run the demonstration
 */
async function runDemo(): Promise<void> {
  console.log('🚀 Gemini Orchestrator Demonstration\n');
  console.log('====================================\n');

  const orchestrator = new GeminiOrchestrator();

  try {
    // Initialize the orchestrator
    console.log('📋 Initializing orchestrator...');
    await orchestrator.initialize();
    
    const status = orchestrator.getStatus();
    console.log(`✅ Initialization complete`);
    console.log(`   - Initialized: ${status.initialized}`);
    console.log(`   - Has Model: ${status.hasModel}`);
    console.log(`   - Model: ${status.modelName || 'simulation'}\n`);

    // Health check
    console.log('🏥 Performing health check...');
    const health = await orchestrator.healthCheck();
    console.log(`   - Status: ${health.status}`);
    console.log(`   - Details: ${JSON.stringify(health.details, null, 2)}\n`);

    // Test each demo query
    console.log('🧪 Testing query routing...\n');
    
    for (const [index, demo] of DEMO_QUERIES.entries()) {
      console.log(`${index + 1}. ${demo.description}`);
      console.log(`   Query: "${demo.query}"`);
      console.log(`   Expected route: ${demo.expectedRoute}`);
      
      try {
        const startTime = Date.now();
        const result = await orchestrator.orchestrate({
          query: demo.query,
          context: {
            demo: true
          }
        });

        const processingTime = Date.now() - startTime;
        const actualRoute = result?.metadata?.subAgent;
        const routeMatch = actualRoute === demo.expectedRoute;

        console.log(`   ✅ Success (${processingTime}ms)`);
        console.log(`   📍 Actual route: ${actualRoute} ${routeMatch ? '✅' : '❌'}`);
        console.log(`   📊 Result type: ${result?.data?.type || 'unknown'}`);
        
        if (result?.data?.text) {
          const text = result.data.text as string;
          const truncated = text.length > 100 ? text.substring(0, 100) + '...' : text;
          console.log(`   💬 Response: "${truncated}"`);
        }
        
        console.log('');
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }

    // Performance test
    console.log('⚡ Performance test...');
    const performanceQueries = [
      "Quick test query 1",
      "Quick test query 2", 
      "Quick test query 3"
    ];

    const times: number[] = [];
    for (const query of performanceQueries) {
      const start = Date.now();
      await orchestrator.orchestrate({ query });
      times.push(Date.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`   📈 Average response time: ${avgTime.toFixed(2)}ms`);
    console.log(`   📊 Range: ${Math.min(...times)}ms - ${Math.max(...times)}ms\n`);

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }

  console.log('🎉 Demo completed successfully!');
  console.log('\n💡 To use with a real Gemini API key:');
  console.log('   export GEMINI_API_KEY=your_api_key_here');
  console.log('   npm run demo:gemini-orchestrator');
}

/**
 * Main execution
 */
if (require.main === module) {
  runDemo().catch((error) => {
    console.error('Demo error:', error);
    process.exit(1);
  });
}

export { runDemo };