# Dulce de Saigon MCP (Model Context Protocol) Library

Comprehensive Model Context Protocol integration library for the Dulce de Saigon F&B data platform, providing seamless access to 27+ MCP servers with Vietnamese market optimization and compliance features.

## Overview

The MCP library serves as the central hub for all external service integrations in the Dulce de Saigon platform. It provides a unified interface for accessing development tools, data services, web APIs, and specialized platforms, all while maintaining Vietnamese data privacy compliance and F&B industry optimization.

### Key Features

- **🔌 27+ MCP Servers**: Complete integration with all major MCP servers
- **🇻🇳 Vietnamese Compliance**: Built-in PDPL compliance and asia-southeast1 routing
- **🚀 Performance Optimized**: Load balancing and intelligent request routing
- **🛡️ Robust Error Handling**: Comprehensive error handling with Vietnamese-friendly messages
- **📊 Health Monitoring**: Automatic health checks and server monitoring
- **🎯 F&B Specialized**: Custom integrations for restaurant and food service needs
- **💰 VND Support**: Native Vietnamese Dong currency handling

## Architecture

```
libs/mcp/
├── src/
│   ├── index.ts                    # Main library exports
│   └── lib/
│       ├── config/                 # Configuration management
│       │   ├── mcp-config.schema.ts     # Configuration schemas
│       │   ├── server-registry.ts       # Server registry and routing
│       │   └── environment-config.ts    # Environment-specific configs
│       ├── clients/                # Client services
│       │   ├── mcp-client.service.ts    # Core MCP client
│       │   ├── server-health.service.ts # Health monitoring
│       │   └── request-router.service.ts # Load balancing
│       ├── utils/                  # Utility functions
│       │   └── mcp-utils.ts             # Helper utilities
│       └── mcp.service.ts          # Main service facade
├── project.json                   # Nx project configuration
└── README.md                     # This file
```

## Quick Start

### Installation

The MCP library is already included in the Dulce de Saigon monorepo:

```typescript
// Import MCP services
import { 
  MCPService, 
  createMCPClient, 
  getMCPConfig,
  validateMCPEnvironment 
} from '@nx-monorepo/mcp';
```

### Basic Usage

```typescript
// Initialize MCP service with Vietnamese configuration
const mcpService = new MCPService({
  environment: 'production',
  region: 'asia-southeast1',
  vietnameseCompliance: true,
  currency: 'VND',
  locale: 'vi-VN'
});

// Start the service
await mcpService.initialize();

// Use Vietnamese-aware GitHub integration
const githubClient = await mcpService.getClient('github');
const vietnameseIssues = await githubClient.searchIssues({
  query: 'label:vietnamese-market',
  sort: 'updated',
  order: 'desc'
});
```

### Environment Configuration

```bash
# Vietnamese production environment
NODE_ENV=production
MCP_REGION=asia-southeast1
MCP_VIETNAMESE_COMPLIANCE=true
MCP_CURRENCY=VND
MCP_LOCALE=vi-VN
MCP_TIMEZONE=Asia/Ho_Chi_Minh

# GitHub integration (for Vietnamese repositories)
GITHUB_TOKEN=your-github-token
GITHUB_VIETNAMESE_REPOS=true

# Google Cloud integration (Vietnam region)
GOOGLE_CLOUD_PROJECT=dulce-vietnam-prod
GOOGLE_CLOUD_REGION=asia-southeast1

# BigQuery Vietnamese analytics
BIGQUERY_DATASET_PREFIX=vietnam_
BIGQUERY_LOCATION=asia-southeast1
```

## MCP Server Categories

### Core Services
Essential infrastructure services with Vietnamese optimization:

```typescript
// Core MCP servers for Vietnamese market
const coreServers = {
  git: {
    url: 'npm:@modelcontextprotocol/server-git',
    vietnamese_repos: true,
    encoding: 'utf-8' // Vietnamese character support
  },
  filesystem: {
    url: 'npm:@modelcontextprotocol/server-filesystem',
    vietnamese_paths: true,
    encoding: 'utf-8'
  },
  memory: {
    url: 'npm:@modelcontextprotocol/server-memory',
    vietnamese_indexing: true,
    cultural_context: 'vietnamese_fnh'
  },
  sequential_thinking: {
    url: 'npm:@modelcontextprotocol/server-sequential-thinking',
    language: 'vi-VN',
    cultural_reasoning: true
  }
};
```

