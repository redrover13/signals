# Dulce de Saigon F&B Data Platform

<div align="center">

![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![GCP](https://img.shields.io/badge/GCP-asia--southeast1-orange.svg)

**A comprehensive F&B data platform designed specifically for the Vietnamese market**

[📖 Documentation](#documentation) • [🚀 Quick Start](#quick-start) • [🇻🇳 Vietnamese Features](#vietnamese-localization) • [📋 API Docs](#api-documentation)

</div>

## Overview

Dulce de Saigon is a leading Food & Beverage (F&B) data platform built specifically for the Vietnamese market. The platform's "Memory Bank" centralizes all F&B data, including menus, pricing, customer preferences, and sales analytics, providing comprehensive insights for restaurants and food service businesses across Vietnam.

### Key Features

- **🏪 Memory Bank**: Centralized F&B data repository
- **🇻🇳 Vietnamese Localization**: Full Vietnamese language support and cultural adaptation
- **📊 Real-time Analytics**: Powered by Google Cloud Platform
- **🔒 Privacy Compliant**: Adheres to Vietnamese data privacy laws
- **💰 VND Support**: Native Vietnamese Dong currency handling
- **📱 Mobile-First**: Optimized for Vietnamese mobile payment platforms

## Architecture

This is an Nx monorepo built with TypeScript and deployed on Google Cloud Platform:

```
apps/
├── api/           # REST API service
├── web/           # Next.js web application  
├── agents/        # AI agent services
└── event-parser/  # Event processing service

libs/
├── gcp/           # Google Cloud Platform integrations
├── mcp/           # Model Context Protocol implementation
└── agents/        # Shared agent utilities

docs/              # Comprehensive documentation
infra/             # Terraform infrastructure as code
```

## Quick Start

### Prerequisites

- **Node.js**: 18+ or 22+ (see `.nvmrc`)
- **PNPM**: 10.0.0+ (package manager)
- **Google Cloud SDK**: For GCP integration
- **Vietnamese locale support**: For proper text rendering

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/redrover13/signals.git
   cd signals
   ```

2. **Install dependencies**
   ```bash
   npm install -g pnpm
   pnpm install
   ```

3. **Set up environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Configure GCP credentials
   gcloud auth application-default login
   gcloud config set project your-project-id
   ```

4. **Build all projects**
   ```bash
   pnpm nx run-many --target=build --all
   ```

5. **Start development servers**
   ```bash
   # Start API server
   pnpm nx serve api
   
   # Start web application (in another terminal)
   pnpm nx serve web
   ```

## Vietnamese Localization

The platform provides comprehensive Vietnamese market support:

### Language & Cultural Features
- **Full Vietnamese UI** with proper UTF-8 encoding
- **Cultural adaptation** for Vietnamese dining habits
- **Regional variations** for Northern, Central, and Southern Vietnam
- **Festival integration** for Vietnamese holidays and celebrations

### Payment Integration
- **Mobile payments**: Momo, ZaloPay, VNPay integration
- **Vietnamese Dong (VND)** native currency support
- **Local banking** integration and QR code payments

### Compliance
- **Vietnamese Data Protection Law** compliance
- **Data localization** in GCP asia-southeast1 region
- **Cross-border transfer** restrictions and consent management

See [Vietnamese Localization Guide](docs/VIETNAMESE_LOCALIZATION.md) for detailed implementation.

## API Documentation

The platform provides RESTful APIs for all major functions:

### Core Endpoints
- **Menu Management**: `/api/menus` - Manage restaurant menus and items
- **Analytics**: `/api/analytics` - Sales and customer analytics
- **Payments**: `/api/payments` - Payment processing and history
- **Users**: `/api/users` - User management and preferences

### Vietnamese-Specific APIs
- **Localization**: `/api/localization` - Language and cultural content
- **Compliance**: `/api/compliance` - Data privacy and regulatory features

See [API Documentation](apps/api/README.md) for complete endpoint reference.

## Development

### Project Structure
This Nx monorepo follows a modular architecture:

- **Apps**: Independent deployable applications
- **Libs**: Shared libraries and utilities
- **Docs**: Comprehensive documentation
- **Infra**: Infrastructure as Code (Terraform)

### Common Commands
```bash
# Run specific app
pnpm nx serve api
pnpm nx serve web

# Build specific project
pnpm nx build api

# Run tests
pnpm nx test

# Lint code
pnpm nx lint

# Run affected projects only
pnpm nx affected --target=build
```

### Vietnamese Development Context
When developing for the Vietnamese market:

- Use Vietnamese date format (dd/mm/yyyy)
- Implement VND currency formatting
- Consider Vietnamese business hours (8:00-17:00 ICT)
- Test with Vietnamese characters (ă, â, đ, ê, ô, ơ, ư)

## Documentation

- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and components
- **[Vietnamese Localization](docs/VIETNAMESE_LOCALIZATION.md)** - Vietnamese market features
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[CI/CD Workflow](docs/CI_CD_WORKFLOW.md)** - Deployment and pipeline docs
- **[Security & Compliance](docs/SECURITY_COMPLIANCE.md)** - Security guidelines
- **[API Reference](apps/api/README.md)** - Complete API documentation

## Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow Vietnamese compliance** guidelines in `.kilocode/rules/`
4. **Test Vietnamese localization** thoroughly
5. **Commit changes** (`git commit -m 'Add amazing feature'`)
6. **Push to branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint + Prettier**: Code formatting enforced
- **JSDoc**: Required for all public APIs
- **Vietnamese context**: Consider cultural and regulatory requirements

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check our comprehensive [docs](docs/) folder
- **Issues**: Open an issue on GitHub
- **Vietnamese Support**: Specialized support for Vietnamese market features

---

**Built with ❤️ for the Vietnamese F&B industry**
