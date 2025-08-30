# Dulce de Saigon Troubleshooting Guide

## Overview

This guide provides solutions to common issues that may arise when working with the Dulce de Saigon platform. It covers development, deployment, and runtime issues.

## Development Issues

### Environment Setup Problems

#### Node.js Version Issues
**Problem**: "engine not compatible" error when running pnpm install
**Solution**: 
1. Check your Node.js version: `node --version`
2. Install the correct version using nvm:
   ```bash
   nvm install 18
   nvm use 18
   ```
3. Or install the correct version using your package manager

#### PNPM Installation Issues
**Problem**: PNPM not found or version mismatch
**Solution**:
1. Install PNPM globally: `npm install -g pnpm`
2. Check version: `pnpm --version`
3. Ensure version 8.x is installed

#### Google Cloud SDK Issues
**Problem**: Authentication errors or commands not found
**Solution**:
1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Initialize: `gcloud init`
3. Authenticate: `gcloud auth login`
4. Set project: `gcloud config set project YOUR_PROJECT_ID`

### Dependency Issues

#### Missing Dependencies
**Problem**: Module not found errors
**Solution**:
1. Run `pnpm install` to install all dependencies
2. Check package.json for missing dependencies
3. Add missing dependencies: `pnpm add package-name`

#### Version Conflicts
**Problem**: Dependency version conflicts
**Solution**:
1. Check pnpm-lock.yaml for conflicts
2. Update dependencies: `pnpm update package-name`
3. Clear cache if needed: `pnpm store prune`

### Nx Monorepo Issues

#### Nx Command Not Found
**Problem**: "nx: command not found" error
**Solution**:
1. Install Nx globally: `npm install -g nx`
2. Or use npx: `npx nx serve api`

#### Affected Commands Not Working
**Problem**: Nx affected commands not detecting changes
**Solution**:
1. Check git status: `git status`
2. Ensure changes are committed or staged
3. Run with base and head: `nx affected --target=build --base=main --head=HEAD`

#### Build Failures
**Problem**: Build errors in specific projects
**Solution**:
1. Check project configuration in project.json
2. Verify TypeScript configuration in tsconfig.json
3. Check for circular dependencies: `nx graph`

## API Service Issues

### Startup Failures

#### Port Already In Use
**Problem**: "listen EADDRINUSE" error
**Solution**:
1. Check which process is using the port: `lsof -i :3000`
2. Kill the process: `kill -9 PID`
3. Or change the port in .env: `PORT=3001`

#### Environment Variable Issues
**Problem**: "Missing required environment variable" error
**Solution**:
1. Check .env file for missing variables
2. Ensure all required variables are set
3. Verify variable names match expected values

### Endpoint Issues

#### 404 Errors
**Problem**: Endpoints returning 404
**Solution**:
1. Check route registration in main.ts
2. Verify route prefixes in project.json
3. Ensure routes are properly exported

#### 500 Errors
**Problem**: Endpoints returning 500
**Solution**:
1. Check logs for error details
2. Verify database connections
3. Check for unhandled exceptions in route handlers

### Pub/Sub Issues

#### Publishing Failures
**Problem**: Events not being published to Pub/Sub
**Solution**:
1. Check Pub/Sub topic name in environment variables
2. Verify service account permissions
3. Check network connectivity to Google Cloud

#### Subscription Issues
**Problem**: Ingest worker not receiving messages
**Solution**:
1. Check Pub/Sub subscription configuration
2. Verify subscription is active
3. Check for message acknowledgment issues

## Agents Service Issues

### Agent Execution Failures

#### Tool Not Found
**Problem**: "Tool not found" error when running agents
**Solution**:
1. Check agent configuration for tool registration
2. Verify tool implementation exists
3. Check tool name spelling and case

#### Vertex AI Integration Issues
**Problem**: AI insights not being generated
**Solution**:
1. Check Vertex AI API key and permissions
2. Verify model name and region
3. Check for quota exceeded errors

### Performance Issues

#### Slow Agent Execution
**Problem**: Agents taking too long to complete tasks
**Solution**:
1. Check for inefficient database queries
2. Optimize tool implementations
3. Increase agent timeout settings

## Database Issues

### BigQuery Connection Issues

#### Authentication Failures
**Problem**: "Unauthorized" errors when accessing BigQuery
**Solution**:
1. Check service account credentials
2. Verify BigQuery API is enabled
3. Check dataset and table permissions

#### Query Performance Issues
**Problem**: Slow query execution
**Solution**:
1. Optimize query with partitioning
2. Use clustering for large tables
3. Check for inefficient joins or subqueries