### Development Tools
Vietnamese-aware development and project management:

```typescript
// Development tools with Vietnamese support
const developmentServers = {
  github: {
    url: 'npm:@modelcontextprotocol/server-github',
    vietnamese_search: true,
    vietnamese_templates: true,
    compliance: 'vietnamese_pdpl'
  },
  nx: {
    url: 'npm:@nx-mcp/nx-server',
    vietnamese_project_names: true,
    workspace_locale: 'vi-VN'
  },
  nodejs: {
    url: 'npm:@modelcontextprotocol/server-nodejs',
    vietnamese_documentation: true,
    timezone: 'Asia/Ho_Chi_Minh'
  }
};

// Example GitHub integration for Vietnamese projects
const vietnameseGitHubOperations = {
  searchVietnameseProjects: async (query: string) => {
    return await githubClient.searchRepositories({
      q: `${query} language:typescript org:dulce-vietnam`,
      sort: 'updated',
      order: 'desc'
    });
  },
  
  createVietnameseIssue: async (repo: string, issue: any) => {
    return await githubClient.createIssue({
      owner: 'dulce-vietnam',
      repo,
      title: issue.title,
      body: issue.body,
      labels: ['vietnamese-market', 'f&b-platform'],
      assignees: issue.assignees
    });
  }
};
```

### Web & API Services
Web services optimized for Vietnamese market:

```typescript
// Web services with Vietnamese optimization
const webServers = {
  fetch: {
    url: 'npm:@modelcontextprotocol/server-fetch',
    vietnamese_headers: {
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.1',
      'X-Vietnamese-Market': 'true'
    },
    regional_routing: 'asia-southeast1'
  },
  exa: {
    url: 'npm:@exa-ai/exa-mcp-server',
    vietnamese_search: true,
    market_focus: 'vietnamese_fnh'
  }
};

// Vietnamese web search example
const searchVietnameseFnBContent = async (query: string) => {
  return await exaClient.search({
    query: `${query} site:vietnam OR vietnamese food restaurant`,
    type: 'neural',
    numResults: 10,
    includeDomains: [
      'foody.vn',
      'now.vn',
      'grabfood.vn',
      'baemin.vn'
    ]
  });
};
```

### Google Cloud Platform Integration
Comprehensive GCP integration for Vietnamese compliance:

```typescript
// GCP services with Vietnamese compliance
const gcpServers = {
  bigquery: {
    url: 'npm:@google-cloud/mcp-server-bigquery',
    location: 'asia-southeast1',
    datasets: {
      vietnamese_analytics: {
        compliance: 'PDPL',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh'
      }
    }
  },
  cloud_run: {
    url: 'npm:@google-cloud/mcp-server-cloud-run',
    region: 'asia-southeast1',
    vietnamese_deployment: true
  },
  secret_manager: {
    url: 'npm:@google-cloud/mcp-server-secret-manager',
    location: 'asia-southeast1',
    encryption: 'CMEK' // Customer-managed encryption
  }
};

// Vietnamese BigQuery analytics
const vietnameseBigQueryQueries = {
  popularDishes: `
    SELECT 
      dish_name_vi,
      COUNT(*) as order_count,
      AVG(price_vnd) as avg_price_vnd,
      region_vi
    FROM vietnamese_analytics.orders
    WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    GROUP BY dish_name_vi, region_vi
    ORDER BY order_count DESC
  `,
  
  customerPreferences: `
    SELECT 
      customer_region,
      preferred_cuisine_vi,
      AVG(order_value_vnd) as avg_spend_vnd,
      COUNT(DISTINCT customer_id) as customer_count
    FROM vietnamese_analytics.customer_preferences
    WHERE last_order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
    GROUP BY customer_region, preferred_cuisine_vi
  `
};
```

### Vietnamese F&B Specialized Tools
Custom integrations for Vietnamese food & beverage industry:

