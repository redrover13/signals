# F&B Data Standards for Dulce de Saigon Platform

## Overview

This document defines the data standards for food and beverage related data within the Dulce de Saigon data platform. Adhering to these standards ensures data quality, consistency, and interoperability across various systems, while respecting Vietnamese cultural context and compliance requirements.

## Core Data Entities

### 1. Menu Item Data Standard

- **`menuItemId` (String)**: Unique identifier for each menu item.
  - Format: `DDS-MENU-YYYYMMDD-XXXX` (e.g., DDS-MENU-20231026-0001)
  - Validation: Must be unique, 17 characters alphanumeric.
- **`itemName` (Localized String)**: Name of the menu item.
  - Required Languages: Vietnamese (`vi`), English (`en`).
  - Example (`vi`): "Phở Bò Đặc Biệt", (`en`): "Special Beef Pho"
  - Validation: Max 100 characters per language.
- **`description` (Localized String, Optional)**: Detailed description of the menu item.
  - Required Languages: Vietnamese (`vi`), English (`en`).
  - Validation: Max 500 characters per language.
- **`category` (String)**: Category of the menu item.
  - Standardized List: "Phở", "Bún", "Cơm", "Đồ Uống", "Tráng Miệng", "Món Khai Vị" (Pho, Vermicelli, Rice, Drinks, Desserts, Appetizers).
  - Validation: Must be from the standardized list.
- **`price` (Number)**: Price of the menu item in Vietnamese Dong (VND).
  - Format: Integer, representing VND.
  - Example: 75000 (for 75,000 VND)
  - Validation: Must be positive, max 1,000,000 VND.
- **`currency` (String)**: Currency code.
  - Fixed Value: "VND"
- **`dietaryInfo` (Array of Strings, Optional)**: Dietary restrictions or allergens.
  - Standardized List: "Chay (Vegetarian)", "Không Gluten (Gluten-Free)", "Không Đậu Phộng (Nut-Free)", "Không Hải Sản (Seafood-Free)".
- **`isActive` (Boolean)**: Indicates if the menu item is currently active.
  - Default: `true`
- **`imageUrl` (URI, Optional)**: URL to the image of the menu item.
  - Validation: Must be a valid URI, max 255 characters.

### 2. Customer Order Data Standard

- **`orderId` (String)**: Unique identifier for each customer order.
  - Format: `DDS-ORDER-YYYYMMDD-HHMMSS-XXXX` (e.g., DDS-ORDER-20231026-143000-0001)
  - Validation: Must be unique, 24 characters alphanumeric.
- **`customerId` (String, Optional)**: Identifier for the customer (if registered).
- **`customerName` (String)**: Name of the customer.
  - Validation: Max 100 characters.
- **`phoneNumber` (String)**: Customer's phone number.
  - Format: Vietnamese mobile number format (e.g., +84901234567 or 0901234567)
  - Validation: Must match Vietnamese phone number regex.
- **`orderDate` (Timestamp)**: Date and time the order was placed.
  - Format: ISO 8601 (UTC+7, ICT timezone).
  - Example: `2023-10-26T14:30:00+07:00`
- **`orderDetails` (Array of Objects)**: List of items in the order.
  - Each item object:
    - **`menuItemId` (String)**: ID of the ordered menu item.
    - **`quantity` (Number)**: Quantity ordered.
    - **`itemPrice` (Number)**: Price of a single item at the time of order.
- **`totalAmount` (Number)**: Total amount of the order, including taxes/fees.
  - Validation: Must be positive.
- **`paymentMethod` (String)**: How the order was paid.
  - Standardized List: "Tiền Mặt (Cash)", "Chuyển Khoản Ngân Hàng (Bank Transfer)", "Momo", "ZaloPay", "VNPay", "Thẻ Tín Dụng (Credit Card)".
- **`orderStatus` (String)**: Current status of the order.
  - Standardized List: "Đặt Hàng (Ordered)", "Đang Chuẩn Bị (Preparing)", "Đã Sẵn Sàng (Ready)", "Đang Giao (Delivering)", "Đã Giao (Delivered)", "Đã Hủy (Cancelled)".
- **`deliveryAddress` (String, Optional)**: Delivery address for the order.
  - Required if `orderType` is "Giao Hàng (Delivery)".
- **`orderType` (String)**: Type of order.
  - Standardized List: "Tại Chỗ (Dine-in)", "Mang Đi (Take Away)", "Giao Hàng (Delivery)".

### 3. Inventory Data Standard

- **`inventoryItemId` (String)**: Unique identifier for each inventory item (ingredient).
  - Format: `DDS-INV-XXXX` (e.g., DDS-INV-0001)
  - Validation: Must be unique, 10 characters alphanumeric.
