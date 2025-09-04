/**
 * @fileoverview mcp-demo module for the examples component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

/**
 * MCP Integration Demo
 * Demonstrates how to use the MCP system in the Signals project
 */

import {
  mcpService,
  createMCPClient,
  validateMCPEnvironment,
  testMCPConnectivity,
} from '@dulce/mcp';

async function runMCPDemo() {
  console.log('🚀 Starting MCP Integration Demo...\n');

  try {
    // 1. Validate environment
    console.log('1. Validating MCP Environment...');
    const validation = validateMCPEnvironment();

    if (!validation.valid) {
      console.error('❌ Environment validation failed:', validation.errors);
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️  Environment warnings:', validation.warnings);
    }

    console.log('✅ Environment validation passed\n');

    // 2. Initialize MCP service
    console.log('2. Initializing MCP Service...');
    await mcpService.initialize();
    console.log('✅ MCP Service initialized');
    console.log('📊 Enabled servers:', mcpService.getEnabledServers());
    console.log('🏥 System health:', mcpService.getSystemHealth());
    console.log('');

    // 3. Test connectivity
    console.log('3. Testing Server Connectivity...');
    const connectivity = await testMCPConnectivity();
    const connected = connectivity.filter((c: any) => c.connected);
    const failed = connectivity.filter((c: any) => !c.connected);

    console.log(`✅ Connected servers: ${connected.length}`);
    connected.forEach((c: any) => console.log(`  - ${c.serverId}: ${c.responseTime}ms`));

    if (failed.length > 0) {
      console.log(`❌ Failed servers: ${failed.length}`);
      failed.forEach((c: any) => console.log(`  - ${c.serverId}: ${c.error}`));
    }
    console.log('');

    // 4. Demonstrate core services
    console.log('4. Testing Core Services...');

    // File system operations
    try {
      const packageJson = await mcpService.fs('read', { path: 'package.json' });
      if (!packageJson.error) {
        const pkg = JSON.parse(packageJson.result);
        console.log(`✅ Read package.json: ${pkg.name} v${pkg.version}`);
      }
    } catch (error) {
      console.log(
        '⚠️  File system test skipped:',
        error instanceof Error ? error.message : String(error),
      );
    }

    // Git operations
    try {
      const gitStatus = await mcpService.git('status');
      if (!gitStatus.error) {
        console.log('✅ Git status retrieved successfully');
      }
    } catch (error) {
      console.log('⚠️  Git test skipped:', error instanceof Error ? error.message : String(error));
    }

    // Memory operations
    try {
      await mcpService.memory('store', {
        key: 'demo-test',
        value: { timestamp: new Date(), demo: true },
      });

      const retrieved = await mcpService.memory('retrieve', { key: 'demo-test' });
      if (!retrieved.error) {
        console.log('✅ Memory store/retrieve test passed');
      }
    } catch (error) {
      console.log(
        '⚠️  Memory test skipped:',
        error instanceof Error ? error.message : String(error),
      );
    }

    // Time operations
    try {
      const currentTime = await mcpService.time('now');
      if (!currentTime.error) {
        console.log(`✅ Current time: ${currentTime.result}`);
      }
    } catch (error) {
      console.log('⚠️  Time test skipped:', error instanceof Error ? error.message : String(error));
    }

    console.log('');

    // 5. Demonstrate development services
    console.log('5. Testing Development Services...');

    // Nx operations
    try {
      const nxProjects = await mcpService.nx('list-projects');
      if (!nxProjects.error) {
        console.log(`✅ Nx projects found: ${nxProjects.result?.length || 0}`);
      }
    } catch (error) {
      console.log('⚠️  Nx test skipped:', error instanceof Error ? error.message : String(error));
    }

    // Node.js operations
    try {
      const nodeInfo = await mcpService.node('version');
      if (!nodeInfo.error) {
        console.log(`✅ Node.js version: ${nodeInfo.result}`);
      }
    } catch (error) {
      console.log(
        '⚠️  Node.js test skipped:',
        error instanceof Error ? error.message : String(error),
      );
    }

    console.log('');

    // 6. Demonstrate data services (if available)
    console.log('6. Testing Data Services...');

    try {
      const dbTest = await mcpService.database('list-datasets');
      if (!dbTest.error) {
        console.log('✅ Database connection successful');
      }
    } catch (error) {
      console.log(
        '⚠️  Database test skipped:',
        error instanceof Error ? error.message : String(error),
      );
    }

    console.log('');

    // 7. Demonstrate web services
    console.log('7. Testing Web Services...');

    try {
      const fetchTest = await mcpService.fetch('https://api.github.com/zen');
      if (!fetchTest.error) {
        console.log(`✅ Web fetch test: ${fetchTest.result?.slice(0, 50)}...`);
      }
    } catch (error) {
      console.log(
        '⚠️  Web fetch test skipped:',
        error instanceof Error ? error.message : String(error),
      );
    }

    try {
      const searchTest = await mcpService.search('TypeScript best practices', { limit: 3 });
      if (!searchTest.error) {
        console.log(`✅ Search test: Found ${searchTest.result?.length || 0} results`);
      }
    } catch (error) {
      console.log(
        '⚠️  Search test skipped:',
        error instanceof Error ? error.message : String(error),
      );
    }

    console.log('');

    // 8. Demonstrate sequential thinking
    console.log('8. Testing Sequential Thinking...');

    try {
      const thinkingTest = await mcpService.think(
        'What are the key considerations for building a scalable microservices architecture?',
      );

      if (!thinkingTest.error) {
        console.log('✅ Sequential thinking test completed');
        console.log('💭 Thinking result preview:', thinkingTest.result?.slice(0, 100) + '...');
      }
    } catch (error) {
      console.log(
        '⚠️  Sequential thinking test skipped:',
        error instanceof Error ? error.message : String(error),
      );
    }

    console.log('');

    // 9. Performance and routing analysis
    console.log('9. Performance and Routing Analysis...');

    const routingStats = mcpService.getRoutingStats();
    console.log(`📊 Routing rules: ${routingStats.rules.length}`);
    console.log('📈 Load statistics:', Object.fromEntries(routingStats.loadStats));

    // Test routing for different methods
    const testMethods = ['git.status', 'db.query', 'search.web', 'nx.build'];
    testMethods.forEach((method) => {
      const routing = mcpService.testRouting(method);
      console.log(`🔀 ${method} → ${routing.selectedServer || 'no server'}`);
    });

    console.log('');

    // 10. Final health check
    console.log('10. Final Health Check...');
    const finalHealth = mcpService.getSystemHealth();
    console.log('🏥 Final system health:', {
      totalServers: finalHealth.totalServers,
      healthyServers: finalHealth.healthyServers,
      uptime: `${finalHealth.averageUptime.toFixed(1)}%`,
    });

    console.log('\n🎉 MCP Integration Demo completed successfully!');
  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Cleanup
    try {
      await mcpService.shutdown();
      console.log('🔄 MCP Service shut down cleanly');
    } catch (error) {
      console.error('⚠️  Shutdown error:', error);
    }
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  runMCPDemo().catch(console.error);
}

export { runMCPDemo };