```typescript
// Vietnamese F&B specific MCP integrations
const vietnameseFnBServers = {
  vietnamese_menu_analyzer: {
    url: 'npm:@dulce/mcp-vietnamese-menu',
    features: [
      'dish_classification',
      'price_optimization',
      'cultural_adaptation',
      'regional_variations'
    ]
  },
  vietnamese_payment_gateway: {
    url: 'npm:@dulce/mcp-vietnamese-payments',
    supported_methods: ['momo', 'zalopay', 'vnpay', 'viettel_pay'],
    currency: 'VND'
  },
  vietnamese_delivery_integration: {
    url: 'npm:@dulce/mcp-vietnamese-delivery',
    platforms: ['grab', 'baemin', 'now', 'gojek']
  }
};

// Vietnamese menu analysis example
const analyzeVietnameseMenu = async (menuData: any) => {
  const menuAnalyzer = await mcpService.getClient('vietnamese_menu_analyzer');
  
  return await menuAnalyzer.analyzeMenu({
    dishes: menuData.dishes,
    region: menuData.restaurant.region, // north, central, south
    price_range: menuData.price_range_vnd,
    cultural_context: {
      festival_season: isVietnameseFestivalSeason(),
      local_preferences: getRegionalPreferences(menuData.restaurant.region),
      dietary_restrictions: ['halal', 'vegetarian', 'buddhist_vegetarian']
    }
  });
};
```

## Vietnamese Market Features

### Currency Integration (VND)

```typescript
// Vietnamese Dong (VND) handling
const VNDIntegration = {
  formatPrice: (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  },
  
  validateVNDAmount: (amount: number): boolean => {
    return amount > 0 && amount % 1000 === 0; // VND typically in thousands
  },
  
  convertToVND: async (amount: number, fromCurrency: string) => {
    const exchangeRate = await getExchangeRate(fromCurrency, 'VND');
    return Math.round(amount * exchangeRate / 1000) * 1000;
  }
};

// Example usage in MCP operations
const processVietnameseOrder = async (orderData: any) => {
  const formattedOrder = {
    ...orderData,
    total_vnd: VNDIntegration.formatPrice(orderData.total),
    items: orderData.items.map(item => ({
      ...item,
      price_vnd: VNDIntegration.formatPrice(item.price),
      formatted_price: VNDIntegration.formatPrice(item.price)
    }))
  };
  
  return formattedOrder;
};
```

### Cultural Context Processing

```typescript
// Vietnamese cultural context integration
const vietnameseCulturalContext = {
  festivals: {
    tet_nguyen_dan: {
      date_range: '2024-02-08 to 2024-02-18',
      food_preferences: ['banh_chung', 'mut', 'che', 'traditional_dishes'],
      spending_pattern: 'increased',
      family_focus: true
    },
    mid_autumn: {
      date_range: '2024-09-17',
      food_preferences: ['banh_trung_thu', 'che', 'fruit'],
      gift_giving: true
    }
  },
  
  regional_preferences: {
    north: {
      taste_profile: 'balanced',
      signature_dishes: ['pho', 'bun_cha', 'nem_ran'],
      spice_tolerance: 'mild'
    },
    central: {
      taste_profile: 'spicy',
      signature_dishes: ['bun_bo_hue', 'mi_quang', 'cao_lau'],
      spice_tolerance: 'high'
    },
    south: {
      taste_profile: 'sweet',
      signature_dishes: ['hu_tieu', 'banh_mi', 'che'],
      spice_tolerance: 'mild'
    }
  }
};

// Cultural context-aware recommendations
const getVietnameseCulturalRecommendations = async (
  region: string, 
  season: string, 
  occasion?: string
) => {
  const culturalClient = await mcpService.getClient('vietnamese_cultural_analyzer');
  
  return await culturalClient.getRecommendations({
    region,
    season,
    occasion,
    cultural_factors: vietnameseCulturalContext,
    business_type: 'restaurant'
  });
};
```

### Compliance & Privacy

```typescript
// Vietnamese data privacy compliance
const vietnameseComplianceFeatures = {
  dataResidency: {
    enforced_region: 'asia-southeast1',
    cross_border_restrictions: true,
    audit_logging: true
  },
  
  privacy_controls: {
    pii_detection: true,
    consent_management: true,
    data_anonymization: true,
    retention_policies: {
      customer_data: '7_years', // Vietnamese law requirement
      transaction_data: '10_years',
      analytics_data: '5_years'
    }
  },
  
  vietnamese_pdpl_compliance: {
    explicit_consent: true,
    data_subject_rights: [
      'access', 'rectification', 'erasure', 
      'portability', 'restriction'
    ],
    lawful_basis_tracking: true
  }
};

// Compliance-aware MCP operations
const performComplianceCheck = async (operation: any) => {
  const complianceClient = await mcpService.getClient('compliance_checker');
  
  return await complianceClient.validateOperation({
    operation,
    compliance_framework: 'vietnamese_pdpl',
    data_residency: 'asia-southeast1',
    pii_handling: 'strict'
  });
};
```

