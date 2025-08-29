/**
 * @fileoverview crm-agent module for Customer Relationship Management
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for CRM operations, customer data management, and external API integrations.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

export interface CRMConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  preferredCuisine?: string;
  dietaryRestrictions?: string[];
  loyaltyPoints?: number;
  status: 'active' | 'inactive' | 'vip';
  createdAt: string;
  lastOrderDate?: string;
}

export interface CRMResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  customerCount: number;
}

/**
 * CRM Agent for managing customer relationships and external integrations
 */
export class CRMAgent {
  private config: CRMConfig;
  private baseUrl: string;

  constructor(config: CRMConfig = {}) {
    this.config = {
      timeout: 30000,
      ...config
    };
    this.baseUrl = config.baseUrl || 'https://api.crm.dulcedesaigon.com';
  }

  /**
   * Make HTTP request to CRM API
   */
  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<CRMResult<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Dulce-CRM-Agent/1.0'
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: result,
        statusCode: response.status
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get customer information
   */
  async getCustomer(customerId: string): Promise<CRMResult<Customer>> {
    return this.makeRequest<Customer>(`/customers/${customerId}`);
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData: Partial<Customer>): Promise<CRMResult<Customer>> {
    const customer = {
      status: 'active',
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
      ...customerData
    };
    
    return this.makeRequest<Customer>('/customers', 'POST', customer);
  }

  /**
   * Update customer information
   */
  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<CRMResult<Customer>> {
    return this.makeRequest<Customer>(`/customers/${customerId}`, 'PUT', updates);
  }

  /**
   * Search customers by various criteria
   */
  async searchCustomers(criteria: {
    email?: string;
    phone?: string;
    name?: string;
    status?: string;
    preferredCuisine?: string;
  }): Promise<CRMResult<Customer[]>> {
    const params = new URLSearchParams();
    Object.entries(criteria).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    return this.makeRequest<Customer[]>(`/customers/search?${params.toString()}`);
  }

  /**
   * Add loyalty points to customer
   */
  async addLoyaltyPoints(customerId: string, points: number, reason: string): Promise<CRMResult<{ newBalance: number }>> {
    return this.makeRequest(`/customers/${customerId}/loyalty`, 'POST', { points, reason });
  }

  /**
   * Send marketing email to customer
   */
  async sendMarketingEmail(customerId: string, template: string, data: Record<string, any>): Promise<CRMResult<{ messageId: string }>> {
    const emailData = {
      customerId,
      template,
      data,
      timestamp: new Date().toISOString()
    };
    
    return this.makeRequest('/marketing/email', 'POST', emailData);
  }

  /**
   * Create customer segment based on criteria
   */
  async createCustomerSegment(segment: Omit<CustomerSegment, 'id' | 'customerCount'>): Promise<CRMResult<CustomerSegment>> {
    return this.makeRequest<CustomerSegment>('/segments', 'POST', segment);
  }

  /**
   * Get customers in a specific segment
   */
  async getCustomersInSegment(segmentId: string): Promise<CRMResult<Customer[]>> {
    return this.makeRequest<Customer[]>(`/segments/${segmentId}/customers`);
  }

  /**
   * Send SMS notification to customer
   */
  async sendSMS(customerId: string, message: string): Promise<CRMResult<{ messageId: string }>> {
    return this.makeRequest('/notifications/sms', 'POST', { customerId, message });
  }

  /**
   * Track customer activity/event
   */
  async trackActivity(customerId: string, activity: {
    type: string;
    data: Record<string, any>;
    timestamp?: string;
  }): Promise<CRMResult<{ activityId: string }>> {
    const activityData = {
      customerId,
      timestamp: new Date().toISOString(),
      ...activity
    };
    
    return this.makeRequest('/activities', 'POST', activityData);
  }

  /**
   * Get customer activity history
   */
  async getCustomerActivity(customerId: string, limit: number = 50): Promise<CRMResult<any[]>> {
    return this.makeRequest(`/customers/${customerId}/activities?limit=${limit}`);
  }

  /**
   * Sync customer data with external CRM systems (e.g., Salesforce, HubSpot)
   */
  async syncWithExternalCRM(customerId: string, externalSystem: 'salesforce' | 'hubspot' | 'mailchimp'): Promise<CRMResult<{ syncId: string }>> {
    return this.makeRequest('/integrations/sync', 'POST', { customerId, externalSystem });
  }

  /**
   * Get customer analytics and insights
   */
  async getCustomerInsights(customerId: string): Promise<CRMResult<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: string;
    preferredRestaurants: string[];
    riskScore: number;
    loyaltyTier: string;
  }>> {
    return this.makeRequest(`/customers/${customerId}/insights`);
  }
}

// Export legacy function for backwards compatibility
export function crmAgent(): string {
  return 'crm-agent';
}