### Data Consistency Issues

#### Missing Data
**Problem**: Events or agent runs not appearing in tables
**Solution**:
1. Check Pub/Sub message processing
2. Verify table schemas match expected data
3. Check for data validation errors

## Deployment Issues

### Cloud Run Deployment Failures

#### Build Failures
**Problem**: Container build failing during deployment
**Solution**:
1. Check Dockerfile for syntax errors
2. Verify all dependencies are included
3. Check build context and file paths

#### Health Check Failures
**Problem**: Service not passing health checks
**Solution**:
1. Check health check endpoint implementation
2. Verify all required services are available
3. Check environment variable configuration

### Terraform Issues

#### Apply Failures
**Problem**: Terraform apply failing
**Solution**:
1. Check error message for specific resource
2. Verify required APIs are enabled
3. Check for resource quota limits

#### Vietnamese Infrastructure Deployment Issues
**Problem**: Terraform failing to create Vietnamese-specific resources
**Symptoms**:
- BigQuery datasets not created in asia-southeast1
- Storage buckets created in wrong region
- IAM policies not applied correctly for Vietnamese compliance

**Solution**:
1. Force Vietnamese region in Terraform:
   ```hcl
   # vietnamese-infrastructure.tf
   provider "google" {
     project = var.project_id
     region  = "asia-southeast1"
     zone    = "asia-southeast1-a"
   }
   
   resource "google_bigquery_dataset" "vietnamese_analytics" {
     dataset_id  = "vietnamese_analytics"
     location    = "asia-southeast1"
     
     labels = {
       environment        = "production"
       data_residency    = "vietnam"
       compliance        = "pdpl"
     }
   }
   ```

#### State Issues
**Problem**: Terraform state conflicts
**Solution**:
1. Check state file permissions
2. Use terraform refresh to sync state
3. Resolve conflicts manually if needed

#### State Conflicts with Vietnamese Resources
**Problem**: Terraform state conflicts when managing Vietnamese infrastructure
**Solution**:
1. Use remote state with Vietnamese backup:
   ```hcl
   terraform {
     backend "gcs" {
       bucket = "dulce-terraform-state-vietnam"
       prefix = "terraform/state"
     }
   }
   ```
2. Import existing Vietnamese resources:
   ```bash
   terraform import google_bigquery_dataset.vietnamese_analytics vietnamese_analytics
   ```

## Security Issues

### Authentication Failures

#### Workload Identity Federation Issues
**Problem**: CI/CD authentication failing
**Solution**:
1. Check GitHub repository binding
2. Verify workload identity pool configuration
3. Check service account permissions

#### Vietnamese WIF Configuration Issues
**Problem**: CI/CD authentication failing for Vietnamese deployments
**Symptoms**:
- GitHub Actions can't authenticate to GCP
- Deployment to asia-southeast1 failing
- Permission denied errors for Vietnamese resources

**Solution**:
1. Configure WIF for Vietnamese region:
   ```bash
   # Create workload identity pool for Vietnamese operations
   gcloud iam workload-identity-pools create "vietnamese-github-pool" \
     --project="${PROJECT_ID}" \
     --location="global" \
     --display-name="Vietnamese GitHub Actions Pool"
   ```

2. Set up service account for Vietnamese compliance:
   ```bash
   gcloud iam service-accounts create vietnamese-deployment-sa \
     --display-name="Vietnamese Deployment Service Account"
   ```

#### API Key Issues
**Problem**: API key authentication failing
**Solution**:
1. Check API key in Secret Manager
2. Verify key has correct permissions
3. Check for key expiration

#### Vietnamese Payment Gateway API Issues
**Problem**: API keys for Vietnamese payment gateways failing
**Symptoms**:
- Momo/ZaloPay authentication errors
- Payment redirects failing
- Sandbox vs production key confusion

**Solution**:
1. Store Vietnamese API keys securely:
   ```bash
   # Store Momo API keys
   gcloud secrets create momo-partner-code --data-file=momo-partner.txt
   gcloud secrets create momo-access-key --data-file=momo-access.txt
   ```

2. Verify environment-specific keys:
   ```typescript
   const getVietnamesePaymentKeys = async () => {
     const environment = process.env.NODE_ENV;
     const keyPrefix = environment === 'production' ? 'prod' : 'sandbox';
     
     return {
       momo: {
         partnerCode: await getSecret(`momo-${keyPrefix}-partner-code`),
         endpoint: environment === 'production' 
           ? 'https://payment.momo.vn/v2/gateway/api/create'
           : 'https://test-payment.momo.vn/v2/gateway/api/create'
       }
     };
   };
   ```