- **`itemName` (Localized String)**: Name of the ingredient.
  - Required Languages: Vietnamese (`vi`), English (`en`).
  - Validation: Max 100 characters per language.
- **`unitOfMeasure` (String)**: Unit for quantity.
  - Standardized List: "kg", "gram", "lít (liter)", "ml", "cái (piece)", "bó (bunch)".
- **`currentStock` (Number)**: Current quantity in stock.
  - Validation: Non-negative integer.
- **`reorderLevel` (Number)**: Stock level at which a reorder is triggered.
  - Validation: Non-negative integer, less than `currentStock`.
- **`supplierId` (String)**: Identifier of the supplier.
- **`lastUpdated` (Timestamp)**: Timestamp of the last stock update.
  - Format: ISO 8601 (UTC+7, ICT timezone).
- **`expiryDate` (Date, Optional)**: Expiry date of the inventory item.
  - Format: YYYY-MM-DD.

### 4. Supplier Data Standard

- **`supplierId` (String)**: Unique identifier for each supplier.
  - Format: `DDS-SUP-XXXX` (e.g., DDS-SUP-0001)
  - Validation: Must be unique, 10 characters alphanumeric.
- **`supplierName` (String)**: Name of the supplier.
  - Validation: Max 200 characters.
- **`contactPerson` (String)**: Contact person at the supplier.
- **`phoneNumber` (String)**: Supplier's phone number.
  - Validation: Must match Vietnamese phone number regex.
- **`email` (String)**: Supplier's email address.
  - Validation: Valid email format.
- **`address` (String)**: Supplier's address.
- **`taxId` (String, Optional)**: Supplier's tax identification number.
- **`foodSafetyCertified` (Boolean)**: Indicates if the supplier is food safety certified.
  - Required for food ingredient suppliers.

## Data Naming Conventions

- **CamelCase** for all attribute names (e.g., `menuItemId`, `itemName`).
- **PascalCase** for entity names (e.g., `MenuItem`, `CustomerOrder`).
- **Prefixes**:
  - `DDS-` for all internal IDs.
  - `MENU-`, `ORDER-`, `INV-`, `SUP-` specific prefixes for entity IDs.
- **Vietnamese Characters**: Allowed in `itemName` and `description` fields with proper UTF-8 encoding.

## Data Type Standards

- **String**: For textual data, IDs, and localized content.
- **Number**: For prices, quantities, and numeric identifiers. Avoid floating-point for currency where possible (use integers for VND).
- **Boolean**: For true/false flags.
- **Timestamp**: For date and time values, always in ISO 8601 format with UTC+7 offset.
- **Date**: For date-only values, YYYY-MM-DD format.
- **Array of Strings**: For lists of standardized values (e.g., `dietaryInfo`).
- **Array of Objects**: For complex nested structures (e.g., `orderDetails`).
- **URI**: For uniform resource identifiers (e.g., `imageUrl`).

## Data Validation Rules

- **Uniqueness**: All primary keys (`menuItemId`, `orderId`, `inventoryItemId`, `supplierId`) must be unique across the platform.
- **Format Validation**: Use regular expressions for phone numbers, email addresses, and specific ID formats.
- **Range Validation**: Numeric fields (e.g., `price`, `quantity`, `currentStock`) must fall within predefined valid ranges.
- **Lookup Lists**: Fields with standardized values (e.g., `category`, `paymentMethod`, `orderStatus`, `unitOfMeasure`) must adhere to predefined lists.
- **Conditional Requirements**: Fields like `deliveryAddress` are conditionally required based on other field values.
- **Presence**: Critical fields must always be present.

## Data Localization and Currency

- **Currency**: All monetary values are in Vietnamese Dong (VND). When displayed, use the format `X.XXX.XXX ₫`.
- **Localization**: All customer-facing text fields (e.g., `itemName`, `description`) must support both Vietnamese and English to cater to local and international customers. Vietnamese should be the default display language.
- **Timezone**: All timestamps should be stored and processed in ICT (Indochina Time, UTC+7).

## Data Versioning and Audit Trails

- **Menu Changes**: All changes to menu items (price, availability, name) must be versioned with an audit trail including:
  - Timestamp of change
  - User ID of changer
  - Old value, New value
- **Supplier Certifications**: Food safety certifications should have an associated validity period and require re-validation annually.

## Data Integration Standards

- **API Endpoints**: RESTful APIs for data exchange, using JSON as the data interchange format.
- **Message Queues**: Pub/Sub for asynchronous data streams, ensuring idempotent processing.
- **Event Schemas**: Standardized Avro or Protocol Buffers schemas for all data events.

These data standards are crucial for maintaining the integrity, usability, and compliance of the Dulce de Saigon F&B data platform. Regular reviews and updates will ensure their continued relevance and effectiveness.