# Dulce de Saigon Web Application

Next.js-based web application for the Dulce de Saigon F&B data platform, designed specifically for the Vietnamese market with full localization support.

## Overview

The web application provides a user-friendly interface for restaurant owners, managers, and customers to interact with the Dulce de Saigon platform. Built with Next.js 13+ using the app directory structure for optimal performance and Vietnamese market accessibility.

## Features

- **🇻🇳 Vietnamese-First Design**: Full Vietnamese language support with proper UTF-8 encoding
- **📱 Mobile-Responsive**: Optimized for Vietnamese mobile usage patterns
- **💰 VND Integration**: Native Vietnamese Dong currency support
- **🎨 Cultural Adaptation**: Vietnamese-appropriate UI/UX design
- **📊 Analytics Tracking**: Vietnamese market analytics and user behavior tracking
- **🔒 Privacy Compliant**: Adherence to Vietnamese data privacy laws

## Architecture

```
apps/web/
├── app/                    # Next.js 13+ app directory
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Homepage component
├── site/                  # Legacy pages structure
│   ├── components/        # Reusable UI components
│   │   └── Track.tsx      # Analytics tracking component
│   └── pages/             # Page components
│       ├── api/           # API route handlers
│       └── index.tsx      # Main site page
├── next.config.js         # Next.js configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Quick Start

### Prerequisites

- Node.js 18+ or 22+
- PNPM package manager
- Vietnamese fonts installed on system
- Modern web browser with UTF-8 support

### Development

```bash
# Install dependencies (from root)
pnpm install

# Start development server
pnpm nx serve web

# Build for production
pnpm nx build web

# Export static site
pnpm nx export web
```

The application will be available at `http://localhost:4200`

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_BASE=http://localhost:3000    # API service URL

# Vietnamese Market Configuration
NEXT_PUBLIC_LOCALE=vi-VN                      # Vietnamese locale
NEXT_PUBLIC_CURRENCY=VND                      # Vietnamese Dong
NEXT_PUBLIC_TIMEZONE=Asia/Ho_Chi_Minh         # Vietnam timezone

# Analytics
NEXT_PUBLIC_GA_ID=GA4-MEASUREMENT-ID          # Google Analytics 4
NEXT_PUBLIC_VIETNAMESE_ANALYTICS=true         # Vietnamese-specific tracking
```

## Vietnamese Localization

### Language Support

The application provides comprehensive Vietnamese language support:

```typescript
// Example Vietnamese text configuration
const vietnameseTexts = {
  welcome: "Chào mừng đến với Dulce de Saigon",
  menu: "Thực đơn",
  order: "Đặt món",
  payment: "Thanh toán",
  history: "Lịch sử đơn hàng"
};

// Layout with Vietnamese language support
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Dulce de Saigon - Nền tảng dữ liệu F&B Việt Nam</title>
      </head>
      <body className="vietnamese-optimized">{children}</body>
    </html>
  );
}
```

### Currency Formatting

Vietnamese Dong (VND) formatting with proper localization:

```typescript
// Vietnamese currency formatting utility
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Usage examples
formatVND(150000);     // "₫150.000"
formatVND(1500000);    // "₫1.500.000"
formatVND(50000);      // "₫50.000"
```

### Date & Time Localization

Vietnamese date and time formatting:

```typescript
// Vietnamese date formatting
export const formatVietnameseDate = (date: Date): string => {
  return date.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Business hours in Vietnamese context
export const vietnameseBusinessHours = {
  open: '08:00',
  close: '22:00',
  timezone: 'Asia/Ho_Chi_Minh',
  lunchBreak: { start: '12:00', end: '13:00' }
};
```

## Components

### Analytics Tracking

The `Track.tsx` component provides Vietnamese-compliant analytics:

```typescript
// Enhanced Vietnamese analytics tracking
export default function Track() {
  const path = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const payload = {
      type: "site.view",
      page: path || "/",
      utm: Object.fromEntries(searchParams.entries()),
      ts: new Date().toISOString(),
      locale: 'vi-VN',
      timezone: 'Asia/Ho_Chi_Minh',
      currency: 'VND',
      vietnamese_user: true
    };

    // Send to Vietnamese-compliant analytics endpoint
    fetch(process.env.NEXT_PUBLIC_API_BASE + "/events", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "accept-language": "vi-VN"
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silent fail for privacy compliance
    });
  }, [path, searchParams]);

  return null;
}
```

### Vietnamese UI Components

Example Vietnamese-optimized UI components:

```typescript
// Vietnamese Menu Component
const MenuComponent = () => {
  return (
    <div className="vietnamese-menu">
      <h2>Thực đơn hôm nay</h2>
      <div className="menu-categories">
        <button>Món chính</button>
        <button>Món phụ</button>
        <button>Đồ uống</button>
        <button>Tráng miệng</button>
      </div>
    </div>
  );
};

