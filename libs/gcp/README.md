# Dulce de Saigon GCP Library (`libs/gcp`)

Core Google Cloud Platform integration library for the Dulce de Saigon F&B data platform, optimized for Vietnamese market requirements and data compliance.

## Overview

This library provides comprehensive GCP service integrations with Vietnamese data localization, compliance features, and F&B-specific optimizations. All services are configured for the asia-southeast1 region to ensure Vietnamese data residency compliance.

### Key Features

- **🇻🇳 Vietnamese Data Compliance**: asia-southeast1 region enforcement
- **🔒 Privacy-First**: Vietnamese Personal Data Protection Law compliance
- **📊 F&B Optimizations**: Restaurant and food service specific configurations
- **⚡ High Performance**: Optimized for Vietnamese network conditions
- **💰 VND Integration**: Native Vietnamese Dong currency support

## Architecture

```
libs/gcp/
├── src/
│   ├── index.ts           # Main entry point (currently stubbed)
│   ├── bigquery/          # BigQuery Vietnamese data analytics
│   ├── pubsub/            # Pub/Sub messaging for Vietnamese market
│   ├── storage/           # Cloud Storage with Vietnamese compliance
│   ├── secret-manager/    # Secure credential management
│   ├── aiplatform/        # Vertex AI for Vietnamese language processing
│   └── compliance/        # Vietnamese regulatory compliance utilities
├── docs/legacy/           # Legacy implementation documentation
├── project.json          # Nx project configuration
└── README.md             # This file
```

## Quick Start

### Installation

This library is part of the Dulce de Saigon monorepo and automatically available to other packages.

```typescript
// Import GCP utilities
import { 
  getPubSub, 
  ensureTopic, 
  getBigQueryClient,
  getVietnameseComplianceConfig 
} from '@dulce/gcp';
```

### Basic Usage

```typescript
// Initialize Vietnamese-compliant GCP services
const pubsub = getPubSub({
  region: 'asia-southeast1',
  vietnameseCompliance: true
});

// Ensure topic exists with Vietnamese naming
await ensureTopic('dulce.vietnam.menu-updates');

// Vietnamese-aware BigQuery client
const bq = getBigQueryClient({
  location: 'asia-southeast1',
  datasetPrefix: 'vietnam_',
  currencyFormat: 'VND'
});
```

## Vietnamese Compliance Features

### Data Localization

All GCP services are configured for Vietnamese data residency:

```typescript
// Vietnamese data localization configuration
const vietnameseConfig = {
  region: 'asia-southeast1',        // Vietnam region
  dataResidency: 'vietnam',         // Vietnamese data only
  crossBorderTransfer: false,       // Prevent data export
  auditLogging: true,               // Full audit trail
  encryptionAtRest: 'CMEK',        // Customer-managed encryption
  complianceMode: 'PDPL'           // Vietnamese PDPL compliance
};
```

### Privacy Controls

Automated privacy protection for Vietnamese personal data:

```typescript
// Vietnamese personal data protection
interface VietnamesePIIConfig {
  classification: 'vietnamese_citizen' | 'foreign_resident' | 'visitor';
  consentRequired: boolean;
  retentionPeriod: number; // days
  anonymizationRequired: boolean;
  crossBorderRestricted: boolean;
}

// Automatic PII detection for Vietnamese data
const detectVietnamesePII = (data: any): boolean => {
  const vietnamesePatterns = [
    /\d{9,12}/, // Vietnamese ID numbers
    /84\d{8,9}/, // Vietnamese phone numbers
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
  ];
  
  return vietnamesePatterns.some(pattern => 
    pattern.test(JSON.stringify(data))
  );
};
```

## Service Integrations

### BigQuery - Vietnamese Analytics

Optimized BigQuery setup for Vietnamese F&B analytics:

```typescript
// Vietnamese F&B analytics configuration
const vietnameseBigQueryConfig = {
  datasets: {
    menu_analytics: {
      location: 'asia-southeast1',
      tables: {
        vietnamese_dishes: {
          clustering: ['region', 'dish_type', 'price_vnd'],
          partitioning: 'order_date'
        },
        customer_preferences: {
          clustering: ['location', 'age_group'],
          privacy: 'high' // Vietnamese PDPL compliance
        }
      }
    }
  },
  currencyColumns: {
    type: 'NUMERIC',
    precision: 15,
    scale: 0, // VND has no decimal places
    description: 'Vietnamese Dong (VND) amounts'
  }
};

// Vietnamese F&B specific queries
const vietnameseQueries = {
  popularDishes: `
    SELECT 
      dish_name_vi as ten_mon,
      COUNT(*) as so_luong_dat,
      AVG(price_vnd) as gia_trung_binh,
      region_vi as khu_vuc
    FROM menu_analytics.vietnamese_dishes
    WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      AND region_vi IN ('Miền Bắc', 'Miền Trung', 'Miền Nam')
    GROUP BY dish_name_vi, region_vi
    ORDER BY so_luong_dat DESC
  `,
  
  seasonalTrends: `
    SELECT 
      EXTRACT(MONTH FROM order_date) as thang,
      dish_category_vi as loai_mon,
      SUM(quantity * price_vnd) as doanh_thu_vnd,
      COUNT(DISTINCT customer_id) as so_khach_hang
    FROM menu_analytics.vietnamese_dishes
    WHERE EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE())
    GROUP BY thang, loai_mon
    ORDER BY thang, doanh_thu_vnd DESC
  `
};
```

