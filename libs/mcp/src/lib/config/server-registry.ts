import { MCPServerConfig } from './mcp-config.schema';
import { DEFAULT_TIMEOUT } from './server-config.defaults';

export const MCP_SERVER_REGISTRY: Record<string, MCPServerConfig> = {
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
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'github-token',
        envVar: 'GITHUB_TOKEN',
      },
    },
    options: {
      owner: process.env['GITHUB_OWNER'],
      repo: process.env['GITHUB_REPO'],
    },
  },

  git: {
    id: 'git',
    name: 'Git',
    category: 'core',
    type: 'git',
    enabled: true,
    priority: 1,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/git/dist/index.js',
      timeout: DEFAULT_TIMEOUT,
    },
  },

  filesystem: {
    id: 'filesystem',
    name: 'File System',
    category: 'core',
    type: 'filesystem',
    enabled: true,
    priority: 1,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/filesystem/dist/index.js',
      timeout: DEFAULT_TIMEOUT,
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
    priority: 1,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/sequentialthinking/dist/index.js',
      timeout: DEFAULT_TIMEOUT,
    },
  },

  fetch: {
    id: 'fetch',
    name: 'Fetch',
    category: 'web',
    type: 'fetch',
    enabled: true,
    priority: 5,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/fetch/dist/index.js',
      timeout: DEFAULT_TIMEOUT,
    },
  },

  memory: {
    id: 'memory',
    name: 'Memory',
    category: 'core',
    type: 'memory',
    enabled: true,
    priority: 1,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/memory/dist/index.js',
      timeout: DEFAULT_TIMEOUT,
    },
  },

  time: {
    id: 'time',
    name: 'Time',
    category: 'core',
    type: 'time',
    enabled: true,
    priority: 1,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/time/dist/index.js',
      timeout: DEFAULT_TIMEOUT,
    },
  },

  everything: {
    id: 'everything',
    name: 'Everything (Testing)',
    category: 'testing',
    type: 'everything',
    enabled: true,
    priority: 100,
    connection: {
      type: 'stdio',
      endpoint: 'node servers/src/everything/dist/index.js',
      timeout: DEFAULT_TIMEOUT,
    },
  },

  databases: {
    id: 'databases',
    name: 'Databases (Google Toolbox)',
    category: 'data',
    type: 'databases',
    enabled: true,
    priority: 10,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @google/mcp-toolbox-databases',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'gcp-service-account',
      credentials: {
        secretName: 'gcp-service-account-key',
        envVar: 'GOOGLE_APPLICATION_CREDENTIALS',
      },
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
    priority: 10,
    connection: {
      type: 'http',
      endpoint: process.env['CHROMA_URL'] || 'http://localhost:8000',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'chroma-api-key',
        envVar: 'CHROMA_API_KEY',
      },
    },
  },

  exa: {
    id: 'exa',
    name: 'Exa AI Search',
    category: 'web',
    type: 'exa',
    enabled: true,
    priority: 5,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-exa',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'exa-api-key',
        envVar: 'EXA_API_KEY',
      },
    },
  },

  netlify: {
    id: 'netlify',
    name: 'Netlify',
    category: 'platforms',
    type: 'netlify',
    enabled: false,
    priority: 20,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-netlify',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'netlify-token',
        envVar: 'NETLIFY_TOKEN',
      },
    },
  },

  cloudflare: {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'platforms',
    type: 'cloudflare',
    enabled: false,
    priority: 20,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-cloudflare',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'cloudflare-token',
        envVar: 'CLOUDFLARE_TOKEN',
      },
    },
  },

  apimatic: {
    id: 'apimatic',
    name: 'APIMatic OpenAPI Validator',
    category: 'development',
    type: 'apimatic',
    enabled: true,
    priority: 10,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-apimatic',
      timeout: DEFAULT_TIMEOUT,
    },
  },

  notion: {
    id: 'notion',
    name: 'Notion',
    category: 'platforms',
    type: 'notion',
    enabled: false,
    priority: 20,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-notion',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'notion-token',
        envVar: 'NOTION_TOKEN',
      },
    },
  },

  mslearn: {
    id: 'mslearn',
    name: 'Microsoft Learn',
    category: 'platforms',
    type: 'mslearn',
    enabled: true,
    priority: 20,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-mslearn',
      timeout: DEFAULT_TIMEOUT,
    },
  },

  firebase: {
    id: 'firebase',
    name: 'Firebase',
    category: 'platforms',
    type: 'firebase',
    enabled: false,
    priority: 20,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-firebase',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'gcp-service-account',
      credentials: {
        secretName: 'gcp-service-account-key',
        envVar: 'FIREBASE_SERVICE_ACCOUNT',
      },
    },
  },

  nx: {
    id: 'nx',
    name: 'Nx Workspace',
    category: 'development',
    type: 'nx',
    enabled: true,
    priority: 10,
    connection: {
      type: 'stdio',
      endpoint: 'node libs/mcp/src/lib/servers/specialized/nx-server.js',
      timeout: DEFAULT_TIMEOUT,
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
    priority: 20,
    connection: {
      type: 'stdio',
      endpoint: 'node libs/mcp/src/lib/servers/specialized/gcp-cloud-run-server.js',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'gcp-service-account',
      credentials: {
        secretName: 'gcp-service-account-key',
        envVar: 'GOOGLE_APPLICATION_CREDENTIALS',
      },
    },
    options: {
      projectId: process.env['GCP_PROJECT_ID'],
      region: process.env['GCP_REGION'] || 'us-central1',
    },
  },

  'google-maps': {
    id: 'google-maps',
    name: 'Google Maps',
    category: 'specialized',
    type: 'google-maps',
    enabled: false,
    priority: 30,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-google-maps',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'google-maps-api-key',
        envVar: 'GOOGLE_MAPS_API_KEY',
      },
    },
  },

  algolia: {
    id: 'algolia',
    name: 'Algolia Search',
    category: 'specialized',
    type: 'algolia',
    enabled: false,
    priority: 30,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-algolia',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'algolia-api-key',
        envVar: 'ALGOLIA_API_KEY',
      },
    },
  },

  browserbase: {
    id: 'browserbase',
    name: 'Browserbase',
    category: 'testing',
    type: 'browserbase',
    enabled: false,
    priority: 100,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-browserbase',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'browserbase-api-key',
        envVar: 'BROWSERBASE_API_KEY',
      },
    },
  },

  browserstack: {
    id: 'browserstack',
    name: 'BrowserStack',
    category: 'testing',
    type: 'browserstack',
    enabled: false,
    priority: 100,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-browserstack',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'browserstack-credentials',
        envVar: 'BROWSERSTACK_USERNAME',
      },
    },
  },

  builtwith: {
    id: 'builtwith',
    name: 'BuiltWith',
    category: 'specialized',
    type: 'builtwith',
    enabled: true,
    priority: 30,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-builtwith',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'builtwith-api-key',
        envVar: 'BUILTWITH_API_KEY',
      },
    },
  },

  magic: {
    id: 'magic',
    name: 'Magic UI Generator (21st.dev)',
    category: 'development',
    type: 'magic',
    enabled: false,
    priority: 10,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @21st-dev/mcp-server-magic',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'magic-api-key',
        envVar: 'MAGIC_API_KEY',
      },
    },
  },

  make: {
    id: 'make',
    name: 'Make.com Automation',
    category: 'automation',
    type: 'make',
    enabled: false,
    priority: 40,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-make',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'make-api-key',
        envVar: 'MAKE_API_KEY',
      },
    },
  },

  devhub: {
    id: 'devhub',
    name: 'DevHub Content Management',
    category: 'platforms',
    type: 'devhub',
    enabled: false,
    priority: 20,
    connection: {
      type: 'stdio',
      endpoint: 'npx -y @modelcontextprotocol/server-devhub',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'api-key',
      credentials: {
        secretName: 'devhub-api-key',
        envVar: 'DEVHUB_API_KEY',
      },
    },
  },

  node: {
    id: 'node',
    name: 'Node.js',
    category: 'development',
    type: 'node',
    enabled: true,
    priority: 10,
    connection: {
      type: 'stdio',
      endpoint: 'node libs/mcp/src/lib/servers/specialized/node-server.js',
      timeout: DEFAULT_TIMEOUT,
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
    priority: 20,
    connection: {
      type: 'stdio',
      endpoint: 'node libs/mcp/src/lib/servers/specialized/gcp-server.js',
      timeout: DEFAULT_TIMEOUT,
    },
    auth: {
      type: 'gcp-service-account',
      credentials: {
        secretName: 'gcp-service-account-key',
        envVar: 'GOOGLE_APPLICATION_CREDENTIALS',
      },
    },
    options: {
      projectId: process.env['GCP_PROJECT_ID'],
      region: process.env['GCP_REGION'] || 'us-central1',
      services: ['bigquery', 'storage', 'secretmanager', 'aiplatform'],
    },
  },
};
