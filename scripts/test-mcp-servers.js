import { mcpService } from '@nx-monorepo/mcp';

(async () => {
  try {
    console.log('Initializing MCP Service...');
    await mcpService.initialize();

    const servers = [
      'filesystem',
      'git',
      'github',
      'memory',
      'sequentialthinking',
      'time',
      'fetch',
      'databases',
      'nx',
      'node',
      'google',
      'exa',
      'apimatic',
      'everything',
    ];

    for (const server of servers) {
      try {
        console.log(`Testing connection to server: ${server}`);
        const health = await mcpService.getServerHealth(server);
        console.log(`Server: ${server}, Health:`, health);
      } catch (error) {
        console.error(`Failed to connect to server: ${server}`, error);
      }
    }

    console.log('MCP Server connection tests completed.');
  } catch (error) {
    console.error('Error initializing MCP Service:', error);
  }
})();