// Vietnamese Payment Component
const PaymentComponent = () => {
  return (
    <div className="payment-options">
      <h3>Phương thức thanh toán</h3>
      <div className="vietnamese-payments">
        <button>Momo</button>
        <button>ZaloPay</button>
        <button>VNPay</button>
        <button>Tiền mặt</button>
      </div>
    </div>
  );
};
```

## Styling & Design

### Vietnamese Typography

CSS configuration for Vietnamese text rendering:

```css
/* Vietnamese-optimized typography */
.vietnamese-text {
  font-family: 'Inter', 'Roboto', 'Segoe UI', sans-serif;
  font-feature-settings: 'kern' 1, 'liga' 1;
  line-height: 1.6;
  letter-spacing: 0.01em;
}

/* Vietnamese character support */
@font-face {
  font-family: 'VietnameseFont';
  src: url('/fonts/vietnamese-font.woff2') format('woff2');
  unicode-range: U+1EA0-1EF9; /* Vietnamese diacriticals */
}

/* Vietnamese number formatting */
.vnd-currency {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
```

### Mobile-First Design

Responsive design optimized for Vietnamese mobile usage:

```css
/* Vietnamese mobile optimization */
@media (max-width: 768px) {
  .vietnamese-mobile {
    font-size: 16px; /* Prevent zoom on iOS */
    touch-action: manipulation;
    -webkit-text-size-adjust: 100%;
  }
  
  .payment-buttons {
    min-height: 44px; /* Vietnamese touch target size */
    margin: 8px 0;
  }
}

/* Vietnamese color scheme */
:root {
  --vietnamese-red: #DA020E;
  --vietnamese-yellow: #FFCD00;
  --vietnamese-gold: #FFD700;
  --vietnamese-green: #228B22;
}
```

## Pages & Routing

### Main Pages

```typescript
// Homepage with Vietnamese content
const HomePage = () => {
  return (
    <main>
      <h1>Chào mừng đến với Dulce de Saigon</h1>
      <p>Nền tảng dữ liệu F&B hàng đầu Việt Nam</p>
      <div className="vietnamese-features">
        <FeatureCard title="Thực đơn thông minh" />
        <FeatureCard title="Phân tích dữ liệu" />
        <FeatureCard title="Thanh toán đa dạng" />
      </div>
    </main>
  );
};

// Menu page with Vietnamese categories
const MenuPage = () => {
  const vietnameseCategories = [
    'Món Bắc', 'Món Trung', 'Món Nam',
    'Món chay', 'Đồ uống', 'Tráng miệng'
  ];
  
  return (
    <div className="menu-page">
      <h1>Thực đơn</h1>
      {vietnameseCategories.map(category => (
        <MenuCategory key={category} name={category} />
      ))}
    </div>
  );
};
```

### API Routes

Vietnamese-aware API route handlers:

```typescript
// API route for Vietnamese data
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set Vietnamese locale headers
  res.setHeader('Content-Language', 'vi-VN');
  res.setHeader('X-Vietnamese-Compliant', 'true');
  
  const data = {
    message: "Dữ liệu đã được xử lý thành công",
    timestamp: new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh'
    }),
    currency: 'VND'
  };
  
  res.status(200).json(data);
}
```

## Performance Optimization

### Vietnamese-Specific Optimizations

```javascript
// Next.js configuration for Vietnamese market
const nextConfig = {
  // Vietnamese locale configuration
  i18n: {
    locales: ['vi', 'en'],
    defaultLocale: 'vi',
    localeDetection: true
  },
  
  // Vietnamese image optimization
  images: {
    domains: ['vietnamese-cdn.example.com'],
    deviceSizes: [640, 750, 828, 1080, 1200], // Common Vietnamese device sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  
  // Vietnamese font optimization
  optimizeFonts: true,
  
  // SEO for Vietnamese search engines
  generateBuildId: () => 'vietnamese-build-' + Date.now()
};
```

### Caching Strategy

```typescript
// Vietnamese-aware caching
const cacheConfig = {
  // Cache Vietnamese content differently
  vietnamese: {
    ttl: 3600, // 1 hour for Vietnamese content
    key: 'vi-VN'
  },
  currency: {
    ttl: 300, // 5 minutes for VND rates
    key: 'VND'
  },
  timezone: 'Asia/Ho_Chi_Minh'
};
```

## Testing

### Vietnamese Content Testing

```bash
# Run tests with Vietnamese locale
LOCALE=vi-VN pnpm nx test web

# Test Vietnamese character rendering
pnpm nx test web --testNamePattern="vietnamese"

# Test VND currency formatting
pnpm nx test web --testNamePattern="currency"

# Test date/time localization
pnpm nx test web --testNamePattern="datetime"
```

### Example Test Cases

```typescript
// Vietnamese localization tests
describe('Vietnamese Localization', () => {
  test('displays Vietnamese text correctly', () => {
    render(<HomePage />);
    expect(screen.getByText('Chào mừng đến với Dulce de Saigon')).toBeInTheDocument();
  });

  test('formats VND currency correctly', () => {
    const formatted = formatVND(150000);
    expect(formatted).toBe('₫150.000');
  });

  test('handles Vietnamese characters in input', () => {
    const input = 'Phở bò Hà Nội';
    expect(isValidVietnameseText(input)).toBe(true);
  });
});
```

## Deployment

### Production Build

```bash
# Build for Vietnamese market
NODE_ENV=production LOCALE=vi-VN pnpm nx build web

# Generate static export for CDN
pnpm nx export web

# Optimize for Vietnamese users
pnpm nx build web --prod --vietnamese-optimized
```

### CDN Configuration

```javascript
// CDN configuration for Vietnamese users
const cdnConfig = {
  regions: ['asia-southeast1'], // Vietnam region priority
  headers: {
    'Content-Language': 'vi-VN',
    'X-Vietnamese-Optimized': 'true'
  },
  caching: {
    vietnamese: '1h',
    images: '7d',
    fonts: '30d'
  }
};
```

## Accessibility

### Vietnamese Accessibility Standards

```typescript
// Vietnamese accessibility configuration
const a11yConfig = {
  lang: 'vi',
  dir: 'ltr',
  ariaLabels: {
    menu: 'Thực đơn chính',
    search: 'Tìm kiếm món ăn',
    cart: 'Giỏ hàng',
    profile: 'Hồ sơ cá nhân'
  },
  screenReader: 'vietnamese-optimized'
};
```

## Security

### Vietnamese Data Privacy

```typescript
// Privacy-compliant data collection
const privacyConfig = {
  consent: {
    required: true,
    language: 'vi-VN',
    gdpr: false,
    pdpl: true // Vietnamese Personal Data Protection Law
  },
  dataResidency: 'asia-southeast1',
  encryption: 'AES-256',
  auditLog: true
};
```

## Contributing

When contributing to the web application:

1. **Test with Vietnamese content** including special characters (ă, â, đ, ê, ô, ơ, ư)
2. **Follow Vietnamese design patterns** for UI/UX
3. **Ensure mobile responsiveness** for Vietnamese devices
4. **Test payment integrations** with Vietnamese providers
5. **Validate timezone handling** for Asia/Ho_Chi_Minh
6. **Check currency formatting** for VND

See the main [Contributing Guide](../../README.md#contributing) for general guidelines.

## Related Documentation

- [API Service Documentation](../api/README.md)
- [Vietnamese Localization Guide](../../docs/VIETNAMESE_LOCALIZATION.md)
- [Troubleshooting Guide](../../docs/TROUBLESHOOTING.md)
- [Architecture Overview](../../docs/ARCHITECTURE.md)