### Authorization Issues

#### Permission Denied Errors
**Problem**: "Permission denied" when accessing resources
**Solution**:
1. Check IAM roles and permissions
2. Verify service account assignments
3. Check for organization policy restrictions

#### Vietnamese Data Access Restrictions
**Problem**: Services can't access Vietnamese citizen data due to compliance restrictions
**Symptoms**:
- BigQuery queries failing on Vietnamese datasets
- Storage access denied for Vietnamese customer data
- Cross-border data transfer blocked

**Solution**:
1. Implement Vietnamese data access controls:
   ```typescript
   const validateVietnameseDataAccess = async (userId: string, operation: string) => {
     const user = await getUserProfile(userId);
     
     if (!user.vietnamese_citizen && !user.has_vietnamese_data_permission) {
       throw new Error('Access denied: Vietnamese data residency restriction');
     }
     
     const allowedOperations = ['read', 'aggregate', 'anonymize'];
     if (!allowedOperations.includes(operation)) {
       throw new Error('Operation not permitted on Vietnamese citizen data');
     }
   };
   ```

2. Configure regional IAM policies:
   ```hcl
   resource "google_bigquery_dataset_iam_member" "vietnamese_data_access" {
     dataset_id = google_bigquery_dataset.vietnamese_analytics.dataset_id
     role       = "roles/bigquery.dataViewer"
     
     condition {
       title      = "Vietnamese Data Access Only"
       expression = "request.region == 'asia-southeast1'"
     }
   }
   ```

### Data Privacy and Compliance Issues

#### Vietnamese PDPL Compliance Violations
**Problem**: Accidentally processing Vietnamese personal data outside compliance framework
**Symptoms**:
- Data processed outside asia-southeast1 region
- PII not properly anonymized
- Consent not tracked for Vietnamese users

**Solution**:
1. Implement automatic PII detection:
   ```typescript
   const vietnamesePIIPatterns = {
     citizenId: /^\d{12}$/,
     phoneNumber: /^(\+84|84|0)[0-9]{8,9}$/,
     email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
   };
   
   const detectVietnamesePII = (data: any): boolean => {
     const textData = JSON.stringify(data);
     return Object.values(vietnamesePIIPatterns).some(pattern => 
       pattern.test(textData)
     );
   };
   ```

2. Enforce data residency:
   ```typescript
   const enforceVietnameseDataResidency = async (operation: string, data: any) => {
     const currentRegion = process.env.GOOGLE_CLOUD_REGION;
     
     if (currentRegion !== 'asia-southeast1') {
       throw new Error('Vietnamese data must be processed in asia-southeast1 region');
     }
   };
   ```

## Vietnamese Localization Issues

### Language Display Issues

#### Text Not Translated
**Problem**: English text appearing in Vietnamese UI
**Symptoms**:
- UI buttons showing English labels
- Error messages in English instead of Vietnamese
- Menu items not localized

**Solution**:
1. Check translation files for missing keys:
   ```bash
   # Check for missing Vietnamese translations
   grep -r "en:" src/locales/ | grep -v "vi:"
   ```
2. Verify language detection logic:
   ```typescript
   // Check locale detection
   const userLocale = navigator.language; // Should be 'vi-VN'
   console.log('Detected locale:', userLocale);
   ```
3. Check for hardcoded English strings:
   ```bash
   # Find hardcoded English text
   grep -r "placeholder.*english" src/
   grep -r "Hello\|Welcome\|Error" src/ --include="*.tsx"
   ```

#### Vietnamese Characters Not Displaying Properly
**Problem**: Vietnamese special characters (ă, â, đ, ê, ô, ơ, ư) showing as boxes or question marks
**Symptoms**:
- "Phở" displays as "Ph?"
- "Tiếng Việt" shows garbled text
- User names with Vietnamese characters corrupted

**Solution**:
1. Verify UTF-8 encoding:
   ```html
   <!-- Ensure UTF-8 meta tag is present -->
   <meta charset="UTF-8" />
   ```
2. Check database encoding:
   ```sql
   -- For BigQuery
   SELECT 
     SAFE.PARSE_JSON('{"name": "Phở bò"}') as test_vietnamese;
   ```
3. Validate font support:
   ```css
   /* Ensure Vietnamese font support */
   font-family: 'Inter', 'Roboto', 'Segoe UI', 'DejaVu Sans', sans-serif;
   ```

#### Cultural Adaptation Issues
**Problem**: Inappropriate cultural references or business patterns
**Examples**:
- Showing lunch hours during traditional Vietnamese siesta time
- Using Western dining etiquette in restaurant recommendations
- Inappropriate festival or holiday references

