/**
 * MCP Server Registry
 * Defines all available MCP servers and their configurations
 */

import { MCPServerConfig } from './mcp-config.schema';

/**
 * Registry of all available MCP servers
 */
export const MCP_SERVER_REGISTRY: Record<string, MCPServerConfig> = {
  // ===== CORE & DEVELOPMENT SERVERS =====

  github: {
    id: 'github',
    name: 'GitHub',
    category: 'development',
    type: 'github',
    enabled: true,
    priority: 10,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-github',
      timeout: 30000,
      retry: { attempts: 3, delay: 1000, backoff: 'exponential' },
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'github-token',
        envVar: 'GITHUB_TOKEN',
      },
    },
    healthCheck: {
      interval: 300000, // 5 minutes
      timeout: 10000,
      failureThreshold: 3,
    },
    options: {
      owner: process.env['GITHUB_OWNER'] || 'your-org',
      repo: process.env['GITHUB_REPO'] || 'signals',
    },
  },

  git: {
    id: 'git',
    name: 'Git',
    category: 'core',
    type: 'git',
    enabled: true,
    priority: 10,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/git/dist/index.js',
      timeout: 15000,
    },
    healthCheck: {
      interval: 120000, // 2 minutes
      timeout: 5000,
      failureThreshold: 2,
    },
  },

  filesystem: {
    id: 'filesystem',
    name: 'File System',
    category: 'core',
    type: 'filesystem',
    enabled: true,
    priority: 10,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/filesystem/dist/index.js',
      timeout: 10000,
    },
    healthCheck: {
      interval: 60000, // 1 minute
      timeout: 3000,
      failureThreshold: 2,
    },
    options: {
      allowedDirectories: [process.cwd(), '/tmp'],
    },
  },

  sequentialthinking: {
    id: 'sequentialthinking',
    name: 'Sequential Thinking',
    category: 'core',
    type: 'sequentialthinking',
    enabled: true,
    priority: 9,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/sequentialthinking/dist/index.js',
      timeout: 60000,
    },
    healthCheck: {
      interval: 300000, // 5 minutes
      timeout: 10000,
      failureThreshold: 3,
    },
  },

  fetch: {
    id: 'fetch',
    name: 'Fetch',
    category: 'web',
    type: 'fetch',
    enabled: true,
    priority: 8,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/fetch/dist/index.js',
      timeout: 30000,
    },
    healthCheck: {
      interval: 180000, // 3 minutes
      timeout: 10000,
      failureThreshold: 3,
    },
  },

  memory: {
    id: 'memory',
    name: 'Memory',
    category: 'core',
    type: 'memory',
    enabled: true,
    priority: 8,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/memory/dist/index.js',
      timeout: 15000,
    },
    healthCheck: {
      interval: 120000, // 2 minutes
      timeout: 5000,
      failureThreshold: 2,
    },
  },

  time: {
    id: 'time',
    name: 'Time',
    category: 'core',
    type: 'time',
    enabled: true,
    priority: 7,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/time/dist/index.js',
      timeout: 5000,
    },
    healthCheck: {
      interval: 300000, // 5 minutes
      timeout: 3000,
      failureThreshold: 3,
    },
  },

  everything: {
    id: 'everything',
    name: 'Everything (Testing)',
    category: 'testing',
    type: 'everything',
    enabled: true,
    priority: 3,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/everything/dist/index.js',
      timeout: 10000,
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 5000,
      failureThreshold: 5,
    },
  },

  // ===== DATA & DATABASES =====

  databases: {
    id: 'databases',
    name: 'Databases (Google Toolbox)',
    category: 'data',
    type: 'databases',
    enabled: true,
    priority: 9,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @google/mcp-toolbox-databases',
      timeout: 30000,
    },
    auth: {
      type: 'gcp-service-account',
      credentials: {
        secretName: 'gcp-service-account-key',
        envVar: 'GOOGLE_APPLICATION_CREDENTIALS',
      },
    },
    healthCheck: {
      interval: 300000, // 5 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
    options: {
      bigqueryProjectId: process.env['GCP_PROJECT_ID'],
      datasets: ['analytics', 'signals', 'events'],
    },
  },

  chroma: {
    id: 'chroma',
    name: 'Chroma Vector DB',
    category: 'data',
    type: 'chroma',
    enabled: true,
    priority: 7,
    connection: {
      type: 'http',
      endpoint: process.env.CHROMA_URL || 'http://localhost:8000',
      timeout: 30000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'chroma-api-key',
        envVar: 'CHROMA_API_KEY',
      },
    },
    healthCheck: {
      interval: 180000, // 3 minutes
      timeout: 10000,
      failureThreshold: 3,
    },
  },

  // ===== WEB & API =====

  exa: {
    id: 'exa',
    name: 'Exa AI Search',
    category: 'web',
    type: 'exa',
    enabled: true,
    priority: 8,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-exa',
      timeout: 30000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'exa-api-key',
        envVar: 'EXA_API_KEY',
      },
    },
    healthCheck: {
      interval: 300000, // 5 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
  },

  netlify: {
    id: 'netlify',
    name: 'Netlify',
    category: 'platforms',
    type: 'netlify',
    enabled: false, // Enable when needed
    priority: 6,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-netlify',
      timeout: 30000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'netlify-token',
        envVar: 'NETLIFY_TOKEN',
      },
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
  },

  cloudflare: {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'platforms',
    type: 'cloudflare',
    enabled: false, // Enable when needed
    priority: 6,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-cloudflare',
      timeout: 30000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'cloudflare-token',
        envVar: 'CLOUDFLARE_TOKEN',
      },
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
  },

  apimatic: {
    id: 'apimatic',
    name: 'APIMatic OpenAPI Validator',
    category: 'development',
    type: 'apimatic',
    enabled: true,
    priority: 6,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-apimatic',
      timeout: 30000,
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
  },

  // ===== PLATFORMS & DOCS =====

  notion: {
    id: 'notion',
    name: 'Notion',
    category: 'platforms',
    type: 'notion',
    enabled: false, // Enable when needed
    priority: 6,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-notion',
      timeout: 30000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'notion-token',
        envVar: 'NOTION_TOKEN',
      },
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
  },

  mslearn: {
    id: 'mslearn',
    name: 'Microsoft Learn',
    category: 'platforms',
    type: 'mslearn',
    enabled: true,
    priority: 5,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-mslearn',
      timeout: 30000,
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
  },

  firebase: {
    id: 'firebase',
    name: 'Firebase',
    category: 'platforms',
    type: 'firebase',
    enabled: false, // Enable when needed
    priority: 6,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-firebase',
      timeout: 30000,
    },
    auth: {
      type: 'gcp-service-account',
      credentials: {
        secretName: 'firebase-service-account',
        envVar: 'FIREBASE_SERVICE_ACCOUNT',
      },
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
  },

  // ===== NX, NODE.JS, GOOGLE & WEBSITE BUILDING =====

  nx: {
    id: 'nx',
    name: 'Nx Workspace',
    category: 'development',
    type: 'nx',
    enabled: true,
    priority: 9,
    connection: {
      type: 'stdio',
      endpoint: 'node libs/mcp/src/lib/servers/specialized/nx-server.js',
      timeout: 30000,
    },
    healthCheck: {
      interval: 300000, // 5 minutes
      timeout: 10000,
      failureThreshold: 3,
    },
    options: {
      workspaceRoot: process.cwd(),
      nxJsonPath: 'nx.json',
    },
  },

  'google-cloud-run': {
    id: 'google-cloud-run',
    name: 'Google Cloud Run',
    category: 'platforms',
    type: 'google-cloud-run',
    enabled: true,
    priority: 7,
    connection: {
      type: 'stdio',
      endpoint: 'node libs/mcp/src/lib/servers/specialized/gcp-cloud-run-server.js',
      timeout: 45000,
    },
    auth: {
      type: 'gcp-service-account',
      credentials: {
        secretName: 'gcp-service-account-key',
        envVar: 'GOOGLE_APPLICATION_CREDENTIALS',
      },
    },
    healthCheck: {
      interval: 300000, // 5 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
    options: {
      projectId: process.env.GCP_PROJECT_ID,
      region: process.env.GCP_REGION || 'us-central1',
    },
  },

  'google-maps': {
    id: 'google-maps',
    name: 'Google Maps',
    category: 'specialized',
    type: 'google-maps',
    enabled: false, // Enable when needed
    priority: 5,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-google-maps',
      timeout: 30000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'google-maps-api-key',
        envVar: 'GOOGLE_MAPS_API_KEY',
      },
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
  },

  algolia: {
    id: 'algolia',
    name: 'Algolia Search',
    category: 'specialized',
    type: 'algolia',
    enabled: false, // Enable when needed
    priority: 5,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-algolia',
      timeout: 30000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'algolia-api-key',
        envVar: 'ALGOLIA_API_KEY',
      },
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
  },

  browserbase: {
    id: 'browserbase',
    name: 'Browserbase',
    category: 'testing',
    type: 'browserbase',
    enabled: false, // Enable when needed
    priority: 4,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-browserbase',
      timeout: 60000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'browserbase-api-key',
        envVar: 'BROWSERBASE_API_KEY',
      },
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 30000,
      failureThreshold: 3,
    },
  },

  browserstack: {
    id: 'browserstack',
    name: 'BrowserStack',
    category: 'testing',
    type: 'browserstack',
    enabled: false, // Enable when needed
    priority: 4,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-browserstack',
      timeout: 60000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'browserstack-credentials',
        envVar: 'BROWSERSTACK_USERNAME',
      },
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 30000,
      failureThreshold: 3,
    },
  },

  builtwith: {
    id: 'builtwith',
    name: 'BuiltWith',
    category: 'specialized',
    type: 'builtwith',
    enabled: true,
    priority: 4,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-builtwith',
      timeout: 30000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'builtwith-api-key',
        envVar: 'BUILTWITH_API_KEY',
      },
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
  },

  magic: {
    id: 'magic',
    name: 'Magic UI Generator (21st.dev)',
    category: 'development',
    type: 'magic',
    enabled: false, // Enable when needed
    priority: 5,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @21st-dev/mcp-server-magic',
      timeout: 45000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'magic-api-key',
        envVar: 'MAGIC_API_KEY',
      },
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 20000,
      failureThreshold: 3,
    },
  },

  make: {
    id: 'make',
    name: 'Make.com Automation',
    category: 'automation',
    type: 'make',
    enabled: false, // Enable when needed
    priority: 3,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-make',
      timeout: 30000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'make-api-key',
        envVar: 'MAKE_API_KEY',
      },
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
  },

  devhub: {
    id: 'devhub',
    name: 'DevHub Content Management',
    category: 'platforms',
    type: 'devhub',
    enabled: false, // Enable when needed
    priority: 4,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-devhub',
      timeout: 30000,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'devhub-api-key',
        envVar: 'DEVHUB_API_KEY',
      },
    },
    healthCheck: {
      interval: 600000, // 10 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
  },

  node: {
    id: 'node',
    name: 'Node.js',
    category: 'development',
    type: 'node',
    enabled: true,
    priority: 8,
    connection: {
      type: 'stdio',
      endpoint: 'node libs/mcp/src/lib/servers/specialized/node-server.js',
      timeout: 30000,
    },
    healthCheck: {
      interval: 300000, // 5 minutes
      timeout: 10000,
      failureThreshold: 3,
    },
    options: {
      nodeVersion: process.version,
      packageManager: 'pnpm',
    },
  },

  google: {
    id: 'google',
    name: 'Google Cloud Platform',
    category: 'platforms',
    type: 'google',
    enabled: true,
    priority: 8,
    connection: {
      type: 'stdio',
      endpoint: 'node libs/mcp/src/lib/servers/specialized/gcp-server.js',
      timeout: 45000,
    },
    auth: {
      type: 'gcp-service-account',
      credentials: {
        secretName: 'gcp-service-account-key',
        envVar: 'GOOGLE_APPLICATION_CREDENTIALS',
      },
    },
    healthCheck: {
      interval: 300000, // 5 minutes
      timeout: 15000,
      failureThreshold: 3,
    },
    options: {
      projectId: process.env.GCP_PROJECT_ID,
      region: process.env.GCP_REGION || 'us-central1',
      services: ['bigquery', 'storage', 'secretmanager', 'aiplatform'],
    },
  },
};

/**
 * Get servers by category
 */
export function getServersByCategory(category: string): MCPServerConfig[] {
  return Object.values(MCP_SERVER_REGISTRY).filter((server) => server.category === category);
}

/**
 * Get enabled servers sorted by priority
 */
export function getEnabledServers(): MCPServerConfig[] {
  return Object.values(MCP_SERVER_REGISTRY)
    .filter((server) => server.enabled)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get server configuration by ID
 */
export function getServerConfig(serverId: string): MCPServerConfig | undefined {
  return MCP_SERVER_REGISTRY[serverId];
}