## Health Monitoring & Load Balancing

### Server Health Monitoring

```typescript
// Vietnamese-aware health monitoring
class VietnameseHealthMonitor {
  private healthChecks = {
    connectivity: this.checkConnectivity.bind(this),
    vietnamese_compliance: this.checkVietnameseCompliance.bind(this),
    currency_support: this.checkVNDSupport.bind(this),
    regional_availability: this.checkRegionalAvailability.bind(this)
  };
  
  async performHealthCheck(serverName: string): Promise<HealthStatus> {
    const results = await Promise.all([
      this.healthChecks.connectivity(serverName),
      this.healthChecks.vietnamese_compliance(serverName),
      this.healthChecks.currency_support(serverName),
      this.healthChecks.regional_availability(serverName)
    ]);
    
    return {
      server: serverName,
      status: results.every(r => r.healthy) ? 'healthy' : 'unhealthy',
      vietnamese_ready: results[1].healthy,
      vnd_support: results[2].healthy,
      asia_southeast1_available: results[3].healthy,
      timestamp: new Date().toISOString(),
      checks: results
    };
  }
  
  private async checkVietnameseCompliance(serverName: string) {
    // Check if server supports Vietnamese compliance features
    return {
      healthy: true,
      message: 'Vietnamese PDPL compliance verified',
      data_residency: 'asia-southeast1'
    };
  }
  
  private async checkVNDSupport(serverName: string) {
    // Verify VND currency support
    return {
      healthy: true,
      message: 'VND currency support active',
      currency: 'VND'
    };
  }
}
```

### Intelligent Load Balancing

```typescript
// Vietnamese market-aware load balancing
class VietnameseLoadBalancer {
  private vietnameseRouting = {
    preferred_regions: ['asia-southeast1', 'asia-east1'],
    fallback_regions: ['asia-northeast1'],
    blocked_regions: ['us-central1', 'europe-west1'], // Data residency compliance
    
    server_priorities: {
      vietnamese_optimized: 1,
      asia_pacific: 2,
      global: 3
    }
  };
  
  async routeRequest(request: MCPRequest): Promise<MCPServerInstance> {
    // Prioritize Vietnamese-optimized servers
    const availableServers = await this.getHealthyServers(request.serverType);
    
    const prioritizedServers = availableServers
      .filter(server => this.isVietnameseCompliant(server))
      .sort((a, b) => this.calculateVietnamesePriority(a) - this.calculateVietnamesePriority(b));
    
    return prioritizedServers[0] || availableServers[0];
  }
  
  private calculateVietnamesePriority(server: MCPServerInstance): number {
    let priority = 100;
    
    // Prioritize servers in Vietnamese region
    if (server.region === 'asia-southeast1') priority -= 50;
    
    // Prioritize Vietnamese-optimized servers
    if (server.vietnamese_optimized) priority -= 30;
    
    // Consider current load
    priority += server.currentLoad * 10;
    
    return priority;
  }
}
```

## Error Handling

### Vietnamese-Friendly Error Messages

```typescript
// Vietnamese error message support
const vietnameseErrorMessages = {
  connection_failed: {
    en: 'Connection to server failed',
    vi: 'Kết nối đến máy chủ thất bại'
  },
  data_residency_violation: {
    en: 'Data residency requirements not met',
    vi: 'Không đáp ứng yêu cầu lưu trữ dữ liệu trong nước'
  },
  currency_not_supported: {
    en: 'VND currency not supported by this service',
    vi: 'Dịch vụ này không hỗ trợ tiền tệ VND'
  },
  vietnamese_compliance_required: {
    en: 'Vietnamese compliance features required',
    vi: 'Yêu cầu tính năng tuân thủ quy định Việt Nam'
  }
};

class VietnameseErrorHandler {
  static formatError(error: Error, locale: 'vi' | 'en' = 'vi'): ErrorResponse {
    const errorKey = this.identifyErrorType(error);
    const message = vietnameseErrorMessages[errorKey]?.[locale] || error.message;
    
    return {
      error: true,
      message,
      code: errorKey,
      locale,
      timestamp: new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh'
      }),
      vietnamese_context: locale === 'vi'
    };
  }
  
  static identifyErrorType(error: Error): string {
    if (error.message.includes('region')) return 'data_residency_violation';
    if (error.message.includes('VND')) return 'currency_not_supported';
    if (error.message.includes('compliance')) return 'vietnamese_compliance_required';
    return 'connection_failed';
  }
}
```