**Solution**:
1. Review content with Vietnamese cultural consultants
2. Update culturally specific content:
   ```typescript
   const vietnameseBusinessHours = {
     breakfast: '06:00-09:00',
     lunch: '11:00-14:00',
     afternoon_break: '14:00-17:00', // Common in Vietnam
     dinner: '17:00-21:00'
   };
   ```
3. Verify date and currency formats:
   ```typescript
   // Vietnamese date format (dd/mm/yyyy)
   const vietnameseDate = new Date().toLocaleDateString('vi-VN');
   
   // VND currency format
   const vndPrice = new Intl.NumberFormat('vi-VN', {
     style: 'currency',
     currency: 'VND'
   }).format(150000);
   ```

### Currency and Payment Issues

#### VND Formatting Problems
**Problem**: Vietnamese Dong amounts displayed incorrectly
**Symptoms**:
- Prices showing decimal places (VND doesn't use decimals)
- Incorrect thousand separators
- Wrong currency symbol placement

**Solution**:
1. Implement proper VND formatting:
   ```typescript
   const formatVND = (amount: number): string => {
     return new Intl.NumberFormat('vi-VN', {
       style: 'currency',
       currency: 'VND',
       minimumFractionDigits: 0,
       maximumFractionDigits: 0
     }).format(amount);
   };
   
   // Example: formatVND(150000) → "₫150.000"
   ```
2. Validate VND amounts:
   ```typescript
   const isValidVNDAmount = (amount: number): boolean => {
     return amount > 0 && amount % 1000 === 0; // VND typically in thousands
   };
   ```

#### Vietnamese Payment Gateway Integration Issues
**Problem**: Momo, ZaloPay, or VNPay integration failures
**Symptoms**:
- Payment redirects failing
- QR code payments not working
- Transaction status not updating

**Solution**:
1. Check API credentials and endpoints:
   ```typescript
   // Momo configuration
   const momoConfig = {
     partnerCode: process.env.MOMO_PARTNER_CODE,
     accessKey: process.env.MOMO_ACCESS_KEY,
     secretKey: process.env.MOMO_SECRET_KEY,
     endpoint: 'https://payment.momo.vn/v2/gateway/api/create'
   };
   ```
2. Verify callback URLs:
   ```typescript
   const callbackUrl = `${process.env.BASE_URL}/api/payment/momo/callback`;
   // Ensure URL is accessible from Momo servers
   ```
3. Test with Vietnamese phone numbers:
   ```typescript
   const testVietnamesePhone = '+84901234567';
   ```

### Regional and Timezone Issues

#### Asia/Ho_Chi_Minh Timezone Problems
**Problem**: Incorrect time displays or scheduling issues
**Symptoms**:
- Restaurant hours showing in wrong timezone
- Order timestamps incorrect
- Scheduling conflicts with Vietnamese business hours

**Solution**:
1. Set correct timezone:
   ```bash
   # In Docker/container
   ENV TZ=Asia/Ho_Chi_Minh
   
   # In Node.js
   process.env.TZ = 'Asia/Ho_Chi_Minh';
   ```
2. Use Vietnamese timezone in date operations:
   ```typescript
   const vietnameseTime = new Date().toLocaleString('vi-VN', {
     timeZone: 'Asia/Ho_Chi_Minh',
     weekday: 'long',
     year: 'numeric',
     month: 'long',
     day: 'numeric',
     hour: '2-digit',
     minute: '2-digit'
   });
   ```

#### Regional Data Routing Issues
**Problem**: Data being processed outside Vietnam region
**Symptoms**:
- High latency from Vietnamese users
- Data residency compliance violations
- Slow BigQuery operations

**Solution**:
1. Verify GCP region configuration:
   ```bash
   # Check current project region
   gcloud config get-value compute/region
   
   # Set to Vietnamese region
   gcloud config set compute/region asia-southeast1
   ```
2. Force regional routing:
   ```typescript
   const bigqueryClient = new BigQuery({
     location: 'asia-southeast1', // Force Vietnam region
     projectId: process.env.GOOGLE_CLOUD_PROJECT
   });
   ```

### Vietnamese Mobile Integration Issues

#### Vietnamese Keyboard Input Problems
**Problem**: Vietnamese input method issues on mobile
**Symptoms**:
- Diacritical marks not working correctly
- Text input lag with Vietnamese keyboards
- Autocomplete not working with Vietnamese words

**Solution**:
1. Optimize input fields for Vietnamese:
   ```html
   <input 
     type="text" 
     lang="vi" 
     inputmode="text"
     autocapitalize="words"
     spellcheck="true"
   />
   ```
2. Support Vietnamese autocomplete:
   ```typescript
   const vietnameseWords = [
     'phở', 'bánh mì', 'bún bò', 'chả cá', 'nem rán'
   ];
   ```

#### Mobile Payment App Integration
**Problem**: Deep links to Vietnamese payment apps not working
**Symptoms**:
- Momo app not opening from web
- ZaloPay redirects failing
- Mobile payment flows broken

**Solution**:
1. Configure proper deep links:
   ```typescript
   const paymentDeepLinks = {
     momo: `momo://payment?amount=${amount}&description=${description}`,
     zalopay: `zalopay://pay?amount=${amount}&orderInfo=${orderInfo}`,
     vnpay: `vnpayapp://payment?amount=${amount}&info=${info}`
   };
   ```
2. Fallback to web versions:
   ```typescript
   const openPaymentApp = (provider: string, data: any) => {
     const deepLink = paymentDeepLinks[provider];
     const webFallback = `https://${provider}.vn/payment`;
     
     window.location.href = deepLink;
     
     // Fallback to web after timeout
     setTimeout(() => {
       if (document.visibilityState === 'visible') {
         window.location.href = webFallback;
       }
     }, 2000);
   };
   ```

## Monitoring and Logging Issues

### Missing Logs

#### Logs Not Appearing
**Problem**: Expected logs not showing in Cloud Logging
**Solution**:
1. Check log level configuration
2. Verify logging library is properly initialized
3. Check for log filtering rules

#### Log Format Issues
**Problem**: Unstructured or incomplete logs
**Solution**:
1. Check logging configuration
2. Verify structured logging implementation
3. Check for log truncation issues

## Performance Issues

### High Latency

#### API Response Time Issues
**Problem**: Slow API responses
**Solution**:
1. Check for database query bottlenecks
2. Optimize network calls
## Performance Issues

### Slow API Response Times

#### High Latency from Vietnamese Users
**Problem**: API responses slow for users in Vietnam
**Symptoms**:
- Response times > 2 seconds from Vietnamese locations
- Timeouts during peak Vietnamese business hours
- Poor mobile performance on Vietnamese networks

**Solution**:
1. Verify deployment in asia-southeast1 region:
   ```bash
   # Check Cloud Run service region
   gcloud run services list --platform=managed --region=asia-southeast1
   ```

2. Optimize for Vietnamese network conditions:
   ```typescript
   // Configure timeouts for Vietnamese networks
   const vietnameseNetworkConfig = {
     timeout: 30000, // 30 seconds for slower connections
     retries: 3,
     keepAlive: true,
     compression: true // Reduce bandwidth usage
   };
   ```

3. Implement Vietnamese CDN caching:
   ```typescript
   // Cache strategy for Vietnamese content
   const vietnameseCacheConfig = {
     'static-assets': '1h',
     'menu-data': '15m',
     'vietnamese-translations': '24h',
     'currency-rates': '5m'
   };
   ```

#### Database Query Performance Issues
**Problem**: BigQuery operations slow with Vietnamese data
**Symptoms**:
- Queries with Vietnamese text taking > 10 seconds
- Timeouts when filtering by Vietnamese characters
- High slot usage on Vietnamese dataset queries

**Solution**:
1. Optimize BigQuery for Vietnamese text:
   ```sql
   -- Create partitioned table for Vietnamese data
   CREATE TABLE vietnamese_analytics.orders_partitioned (
     order_id STRING,
     customer_name_vi STRING,
     order_date DATE,
     region_vi STRING,
     total_vnd NUMERIC
   )
   PARTITION BY order_date
   CLUSTER BY region_vi, customer_name_vi;
   ```

2. Use efficient Vietnamese text queries:
   ```sql
   -- Optimized Vietnamese search
   SELECT 
     dish_name_vi,
     COUNT(*) as order_count
   FROM vietnamese_analytics.orders_partitioned
   WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
     AND region_vi = 'Miền Nam'
     AND REGEXP_CONTAINS(dish_name_vi, r'phở|bún|bánh')
   GROUP BY dish_name_vi
   ORDER BY order_count DESC
   LIMIT 100;
   ```

### Memory Issues

#### Out of Memory with Vietnamese Text Processing
**Problem**: Applications running out of memory when processing Vietnamese content
**Symptoms**:
- Node.js heap out of memory errors
- Cloud Run containers restarting
- Slow text processing with large Vietnamese datasets

**Solution**:
1. Optimize memory for Vietnamese text:
   ```typescript
   // Stream processing for large Vietnamese text files
   import { createReadStream } from 'fs';
   import { createInterface } from 'readline';
   
   const processVietnameseTextStream = async (filePath: string) => {
     const fileStream = createReadStream(filePath, { encoding: 'utf8' });
     const rl = createInterface({
       input: fileStream,
       crlfDelay: Infinity
     });
     
     const batchSize = 1000;
     let batch: string[] = [];
     
     for await (const line of rl) {
       batch.push(line);
       
       if (batch.length >= batchSize) {
         await processVietnameseBatch(batch);
         batch = []; // Clear memory
       }
     }
   };
   ```

2. Configure Cloud Run memory limits:
   ```yaml
   # cloud-run-vietnamese.yaml
   apiVersion: serving.knative.dev/v1
   kind: Service
   spec:
     template:
       metadata:
         annotations:
           run.googleapis.com/memory: "4Gi"  # Increased for Vietnamese text
           run.googleapis.com/cpu: "2"
       spec:
         containers:
         - env:
           - name: NODE_OPTIONS
             value: "--max-old-space-size=3584"  # 3.5GB for Node.js
   ```

### Vietnamese Mobile Performance Issues

#### Slow Loading on Vietnamese Mobile Networks
**Problem**: Poor performance on Vietnamese mobile connections
**Symptoms**:
- Page load times > 5 seconds on 3G/4G
- Images not loading on slower connections
- App crashes on older Vietnamese Android devices

**Solution**:
1. Optimize for Vietnamese mobile:
   ```typescript
   // Progressive loading for Vietnamese mobile
   const vietnameseMobileOptimization = {
     imageFormats: ['webp', 'avif', 'jpeg'], // Modern formats first
     imageSizes: [320, 480, 640, 768], // Common Vietnamese device sizes
     lazyLoading: true,
     compressionLevel: 0.8, // Higher compression for slower networks
     
     preloadCriticalFonts: ['vietnamese-sans', 'roboto'],
     deferNonCriticalJS: true,
     enableServiceWorkerCaching: true
   };
   ```

2. Implement Vietnamese network detection:
   ```typescript
   // Detect Vietnamese network conditions
   const detectVietnameseNetworkSpeed = (): 'slow' | 'fast' => {
     const connection = (navigator as any).connection;
     
     if (!connection) return 'fast';
     
     const slowNetworkTypes = ['slow-2g', '2g', '3g'];
     const isSlowNetwork = slowNetworkTypes.includes(connection.effectiveType);
     
     return isSlowNetwork ? 'slow' : 'fast';
   };
   ```

### Resource Utilization Issues
**Problem**: High CPU or memory usage
**Solution**:
1. Check for memory leaks
2. Optimize resource-intensive operations
3. Scale Cloud Run instances

## Network Issues

### Vietnamese Network Connectivity Problems

#### Intermittent Connection Loss
**Problem**: Intermittent connection failures from Vietnamese users
**Symptoms**:
- Random timeouts during Vietnamese peak hours (11:30-13:30, 17:30-20:00)
- Connection drops on Vietnamese mobile networks
- Slow responses during high traffic periods

**Solution**:
1. Implement Vietnamese network resilience:
   ```typescript
   // Vietnamese network retry strategy
   const vietnameseRetryConfig = {
     retries: 5, // More retries for Vietnamese networks
     retryDelay: (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000),
     retryCondition: (error: any) => {
       const vietnameseNetworkErrors = [
         'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ENETUNREACH'
       ];
       return vietnameseNetworkErrors.includes(error.code);
     }
   };
   ```

2. Configure Vietnamese CDN and load balancing:
   ```typescript
   const vietnameseLoadBalancer = {
     primary: 'asia-southeast1-a',
     secondary: 'asia-southeast1-b',
     fallback: 'asia-east1-a',
     
     healthCheck: {
       interval: 30000,
       timeout: 10000,
       retries: 3
     }
   };
   ```

#### DNS Resolution Issues for Vietnamese Domains
**Problem**: Hostname resolution failures for Vietnamese services
**Solution**:
1. Configure Vietnamese DNS settings:
   ```bash
   # Use Vietnamese DNS servers as fallback
   echo "nameserver 203.162.4.190" >> /etc/resolv.conf  # VNNIC DNS
   ```

2. Implement DNS caching for Vietnamese domains:
   ```typescript
   const vietnameseDNSCache = new Map();
   
   const resolveVietnameseDomain = async (domain: string): Promise<string> => {
     if (vietnameseDNSCache.has(domain)) {
       return vietnameseDNSCache.get(domain);
     }
     
     const resolved = await dns.resolve4(domain);
     vietnameseDNSCache.set(domain, resolved[0]);
     
     // Cache for 5 minutes
     setTimeout(() => vietnameseDNSCache.delete(domain), 5 * 60 * 1000);
     
     return resolved[0];
   };
   ```

### Vietnamese Mobile Network Issues

#### 3G/4G Performance Problems
**Problem**: Poor performance on Vietnamese mobile networks (Viettel, Vinaphone, Mobifone)
**Solution**:
1. Optimize for Vietnamese mobile networks:
   ```typescript
   const vietnameseMobileConfig = {
     timeout: 45000, // Longer timeout for mobile networks
     compression: 'gzip',
     keepAlive: false,
     
     networkOptimizations: {
       viettel: { timeout: 40000, retries: 3 },
       vinaphone: { timeout: 45000, retries: 4 },
       mobifone: { timeout: 50000, retries: 5 }
     }
   };
   ```

2. Implement network type detection:
   ```typescript
   const detectVietnameseMobileNetwork = (): string | null => {
     const connection = (navigator as any).connection;
     return connection?.effectiveType || null;
   };
   ```

## Cost Management Issues

### Unexpected Charges for Vietnamese Operations

#### High BigQuery Costs with Vietnamese Data
**Problem**: Unexpected high BigQuery costs when processing Vietnamese datasets
**Symptoms**:
- Query costs exceeding budget
- High slot usage during Vietnamese business hours
- Expensive full table scans on Vietnamese text columns

**Solution**:
1. Optimize Vietnamese BigQuery costs:
   ```sql
   -- Cost-effective Vietnamese analytics query
   SELECT 
     region_vi,
     DATE_TRUNC(order_date, MONTH) as month,
     COUNT(*) as orders,
     SUM(total_vnd) as revenue_vnd
   FROM vietnamese_analytics.orders_partitioned
   WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
     AND _PARTITIONTIME >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH))
   GROUP BY region_vi, month
   ORDER BY month DESC, revenue_vnd DESC;
   ```

2. Implement query cost controls:
   ```typescript
   // BigQuery cost monitoring for Vietnamese operations
   const vietnameseBigQueryCostControl = {
     maxBytesProcessed: 100 * 1024 * 1024 * 1024, // 100GB limit
     requirePartitionFilter: true,
     dryRunFirst: true,
     
     async runCostControlledQuery(query: string) {
       // Dry run to estimate costs
       const [job] = await bigquery.createQueryJob({
         query,
         dryRun: true,
         location: 'asia-southeast1'
       });
       
       const bytesProcessed = parseInt(job.metadata.statistics.totalBytesProcessed);
       const estimatedCostUSD = (bytesProcessed / (1024 ** 4)) * 6.25; // $6.25 per TB
       
       if (estimatedCostUSD > 10) { // $10 limit
         throw new Error(`Query too expensive: $${estimatedCostUSD.toFixed(2)} estimated cost`);
       }
       
       return bigquery.query({ query, location: 'asia-southeast1' });
     }
   };
   ```

#### High Storage Costs for Vietnamese Media
**Problem**: Expensive Cloud Storage costs for Vietnamese restaurant images and videos
**Solution**:
1. Implement Vietnamese storage lifecycle:
   ```hcl
   resource "google_storage_bucket" "vietnamese_media" {
     name     = "dulce-vietnamese-media"
     location = "asia-southeast1"
     
     lifecycle_rule {
       condition {
         age                   = 90
         matches_storage_class = ["STANDARD"]
       }
       action {
         type          = "SetStorageClass"
         storage_class = "NEARLINE"
       }
     }
   }
   ```

2. Optimize Vietnamese image storage:
   ```typescript
   // Compress Vietnamese restaurant images
   const optimizeVietnameseImages = async (imageBuffer: Buffer, type: 'menu' | 'restaurant' | 'dish') => {
     const compressionSettings = {
       menu: { quality: 85, width: 1200 },
       restaurant: { quality: 80, width: 1920 },
       dish: { quality: 90, width: 800 }
     };
     
     const settings = compressionSettings[type];
     
     return sharp(imageBuffer)
       .resize(settings.width, null, { 
         withoutEnlargement: true,
         fit: 'inside'
       })
       .jpeg({ 
         quality: settings.quality,
         progressive: true
       })
       .toBuffer();
   };
   ```

### Unexpected Charges

#### High Billing
**Problem**: Unexpected high costs
**Solution**:
1. Check billing alerts and budgets
2. Review resource usage patterns
3. Optimize resource allocation

#### Quota Exceeded
**Problem**: Service quota exceeded errors
**Symptoms**:
- Cloud Run deployments failing due to CPU quota
- BigQuery jobs queued due to slot limits
- Storage operations throttled

**Solution**:
1. Monitor Vietnamese region quotas:
   ```bash
   # Check asia-southeast1 quotas
   gcloud compute project-info describe \
     --format="table(quotas.metric,quotas.limit,quotas.usage)" \
     | grep -E "(CPU|STORAGE|BIGQUERY)"
   ```

2. Implement quota management:
   ```typescript
   // Vietnamese quota monitoring
   const monitorVietnameseQuotas = async () => {
     const quotas = await monitoring.getQuotaUsage('asia-southeast1');
     
     const criticalQuotas = ['compute.googleapis.com/cpus', 'bigquery.googleapis.com/slots'];
     
     for (const quota of criticalQuotas) {
       const usage = quotas[quota];
       if (usage.percentage > 80) {
         await alerting.sendQuotaAlert({
           quota: quota,
           usage: usage.percentage,
           region: 'asia-southeast1',
           severity: 'warning'
         });
       }
     }
   };
   ```

3. Request quota increase:
   ```bash
   # Request quota increase for Vietnamese region
   gcloud compute project-info describe
   # Then request increase through Cloud Console
   ```

## Conclusion

This comprehensive troubleshooting guide covers the most common issues that may arise when working with the Dulce de Saigon platform, with special emphasis on Vietnamese market-specific challenges and solutions.

### Key Areas Covered

1. **Development Issues**: Environment setup, dependencies, and Vietnamese development context
2. **API Service Issues**: Authentication, rate limiting, and Vietnamese API endpoints
3. **Agents Service Issues**: AI processing, Vietnamese language models, and cultural context
4. **Database Issues**: BigQuery optimization, Vietnamese text handling, and data compliance
5. **Deployment Issues**: Container deployment, regional configuration, and Vietnamese infrastructure
6. **Security Issues**: Authentication, authorization, and Vietnamese data privacy compliance
7. **Vietnamese Localization**: Language display, currency formatting, payment integration, and cultural adaptation
8. **Performance Issues**: API latency, database optimization, mobile performance, and Vietnamese network conditions
9. **Network Issues**: Vietnamese connectivity, DNS resolution, mobile networks, and corporate firewalls
10. **Cost Management**: BigQuery costs, storage optimization, and quota management for Vietnamese operations

### Vietnamese Market Specific Considerations

When troubleshooting issues in the Vietnamese market context, always consider:

- **Data Residency**: Ensure all operations occur in asia-southeast1 region
- **Currency Handling**: Validate VND formatting and payment gateway integration
- **Language Support**: Check UTF-8 encoding and Vietnamese character handling
- **Cultural Context**: Consider Vietnamese business hours, holidays, and regional preferences
- **Compliance**: Verify Vietnamese PDPL adherence and consent management
- **Network Conditions**: Account for Vietnamese mobile networks and corporate firewalls
- **Performance**: Optimize for Vietnamese infrastructure and user patterns

### Quick Reference Commands

```bash
# Check Vietnamese region deployment
gcloud config get-value compute/region  # Should be asia-southeast1

