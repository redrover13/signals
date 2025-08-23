# Dulce de Saigon Agents Service

AI-powered agent service for the Dulce de Saigon F&B platform, providing intelligent automation and analytics specifically designed for the Vietnamese market.

## Overview

The Agents service orchestrates AI-powered tasks for restaurant operations, customer service, and data analysis. Built with Fastify and Google Cloud Vertex AI, it provides Vietnamese-aware AI capabilities for the F&B industry.

### Key Features

- **🤖 Intelligent Automation**: AI agents for restaurant operations
- **🇻🇳 Vietnamese Context**: Native Vietnamese language processing
- **📊 Predictive Analytics**: Menu optimization and sales forecasting
- **💬 Customer Service**: Vietnamese chatbot and support automation
- **📱 Real-time Processing**: Event-driven agent orchestration

## Architecture

```
apps/agents/
├── src/
│   └── main.ts              # Main service entry point
├── project.json             # Nx project configuration
├── tsconfig.json           # TypeScript configuration
└── README.md              # This file

Integration:
├── libs/agents/           # Shared agent logic and utilities
├── adk/services/vertex/   # Vertex AI integration
└── Google Cloud Pub/Sub   # Message orchestration
```

## Quick Start

### Prerequisites

- Node.js 18+ or 22+
- Google Cloud Platform account with Vertex AI enabled
- Vietnamese language models configured
- Pub/Sub topics created

### Running Locally

```bash
# Install dependencies (from root)
pnpm install

# Set up environment variables
cp .env.example .env

# Start the agents service
pnpm nx serve agents

# Or run in development mode
pnpm nx run agents:dev
```

The service will be available at `http://localhost:3000`

### Environment Variables

```bash
# Required
GCP_PROJECT_ID=your-project-id                    # Google Cloud Project
GCP_LOCATION=asia-southeast1                      # Vietnamese data residency
VERTEX_AI_ENDPOINT_ID=your-endpoint-id            # Vertex AI endpoint

# Vietnamese Configuration
VIETNAMESE_MODEL_ID=vietnamese-llm-model          # Vietnamese language model
VIETNAMESE_LOCALE=vi-VN                           # Vietnamese locale
TIMEZONE=Asia/Ho_Chi_Minh                         # Vietnam timezone

# Pub/Sub Configuration
AGENTS_TOPIC=dulce.agents                         # Agent task topic
AGENTS_SUBSCRIPTION=dulce.agents.sub              # Agent subscription

# Logging
LOG_LEVEL=info                                    # Logging level
VIETNAMESE_LOGGING=true                           # Vietnamese log format
```

## API Endpoints

### Agent Prediction

Process AI requests with Vietnamese context awareness.

#### `POST /api/v1/agent-predict`

Performs AI predictions using Vertex AI with Vietnamese market optimization.

**Request Body:**
```json
{
  "instances": [
    {
      "text": "Phân tích xu hướng món ăn Việt Nam",
      "context": "vietnamese_fnh",
      "parameters": {
        "temperature": 0.7,
        "max_tokens": 1000,
        "vietnamese_specific": true
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "predictions": [
    {
      "generated_text": "Dựa trên dữ liệu phân tích...",
      "confidence": 0.95,
      "vietnamese_context": true,
      "market_insights": {
        "trending_dishes": ["Phở", "Bánh mì", "Gỏi cuốn"],
        "seasonal_preferences": "Mùa hè - món mát",
        "regional_variations": "Miền Nam - vị ngọt"
      }
    }
  ]
}
```

**Vietnamese Example:**
```bash
curl -X POST http://localhost:3000/api/v1/agent-predict \
  -H "Content-Type: application/json" \
  -d '{
    "instances": [{
      "text": "Tôi muốn mở một quán phở ở Hà Nội. Hãy đưa ra lời khuyên về thực đơn và giá cả.",
      "context": "vietnamese_business_advice",
      "parameters": {
        "region": "hanoi",
        "business_type": "pho_restaurant",
        "vietnamese_specific": true
      }
    }]
  }'
```

### Health Check

Monitor agent service health and Vietnamese-specific configurations.

#### `GET /health`

Returns service status with Vietnamese market readiness.

**Response:**
```json
{
  "status": "ok",
  "vietnamese_ready": true,
  "vertex_ai_connected": true,
  "timezone": "Asia/Ho_Chi_Minh",
  "locale": "vi-VN"
}
```

### Agent Task Management

Start and manage agent tasks via Pub/Sub integration.

#### `POST /agents/start`

Initiates agent tasks with Vietnamese context.

**Request:**
```json
{
  "task": "Lập kế hoạch thực đơn mùa Tết cho nhà hàng",
  "priority": "high",
  "vietnamese_context": {
    "region": "south",
    "festival": "tet_nguyen_dan",
    "budget_range": "mid_range"
  }
}
```

## Vietnamese AI Capabilities

### Language Processing

The agents service provides specialized Vietnamese language processing:

```typescript
// Vietnamese text analysis
const vietnameseAnalysis = {
  sentiment: "positive", // tích cực, tiêu cực, trung tính
  entities: [
    { text: "phở", type: "dish", confidence: 0.99 },
    { text: "Hà Nội", type: "location", confidence: 0.95 }
  ],
  intent: "restaurant_recommendation",
  dialect: "northern_vietnamese"
};

// Vietnamese menu optimization
const menuOptimization = {
  recommendations: [
    {
      dish: "Phở bò tái",
      price_vnd: 65000,
      popularity_score: 0.92,
      seasonal_demand: "high_winter"
    }
  ],
  regional_preferences: {
    north: "vị đậm đà",
    central: "vị cay",
    south: "vị ngọt"
  }
};
```

### Cultural Context AI

AI models trained on Vietnamese cultural and business contexts:

```typescript
// Vietnamese business context
const vietnameseBusinessContext = {
  business_hours: {
    typical: "06:00-22:00",
    lunch_peak: "11:30-13:30",
    dinner_peak: "17:30-20:00"
  },
  payment_preferences: ["momo", "zalopay", "cash", "bank_transfer"],
  seasonal_patterns: {
    tet: "higher_spending_traditional_foods",
    summer: "cold_drinks_light_meals",
    rainy: "hot_soups_comfort_food"
  },
  regional_tastes: {
    hanoi: "traditional_balanced",
    hcmc: "sweet_international",
    hue: "spicy_royal_cuisine"
  }
};
```

### Vietnamese F&B AI Models

Specialized AI models for Vietnamese F&B market:

```typescript
// Vietnamese dish recognition
const dishRecognition = {
  model: "vietnamese-food-classifier-v2",
  categories: [
    "món_chính", "món_phụ", "đồ_uống", 
    "tráng_miệng", "món_chay", "bánh_kẹo"
  ],
  regional_variants: true,
  ingredients_analysis: true
};

// Price prediction for Vietnamese market
const pricePredictor = {
  currency: "VND",
  factors: [
    "location_tier", "ingredient_cost", "competition",
    "customer_segment", "seasonal_demand"
  ],
  accuracy: 0.87,
  update_frequency: "daily"
};
```

## Agent Types

### Menu Optimization Agent

Analyzes and optimizes restaurant menus for Vietnamese market:

```typescript
interface MenuOptimizationAgent {
  task: "menu_optimization";
  input: {
    current_menu: MenuItem[];
    sales_data: SalesData[];
    target_region: "north" | "central" | "south";
    budget_constraints: number; // in VND
  };
  output: {
    recommendations: MenuRecommendation[];
    price_adjustments: PriceAdjustment[];
    seasonal_suggestions: SeasonalMenu[];
    profit_projection: number; // in VND
  };
}
```

### Customer Service Agent

Vietnamese-speaking customer service automation:

```typescript
interface CustomerServiceAgent {
  task: "customer_service";
  capabilities: [
    "vietnamese_conversation",
    "order_assistance",
    "complaint_resolution",
    "menu_explanation"
  ];
  response_time: "< 2 seconds";
  accuracy: "95% vietnamese_understanding";
}
```

### Sales Analytics Agent

Analyzes sales patterns for Vietnamese F&B market:

```typescript
interface SalesAnalyticsAgent {
  task: "sales_analysis";
  vietnamese_factors: {
    lunar_calendar_events: boolean;
    weather_correlation: boolean;
    regional_preferences: boolean;
    festival_impacts: boolean;
  };
  output: {
    trends: SalesTrend[];
    forecasts: SalesForecast[];
    recommendations: BusinessRecommendation[];
  };
}
```

## Integration with Vietnamese Services

### Payment System Integration

```typescript
// Vietnamese payment system integration
const vietnamesePayments = {
  momo: {
    api_endpoint: "https://payment.momo.vn/v2/gateway/api",
    supported_currencies: ["VND"],
    features: ["qr_payment", "wallet_payment", "installment"]
  },
  zalopay: {
    api_endpoint: "https://api.zalopay.vn/v001/tpe",
    supported_currencies: ["VND"],
    features: ["qr_payment", "app_payment", "web_payment"]
  }
};
```

### Delivery Platform Integration

```typescript
// Vietnamese delivery platforms
const deliveryIntegrations = {
  grab: {
    api_endpoint: "https://api.grab.com/partner/v1",
    coverage: "nationwide",
    commission: "18-25%"
  },
  baemin: {
    api_endpoint: "https://api.baemin.vn/v1",
    coverage: "major_cities",
    commission: "15-20%"
  }
};
```

## Performance & Monitoring

### Vietnamese Market Metrics

```typescript
// Performance metrics for Vietnamese market
const vietnameseMetrics = {
  response_time: {
    vietnamese_text: "< 500ms",
    translation: "< 200ms",
    price_calculation: "< 100ms"
  },
  accuracy: {
    vietnamese_nlp: "96%",
    dish_recognition: "94%",
    price_prediction: "87%"
  },
  availability: {
    target: "99.9%",
    downtime_window: "02:00-04:00 ICT" // Low traffic hours
  }
};
```

