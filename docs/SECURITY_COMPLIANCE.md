# Vietnamese Data Privacy & Residency Compliance

## Data Residency

All production data and backups must be stored in Google Cloud regions located in Vietnam or Southeast Asia (e.g., `asia-southeast1`).

## GCP Region Requirements

- All GCP resources (Cloud Run, Cloud SQL, Artifact Registry, Secret Manager, etc.) must be provisioned in `asia-southeast1` or another Vietnam-compliant region.
- Terraform and deployment scripts must not reference global or US/EU regions for production workloads.

## Compliance Checklist

- [x] All production data is stored in Vietnam/Southeast Asia regions.
- [x] All backups are stored in Vietnam/Southeast Asia regions.
- [x] No production data is transferred or replicated outside of Vietnam/Southeast Asia.
- [x] All secrets and environment variables are managed via GCP Secret Manager in the correct region.
- [x] All deployment workflows enforce region compliance.

## References

- [Vietnam Data Privacy Law Overview](https://www.dataguidance.com/notes/vietnam-data-protection-overview)
- [GCP Regional Services](https://cloud.google.com/about/locations)
# Dulce de Saigon Security and Compliance Documentation

## Overview

This document outlines the security measures and compliance considerations for the Dulce de Saigon platform, specifically designed for the Vietnamese F&B market.

## Security Architecture

### Authentication

The platform implements multiple layers of authentication:

1. **User Authentication**
   - OAuth 2.0 with Google Sign-In
   - Session management with secure cookies
   - Passwordless authentication options

2. **Service Authentication**
   - Workload Identity Federation for CI/CD
   - Service account isolation for each component
   - Automatic key rotation

3. **API Authentication**
   - API key-based authentication for external systems
   - JWT tokens for internal service communication

### Authorization

Role-based access control (RBAC) is implemented at multiple levels:

1. **Google Cloud IAM**
   - Least privilege principle for all service accounts
   - Custom roles for specific permissions
   - Regular access reviews

2. **Application-Level Permissions**
   - User roles (customer, staff, manager, admin)
   - Resource-based access control for data
   - Audit logging for all access attempts

### Data Protection

The platform implements comprehensive data protection measures:

1. **Encryption**
   - Encryption at rest using Google-managed keys
   - Encryption in transit using HTTPS/TLS 1.3
   - Client-side encryption for sensitive data

2. **Data Masking**
   - Automatic masking of PII in logs
   - Selective field encryption in databases
   - Tokenization for payment information

3. **Secure Configuration**
   - Environment variable management with Secret Manager
   - Automated secret rotation
   - Infrastructure as Code for consistent security settings

### Network Security

1. **Firewall Rules**
   - VPC Service Controls for perimeter security
   - Private service access for databases
   - Cloud Armor for DDoS protection

2. **API Security**
   - Rate limiting to prevent abuse
   - Input validation and sanitization
   - API gateway for centralized security controls

## Compliance Framework

### Vietnamese Data Privacy Laws

The platform is designed to comply with Vietnamese data privacy regulations:

1. **Data Localization**
   - All customer data stored in Vietnam region (asia-southeast1)
   - Cross-border data transfer restrictions
   - Local backup and disaster recovery

2. **Consent Management**
   - Clear consent collection for data processing
   - Granular consent for different purposes
   - Easy withdrawal of consent

3. **Data Subject Rights**
   - Right to access personal data
   - Right to rectification and erasure
   - Right to data portability
   - Right to object to processing

### Industry Standards

1. **PCI DSS Compliance**
   - Secure handling of payment card data
   - Regular security assessments
   - Network security controls

2. **ISO 27001 Alignment**
   - Information security management system
   - Risk assessment and treatment
   - Continuous improvement processes

## Audit and Monitoring

### Logging

Comprehensive logging is implemented across all components:

1. **Application Logs**
   - Structured logging with correlation IDs
   - Error tracking and alerting
   - Performance monitoring

2. **Security Logs**
   - Authentication and authorization events
   - Data access logs
   - Security incident tracking

3. **Infrastructure Logs**
   - Cloud resource creation and modification
   - Network traffic logs
   - Configuration change tracking

### Monitoring

Real-time monitoring is implemented using Google Cloud services:

1. **Cloud Monitoring**
   - Custom metrics for business KPIs
   - System health dashboards
   - Automated alerting

2. **Cloud Logging**
   - Centralized log aggregation
   - Log retention policies
   - Automated log analysis

### Incident Response

A structured incident response process is in place:

1. **Detection**
   - Automated anomaly detection
   - Security alerting and notifications
   - Log correlation for threat identification

2. **Response**
   - Incident classification and prioritization
   - Containment and eradication procedures
   - Communication protocols

3. **Recovery**
   - Data restoration procedures
   - Service recovery validation
   - Post-incident analysis

## Vietnamese Market Considerations

### Cultural Adaptation

1. **Language Support**
   - Full Vietnamese language interface
   - Culturally appropriate content and imagery
   - Localized error messages and notifications

2. **Payment Methods**
   - Integration with popular Vietnamese payment systems
   - Support for cash-on-delivery preferences
   - Mobile payment integration (Momo, ZaloPay, etc.)

3. **Regulatory Compliance**
   - Compliance with Vietnamese e-commerce regulations
   - Tax calculation and reporting for Vietnam
   - Food safety and hygiene standards adherence

### Data Residency

1. **Local Storage**
   - All customer data stored in Vietnam region
   - Backup and disaster recovery within Vietnam
   - Cross-border data transfer controls

2. **Government Access**
   - Procedures for responding to government data requests
   - Legal compliance with Vietnamese authorities
   - Transparency reporting

## Best Practices

### Development Security

1. **Secure Coding Practices**
   - Input validation and output encoding
   - Secure error handling
   - Dependency security scanning

2. **Code Review**
   - Mandatory code review for all changes
   - Security-focused review checklist
   - Automated security testing

3. **Vulnerability Management**
   - Regular security assessments
   - Patch management procedures
   - Third-party dependency monitoring

### Operational Security

1. **Access Control**
   - Just-in-time access for administrative tasks
   - Multi-factor authentication for all privileged accounts
   - Regular access reviews

2. **Configuration Management**
   - Infrastructure as Code for consistent security
   - Automated security configuration validation
   - Change management procedures

3. **Backup and Recovery**
   - Regular automated backups
   - Backup encryption and integrity verification
   - Disaster recovery testing

## Conclusion

The Dulce de Saigon platform implements comprehensive security measures and compliance controls designed specifically for the Vietnamese F&B market. By following industry best practices and adhering to local regulations, the platform provides a secure and compliant environment for processing customer data and conducting business operations.