# Verify Vietnamese locale
echo $LANG  # Should include vi_VN.UTF-8

# Check Vietnamese character support
echo "Phở bò tái" | wc -c  # Should count correctly

# Test Vietnamese payment endpoints
curl -X POST https://test-payment.momo.vn/health

# Monitor Vietnamese BigQuery costs
bq query --dry_run --use_legacy_sql=false "SELECT COUNT(*) FROM vietnamese_analytics.orders"
```

### Support and Escalation

For issues not covered in this guide:

1. **Check detailed logs** with Vietnamese context flags
2. **Consult Vietnamese-specific documentation** in the `docs/` folder
3. **Review Vietnamese compliance rules** in `.kilocode/rules/`
4. **Test with Vietnamese data** to reproduce issues
5. **Consider Vietnamese business patterns** when debugging

### Prevention Best Practices

Regular maintenance helps prevent many issues:

- **Monitor Vietnamese region quotas** and costs
- **Update dependencies** with Vietnamese character support
- **Review logs regularly** for Vietnamese-specific patterns
- **Test with Vietnamese data** in development
- **Validate compliance** with Vietnamese regulations
- **Monitor performance** during Vietnamese peak hours
- **Keep Vietnamese payment integrations** up to date

For complex issues or Vietnamese market-specific problems, consider consulting with Vietnamese F&B domain experts or reaching out to the development team with detailed Vietnamese context information.

---

**Note**: This guide is specifically tailored for the Vietnamese F&B market. For general platform issues, refer to the broader documentation set in the `docs/` folder.