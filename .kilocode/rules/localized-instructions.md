# Custom Instructions: Vietnamese Market Context for Dulce de Saigon

## Overview

These custom instructions are designed to ensure that every phase of the Dulce de Saigon F&B data platform development and operation inherently incorporates the unique aspects of the Vietnamese market. Adherence to these guidelines is crucial for achieving market fit, legal compliance, and user acceptance.

## Key Considerations for Vietnamese Market Context

### 1. Data Localization and Compliance

- **GCP Region Preference**: All data related to Vietnamese citizens or operations must be stored and processed within the `asia-southeast1` (Singapore) Google Cloud Platform region to comply with Vietnamese data residency laws.
- **Data Privacy Laws**: Strictly adhere to Vietnam's Personal Data Protection Law (Law No. 23/2023/QH15) and other relevant regulations. This includes explicit consent management for data collection, data subject rights (access, rectification, erasure, portability), and timely data breach notifications.
- **Cross-Border Data Transfer**: Minimize cross-border data transfers. If necessary, ensure explicit consent from data subjects and legal justification, with approval from competent Vietnamese authorities.
- **Data Retention**: Implement retention policies as per Vietnamese legal requirements (e.g., customer data retention for 5 years, financial for 10 years).

### 2. Language Handling

- **UTF-8 Encoding**: Ensure all systems, databases, and applications consistently use UTF-8 encoding to correctly display and process Vietnamese characters (e.g., 'á', 'à', 'ữ', 'đ').
- **Bilingual Support**: All user-facing interfaces, content, and data entries (e.g., `itemName`, `description` in menu items) must support both Vietnamese (`vi`) and English (`en`). Vietnamese should be the default and primary display language.
- **Localization of Text**: Pay close attention to context and nuance when translating or localizing text. Avoid direct translations that might sound unnatural or offensive in Vietnamese.

### 3. Currency Format (VND)

- **Vietnamese Dong (VND)**: All monetary values must be processed and displayed in Vietnamese Dong (VND).
- **Format**: When displaying currency, use the standard Vietnamese format `X.XXX.XXX ₫` (e.g., `75.000 ₫` for seventy-five thousand VND). Avoid decimal points for VND as it is a non-decimal currency.
- **Validation**: Implement strict validation for price inputs to ensure they are positive integers and within reasonable ranges for the Vietnamese market (e.g., max 1,000,000 VND for a single menu item).

### 4. Cultural Considerations

- **Dining Habits**: Understand and incorporate Vietnamese dining habits. Features could include support for communal ordering, family-sized portions, and recognition of specific meal times (e.g., often later dinner times).
- **Seasonal Preferences & Festivals**: Account for seasonal menu changes and special offerings during major Vietnamese festivals and holidays (e.g., Tết Nguyên Đán, Mid-Autumn Festival). Data models should be flexible to accommodate these variations.
- **Payment Methods**: Prioritize popular local payment methods. Implement seamless integration with widely used mobile payment platforms such as Momo, ZaloPay, and VNPay, alongside traditional cash and bank transfer options.
- **Regional Variations**: Be mindful of culinary and cultural differences between Northern, Central, and Southern Vietnam. Data analysis should be capable of segmenting and understanding these regional preferences.
- **Customer Engagement**: Develop features that support local community building and facilitate culturally appropriate feedback mechanisms.

### 5. Security Protocols Relevant to the Vietnamese Market

- **Data Residency**: As highlighted in data localization, strict adherence to Vietnamese data residency laws is a security imperative.
- **Access Control**: Implement robust Role-Based Access Control (RBAC) and Multi-Factor Authentication (MFA) to protect sensitive F&B data, accounting for the hierarchical business structures common in Vietnam.
- **Secure Handling of Personal Data**: Ensure sensitive personal data (e.g., health information - dietary restrictions) is collected and processed with explicit consent and access is restricted to authorized personnel only, in compliance with Vietnamese law.
- **Incident Response**: The incident response plan must be aligned with Vietnamese regulatory requirements for data breach notification within 72 hours to authorities and affected individuals.
- **Regular Audits**: Conduct regular security and compliance audits focusing on Vietnamese data protection laws and F&B regulations.