### Pub/Sub - Vietnamese Messaging

Vietnamese-optimized message routing and processing:

```typescript
// Vietnamese message topics
const vietnameseTopics = {
  menuUpdates: 'dulce.vietnam.menu-updates',
  orderProcessing: 'dulce.vietnam.orders',
  customerFeedback: 'dulce.vietnam.feedback',
  paymentEvents: 'dulce.vietnam.payments.vnd',
  complianceAlerts: 'dulce.vietnam.compliance'
};

// Vietnamese message structure
interface VietnameseMessage {
  messageId: string;
  timestamp: string; // ISO 8601 in Asia/Ho_Chi_Minh timezone
  locale: 'vi-VN';
  currency: 'VND';
  region: 'north' | 'central' | 'south';
  data: {
    content: any;
    vietnamese_specific?: {
      cultural_context?: string;
      festival_related?: boolean;
      regional_variant?: string;
    };
  };
  compliance: {
    data_residency: 'asia-southeast1';
    pii_detected: boolean;
    consent_required: boolean;
  };
}

// Pub/Sub with Vietnamese compliance
export const publishVietnameseMessage = async (
  topic: string, 
  data: any, 
  vietnameseContext?: any
) => {
  const message: VietnameseMessage = {
    messageId: generateVietnameseId(),
    timestamp: new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh'
    }),
    locale: 'vi-VN',
    currency: 'VND',
    region: detectVietnameseRegion(data),
    data: {
      content: data,
      vietnamese_specific: vietnameseContext
    },
    compliance: {
      data_residency: 'asia-southeast1',
      pii_detected: detectVietnamesePII(data),
      consent_required: requiresConsent(data)
    }
  };
  
  return pubsub.topic(topic).publish(Buffer.from(JSON.stringify(message)));
};
```

### Cloud Storage - Vietnamese Data

Secure file storage with Vietnamese compliance:

```typescript
// Vietnamese-compliant storage configuration
const vietnameseStorageConfig = {
  bucket: 'dulce-vietnam-data',
  location: 'asia-southeast1',
  storageClass: 'REGIONAL',
  encryption: {
    type: 'CMEK', // Customer-managed encryption keys
    keyName: 'vietnam-data-encryption-key'
  },
  lifecycle: {
    vietnamese_pii: {
      deleteAfter: '7years', // Vietnamese legal requirement
      archiveAfter: '1year'
    },
    menu_images: {
      deleteAfter: '3years',
      coldStorageAfter: '1year'
    }
  },
  iamPolicy: {
    dataResidency: 'asia-southeast1',
    crossBorderTransfer: 'denied'
  }
};

// Vietnamese file naming conventions
export const generateVietnameseFilename = (
  type: 'menu' | 'receipt' | 'analytics' | 'user_data',
  context: any
): string => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const region = context.region || 'vietnam';
  const id = context.id || generateVietnameseId();
  
  return `${type}/${region}/${timestamp}/${id}.json`;
};

// Example usage
const uploadVietnameseMenu = async (menuData: any, restaurant: any) => {
  const filename = generateVietnameseFilename('menu', {
    region: restaurant.region,
    id: restaurant.id
  });
  
  const vietnameseMetadata = {
    language: 'vi-VN',
    currency: 'VND',
    region: restaurant.region,
    compliance: 'PDPL',
    cultural_context: restaurant.cultural_context
  };
  
  return storage
    .bucket(vietnameseStorageConfig.bucket)
    .file(filename)
    .save(JSON.stringify(menuData), {
      metadata: vietnameseMetadata,
      resumable: false
    });
};
```

### Vertex AI - Vietnamese Language Processing

AI services optimized for Vietnamese language and culture:

```typescript
// Vietnamese AI configuration
const vietnameseAIConfig = {
  region: 'asia-southeast1',
  models: {
    vietnamese_nlp: 'vietnamese-language-model-v2',
    food_classification: 'vietnamese-food-classifier',
    sentiment_analysis: 'vietnamese-sentiment-analyzer',
    price_prediction: 'vietnamese-price-predictor'
  },
  culturalContext: {
    regions: ['north', 'central', 'south'],
    festivals: ['tet', 'mid_autumn', 'teachers_day'],
    foodCategories: ['mon_chinh', 'mon_phu', 'do_uong', 'trang_mieng']
  }
};

// Vietnamese text processing
export const processVietnameseText = async (
  text: string, 
  context: 'menu' | 'review' | 'order' | 'support'
) => {
  const request = {
    endpoint: `projects/${PROJECT_ID}/locations/asia-southeast1/endpoints/${VIETNAMESE_NLP_ENDPOINT}`,
    instances: [{
      content: text,
      language: 'vi',
      context: context,
      cultural_params: {
        region: 'vietnam',
        business_type: 'fnb',
        formality_level: 'polite' // Vietnamese cultural norm
      }
    }]
  };
  
  return aiplatform.predict(request);
};

// Vietnamese menu analysis
export const analyzeVietnameseMenu = async (menuItems: any[]) => {
  const analysis = await processVietnameseText(
    JSON.stringify(menuItems), 
    'menu'
  );
  
  return {
    popularity_predictions: analysis.popularity_scores,
    price_recommendations: analysis.price_suggestions.map(price => ({
      ...price,
      currency: 'VND',
      formatted: formatVND(price.amount)
    })),
    cultural_insights: analysis.cultural_relevance,
    regional_variations: analysis.regional_preferences
  };
};
```

## Vietnamese F&B Utilities

### Currency Handling

Vietnamese Dong (VND) specific utilities:

```typescript
// Vietnamese currency utilities
export const VND = {
  format: (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },
  
  parse: (vndString: string): number => {
    return parseInt(vndString.replace(/[₫.,\s]/g, ''), 10);
  },
  
  validate: (amount: number): boolean => {
    return amount > 0 && amount % 1000 === 0; // VND typically in thousands
  },
  
  convertToStandard: (amount: number): number => {
    return Math.round(amount / 1000) * 1000; // Round to nearest thousand
  }
};

// Example usage
console.log(VND.format(150000)); // "₫150.000"
console.log(VND.parse("₫150.000")); // 150000
console.log(VND.validate(150000)); // true
console.log(VND.validate(150001)); // false (not in thousands)
```

### Vietnamese Business Logic

F&B business logic specific to Vietnamese market:

```typescript
// Vietnamese business hours
export const vietnameseBusinessHours = {
  standard: {
    open: '06:00',
    close: '22:00',
    lunch_break: { start: '14:00', end: '17:00' } // Common in Vietnam
  },
  street_food: {
    open: '05:30',
    close: '23:00',
    peak_hours: ['06:00-08:00', '11:30-13:30', '17:30-20:00']
  },
  formal_restaurant: {
    open: '10:00',
    close: '22:00',
    reservation_required: true
  }
};

// Vietnamese payment methods priority
export const vietnamesePaymentMethods = [
  { method: 'momo', priority: 1, usage: '65%' },
  { method: 'zalopay', priority: 2, usage: '45%' },
  { method: 'cash', priority: 3, usage: '80%' },
  { method: 'bank_transfer', priority: 4, usage: '30%' },
  { method: 'vnpay', priority: 5, usage: '25%' }
];

// Vietnamese regional preferences
export const vietnameseRegionalPreferences = {
  north: {
    taste_profile: 'balanced',
    preferred_dishes: ['pho', 'bun_cha', 'nem_ran'],
    spice_level: 'mild',
    sweetness: 'low'
  },
  central: {
    taste_profile: 'spicy',
    preferred_dishes: ['bun_bo_hue', 'mi_quang', 'cao_lau'],
    spice_level: 'high',
    sweetness: 'medium'
  },
  south: {
    taste_profile: 'sweet',
    preferred_dishes: ['hu_tieu', 'banh_mi', 'che'],
    spice_level: 'mild',
    sweetness: 'high'
  }
};
```

## Error Handling & Logging

### Vietnamese-Compliant Logging