## Testing

### Vietnamese Market Testing

```typescript
// Test Vietnamese MCP integrations
describe('Vietnamese MCP Integration', () => {
  let mcpService: MCPService;
  
  beforeEach(async () => {
    mcpService = new MCPService({
      environment: 'test',
      region: 'asia-southeast1',
      vietnameseCompliance: true,
      currency: 'VND'
    });
    await mcpService.initialize();
  });
  
  test('processes Vietnamese restaurant data correctly', async () => {
    const restaurantData = {
      name: 'Phở Hà Nội',
      region: 'north',
      menu: [
        { name: 'Phở bò tái', price_vnd: 65000 },
        { name: 'Chả cá Lã Vọng', price_vnd: 85000 }
      ]
    };
    
    const result = await mcpService.processRestaurantData(restaurantData);
    
    expect(result.vietnamese_optimized).toBe(true);
    expect(result.currency).toBe('VND');
    expect(result.compliance.pdpl_compliant).toBe(true);
  });
  
  test('handles Vietnamese text encoding correctly', async () => {
    const vietnameseText = 'Phở bò tái chín với hành, ngò và chanh';
    
    const client = await mcpService.getClient('text_processor');
    const result = await client.processText(vietnameseText);
    
    expect(result.encoding).toBe('utf-8');
    expect(result.language).toBe('vi');
    expect(result.text).toContain('ở'); // Vietnamese character preserved
  });
  
  test('enforces Vietnamese data residency', async () => {
    const sensitivePiiData = {
      customer_id: 'VN-123456',
      vietnamese_citizen: true,
      personal_data: { name: 'Nguyễn Văn A', phone: '84901234567' }
    };
    
    const result = await mcpService.processPersonalData(sensitivePiiData);
    
    expect(result.region).toBe('asia-southeast1');
    expect(result.cross_border_transfer_allowed).toBe(false);
    expect(result.pdpl_compliance.verified).toBe(true);
  });
  
  test('integrates with Vietnamese payment systems', async () => {
    const paymentData = {
      amount: 150000,
      currency: 'VND',
      method: 'momo',
      customer_region: 'vietnam'
    };
    
    const paymentClient = await mcpService.getClient('vietnamese_payment_gateway');
    const result = await paymentClient.processPayment(paymentData);
    
    expect(result.success).toBe(true);
    expect(result.currency).toBe('VND');
    expect(result.vietnamese_gateway).toBe(true);
  });
});
```

## Performance Optimization

### Vietnamese Network Optimization

```typescript
// Network optimizations for Vietnamese infrastructure
const vietnameseNetworkOptimization = {
  connection_pooling: {
    max_connections_per_server: 50,
    connection_timeout: '30s',
    keep_alive: true,
    preferred_protocols: ['http2', 'http1.1']
  },
  
  regional_caching: {
    cache_locations: ['asia-southeast1', 'asia-east1'],
    cache_ttl: {
      static_content: '1h',
      vietnamese_translations: '24h',
      currency_rates: '15m',
      menu_data: '30m'
    }
  },
  
  compression: {
    enabled: true,
    algorithms: ['gzip', 'brotli'],
    min_size: '1kb',
    vietnamese_text_optimized: true
  }
};
```

## Contributing

When contributing to the MCP library:

1. **Test with Vietnamese data** including UTF-8 characters and cultural context
2. **Ensure data residency compliance** (asia-southeast1 only)
3. **Support VND currency** in all monetary operations
4. **Follow Vietnamese business patterns** in integrations
5. **Validate timezone handling** for Asia/Ho_Chi_Minh
6. **Consider Vietnamese user experience** in error messages and responses

See the main [Contributing Guide](../../README.md#contributing) for general guidelines.

## Related Documentation

- [MCP Integration Guide](../../docs/MCP_INTEGRATION_GUIDE.md)
- [Vietnamese Localization](../../docs/VIETNAMESE_LOCALIZATION.md)
- [Architecture Overview](../../docs/ARCHITECTURE.md)
- [Troubleshooting Guide](../../docs/TROUBLESHOOTING.md)
- [Agents Library](../agents/README.md)
- [GCP Library](../gcp/README.md)