### Logging & Compliance

```typescript
// Vietnamese compliance logging
const complianceLogging = {
  data_residency: "asia-southeast1",
  log_retention: "7_years", // Vietnamese law requirement
  privacy_flags: {
    personal_data: true,
    vietnamese_citizen: true,
    consent_tracked: true
  },
  audit_trail: true
};
```

## Development & Testing

### Local Development

```bash
# Start with Vietnamese configuration
LOCALE=vi-VN TIMEZONE=Asia/Ho_Chi_Minh pnpm nx serve agents

# Run with Vietnamese test data
pnpm nx test agents --testNamePattern="vietnamese"

# Debug Vietnamese language processing
DEBUG=vietnamese:* pnpm nx serve agents
```

### Testing Vietnamese Features

```bash
# Test Vietnamese text processing
pnpm nx test agents --grep "vietnamese text"

# Test VND currency handling
pnpm nx test agents --grep "VND currency"

# Test cultural context understanding
pnpm nx test agents --grep "cultural context"

# Performance testing with Vietnamese data
pnpm nx test agents:performance --vietnamese-dataset
```

### Example Test Cases

```typescript
describe('Vietnamese Agents', () => {
  test('processes Vietnamese restaurant queries', async () => {
    const response = await agent.process({
      text: "Tôi muốn mở quán phở ở Sài Gòn",
      context: "business_consultation"
    });
    
    expect(response.language).toBe('vi');
    expect(response.recommendations).toContainEqual(
      expect.objectContaining({
        dish_type: 'phở',
        region: 'saigon',
        price_range_vnd: expect.any(Number)
      })
    );
  });

  test('handles Vietnamese currency calculations', () => {
    const price = calculateOptimalPrice({
      dish: 'phở_bò',
      location: 'hanoi',
      target_margin: 0.3
    });
    
    expect(price.currency).toBe('VND');
    expect(price.amount).toBeGreaterThan(50000);
    expect(price.amount).toBeLessThan(100000);
  });
});
```

## Deployment

### Production Configuration

```bash
# Vietnamese production settings
NODE_ENV=production
LOCALE=vi-VN
TIMEZONE=Asia/Ho_Chi_Minh
GCP_LOCATION=asia-southeast1
VERTEX_AI_REGION=asia-southeast1
LOG_LEVEL=info
VIETNAMESE_COMPLIANCE=true
```

### Scaling Configuration

```yaml
# Kubernetes deployment for Vietnamese market
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dulce-agents
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: agents
        env:
        - name: LOCALE
          value: "vi-VN"
        - name: TIMEZONE
          value: "Asia/Ho_Chi_Minh"
        - name: VIETNAMESE_READY
          value: "true"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

## Troubleshooting

### Common Vietnamese-Specific Issues

**Vietnamese text not displaying correctly:**
```bash
# Check UTF-8 encoding
echo $LANG
export LANG=vi_VN.UTF-8

# Verify font support
fc-list | grep -i vietnam
```

**VND currency formatting issues:**
```typescript
// Correct VND formatting
const formatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  minimumFractionDigits: 0
});
```

**Timezone problems:**
```bash
# Set correct timezone
export TZ=Asia/Ho_Chi_Minh
timedatectl set-timezone Asia/Ho_Chi_Minh
```

### Vertex AI Issues

**Model not responding:**
```bash
# Check endpoint status
gcloud ai endpoints list --region=asia-southeast1

# Test endpoint connectivity
gcloud ai endpoints predict ENDPOINT_ID --region=asia-southeast1
```

**Vietnamese model accuracy low:**
```typescript
// Verify Vietnamese model configuration
const modelConfig = {
  temperature: 0.7, // Adjust for Vietnamese text
  top_p: 0.8,
  vietnamese_specific: true,
  cultural_context: 'vietnamese_fnh'
};
```

## Contributing

When contributing to the agents service:

1. **Test with Vietnamese data** including special characters and cultural context
2. **Follow Vietnamese business practices** in AI model design
3. **Ensure data privacy compliance** with Vietnamese laws
4. **Test timezone handling** for Asia/Ho_Chi_Minh
5. **Validate currency calculations** for VND
6. **Consider regional variations** across Vietnam

See the main [Contributing Guide](../../README.md#contributing) for general guidelines.

## Related Documentation

- [Agents Library](../../libs/agents/README.md) - Shared agent utilities
- [API Service](../api/README.md) - REST API integration
- [Vietnamese Localization](../../docs/VIETNAMESE_LOCALIZATION.md) - Vietnamese features
- [Troubleshooting Guide](../../docs/TROUBLESHOOTING.md) - Common issues
- [Architecture Overview](../../docs/ARCHITECTURE.md) - System design