```typescript
// Vietnamese compliance logging
interface VietnameseLogEntry {
  timestamp: string; // Asia/Ho_Chi_Minh timezone
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  region: 'asia-southeast1';
  message: string;
  vietnamese_context?: {
    user_locale: 'vi-VN';
    currency: 'VND';
    region: 'north' | 'central' | 'south';
    pii_detected: boolean;
    compliance_flag: 'PDPL_compliant';
  };
  metadata: {
    request_id: string;
    user_id?: string; // Hashed if PII
    session_id?: string;
    ip_address?: string; // Anonymized for privacy
  };
}

export const logVietnameseEvent = (
  level: string,
  message: string,
  context?: any
) => {
  const logEntry: VietnameseLogEntry = {
    timestamp: new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh'
    }),
    level: level as any,
    service: 'dulce-gcp',
    region: 'asia-southeast1',
    message,
    vietnamese_context: context?.vietnamese_context,
    metadata: {
      request_id: context?.request_id || generateVietnameseId(),
      user_id: context?.user_id ? hashPII(context.user_id) : undefined,
      session_id: context?.session_id,
      ip_address: context?.ip_address ? anonymizeIP(context.ip_address) : undefined
    }
  };
  
  console.log(JSON.stringify(logEntry));
};
```

## Testing

### Vietnamese Data Testing

```typescript
// Vietnamese test data for GCP services
export const vietnameseTestData = {
  restaurants: [
    {
      name: 'Phở Hà Nội',
      region: 'north',
      specialties: ['phở bò', 'chả cá'],
      price_range_vnd: [50000, 80000]
    },
    {
      name: 'Bún Bò Huế Authentic',
      region: 'central',
      specialties: ['bún bò huế', 'bánh bèo'],
      price_range_vnd: [40000, 70000]
    },
    {
      name: 'Bánh Mì Sài Gòn',
      region: 'south',
      specialties: ['bánh mì thịt nướng', 'chè'],
      price_range_vnd: [25000, 45000]
    }
  ],
  customers: [
    {
      id: 'VN-CUST-001',
      region: 'hanoi',
      preferences: ['món_bắc', 'không_cay'],
      payment_method: 'momo'
    }
  ],
  orders: [
    {
      id: 'VN-ORDER-001',
      items: [
        { name: 'Phở bò tái', price_vnd: 65000, quantity: 1 },
        { name: 'Chả cá', price_vnd: 55000, quantity: 1 }
      ],
      total_vnd: 120000,
      payment_method: 'momo',
      timestamp: '2024-01-15T12:30:00+07:00' // ICT timezone
    }
  ]
};

// Test Vietnamese GCP integrations
describe('Vietnamese GCP Integration', () => {
  test('BigQuery handles Vietnamese characters correctly', async () => {
    const query = `
      SELECT dish_name_vi 
      FROM test_dataset.vietnamese_menu 
      WHERE dish_name_vi LIKE '%phở%'
    `;
    
    const [rows] = await bq.query(query);
    expect(rows[0].dish_name_vi).toContain('ở'); // Vietnamese character
  });
  
  test('Pub/Sub processes Vietnamese messages', async () => {
    const message = {
      content: 'Đặt món phở bò tái',
      price_vnd: 65000,
      region: 'hanoi'
    };
    
    const messageId = await publishVietnameseMessage(
      'test-topic', 
      message
    );
    expect(messageId).toBeDefined();
  });
  
  test('Storage handles Vietnamese file names', async () => {
    const filename = generateVietnameseFilename('menu', {
      region: 'saigon',
      restaurant: 'Phở Sài Gòn'
    });
    
    expect(filename).toMatch(/^menu\/saigon\/\d{4}-\d{2}-\d{2}\//);
  });
});
```

## Migration from Legacy

The current implementation includes stub functions. Legacy implementations can be found in:

- `docs/legacy/saigon-signals/libs/gcp/README.md`
- `docs/legacy/saigon-signals/libs/gcp/terraform/`

### Migration Plan

1. **Phase 1**: Port core BigQuery and Pub/Sub functionality
2. **Phase 2**: Implement Vietnamese compliance features
3. **Phase 3**: Add Vertex AI Vietnamese language processing
4. **Phase 4**: Complete Storage and Secret Manager integration

## Contributing

When contributing to the GCP library:

1. **Follow Vietnamese data residency** requirements (asia-southeast1 only)
2. **Test with Vietnamese data** including UTF-8 characters
3. **Ensure PDPL compliance** for all data operations
4. **Consider Vietnamese business contexts** in logic
5. **Use VND currency** for all monetary operations
6. **Validate timezone handling** for Asia/Ho_Chi_Minh

See the main [Contributing Guide](../../README.md#contributing) for general guidelines.

## Related Documentation

- [Vietnamese Localization Guide](../../docs/VIETNAMESE_LOCALIZATION.md)
- [Vietnamese Compliance Rules](../../.kilocode/rules/vietnamese-compliance.md)
- [Architecture Overview](../../docs/ARCHITECTURE.md)
- [Troubleshooting Guide](../../docs/TROUBLESHOOTING.md)
- [Legacy GCP Documentation](docs/legacy/saigon-signals/libs/gcp/README.md)
