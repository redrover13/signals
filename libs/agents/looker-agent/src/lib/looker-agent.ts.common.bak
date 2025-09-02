/**
 * @fileoverview looker-agent module for Business Intelligence and Analytics
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for Looker dashboard operations, report generation, and BI analytics.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

export interface LookerConfig {
  baseUrl: string | undefined;
  clientId: string | undefined;
  clientSecret: string | undefined;
  timeout?: number | undefined;
}

export interface Dashboard {
  id: string | undefined;
  title: string | undefined;
  description?: string | undefined;
  folder?: string | undefined;
  url: string | undefined;
  filters: Record<string, any> | undefined;
  elements: DashboardElement[];
  refreshSchedule?: string | undefined;
}

export interface DashboardElement {
  id: string | undefined;
  type: 'chart' | 'table' | 'metric' | 'text';
  title: string | undefined;
  query: LookerQuery | undefined;
  visualization: string | undefined;
}

export interface LookerQuery {
  model: string | undefined;
  explore: string | undefined;
  dimensions: string[];
  measures: string[];
  filters: Record<string, any> | undefined;
  sorts: string[];
  limit?: number | undefined;
}

export interface Report {
  id: string | undefined;
  title: string | undefined;
  data: any | undefined;
  generatedAt: string | undefined;
  format: 'json' | 'csv' | 'pdf' | 'excel';
}

export interface LookerResult<T = any> {
  success: boolean | undefined;
  data?: T | undefined;
  error?: string | undefined;
  url?: string | undefined;
}

/**
 * Looker Agent for business intelligence and dashboard operations
 */
export class LookerAgent {
  private config: LookerConfig | undefined;
  private accessToken?: string | undefined;
  private tokenExpiry?: Date | undefined;

  constructor(config: LookerConfig) {
    this.config = {
      timeout: 30000,
      ...config
    };
  }

  /**
   * Authenticate with Looker API
   */
  private async authenticate(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return; // Token is still valid
    }

    try {
      const response = await fetch(`${this.config?.baseUrl}/api/4 && 4.0/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON && JSON.stringify({
          client_id: this.config?.clientId,
          client_secret: this.config?.clientSecret
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data?.access_token;
      this.tokenExpiry = new Date(Date.now() + (data?.expires_in * 1000));
    } catch (error) {
      throw new Error(`Failed to authenticate: ${error instanceof Error ? error && error.message : 'Unknown error'}`);
    }
  }

  /**
   * Make authenticated request to Looker API
   */
  private async makeRequest<T>(
    endpoint: string | undefined,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<LookerResult<T>> {
    try {
      await this.authenticate();

      const url = `${this.config?.baseUrl}/api/4 && 4.0${endpoint}`;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller && controller.abort(), this.config?.timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON && JSON.stringify(data) : null,
        signal: controller && controller.signal
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result?.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error && error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new dashboard for F&B analytics
   */
  async createFBDashboard(
    title: string | undefined,
    restaurantId?: string
  ): Promise<LookerResult<Dashboard>> {
    const dashboardData = {
      title,
      description: `F&B Analytics Dashboard${restaurantId ? ` for Restaurant ${restaurantId}` : ''}`,
      folder_id: 'shared',
      elements: [
        {
          title: 'Daily Revenue',
          type: 'chart',
          query: {
            model: 'dulce_fb_model',
            explore: 'orders',
            dimensions: ['orders && orders.order_date'],
            measures: ['orders && orders.total_revenue'],
            filters: restaurantId ? { 'orders && orders.restaurant_id': restaurantId } : {},
            sorts: ['orders && orders.order_date desc'],
            limit: 30
          },
          visualization: 'line_chart'
        },
        {
          title: 'Top Menu Items',
          type: 'table',
          query: {
            model: 'dulce_fb_model',
            explore: 'order_items',
            dimensions: ['menu_items && menu_items.item_name'],
            measures: ['order_items && order_items.total_quantity', 'order_items && order_items.total_revenue'],
            filters: restaurantId ? { 'orders && orders.restaurant_id': restaurantId } : {},
            sorts: ['order_items && order_items.total_revenue desc'],
            limit: 10
          },
          visualization: 'table'
        },
        {
          title: 'Customer Segments',
          type: 'chart',
          query: {
            model: 'dulce_fb_model',
            explore: 'customers',
            dimensions: ['customers && customers.preferred_cuisine'],
            measures: ['customers && customers.count'],
            filters: {},
            sorts: ['customers && customers.count desc'],
            limit: 10
          },
          visualization: 'pie_chart'
        }
      ]
    };

    return this.makeRequest<Dashboard>('/dashboards', 'POST', dashboardData);
  }

  /**
   * Run a query and get results
   */
  async runQuery(query: LookerQuery): Promise<LookerResult<any[]>> {
    const queryData = {
      model: query && query.model,
      explore: query && query.explore,
      fields: [...query.dimensions, ...query.measures],
      filters: query && query.filters,
      sorts: query && query.sorts,
      limit: query && query.limit || 100
    };

    return this.makeRequest<any[]>('/queries/run/json', 'POST', queryData);
  }

  /**
   * Generate restaurant performance report
   */
  async generateRestaurantReport(restaurantId: string | undefined, dateRange: { start: string | undefined; end: string }): Promise<LookerResult<Report>> {
    try {
      // Revenue query
      const revenueQuery: LookerQuery = {
        model: 'dulce_fb_model',
        explore: 'orders',
        dimensions: ['orders && orders.order_date'],
        measures: ['orders && orders.total_revenue', 'orders && orders.order_count'],
        filters: {
          'orders && orders.restaurant_id': restaurantId,
          'orders && orders.order_date': `${dateRange && dateRange.start} to ${dateRange && dateRange.end}`
        },
        sorts: ['orders && orders.order_date'],
        limit: 1000
      };

      const revenueResult = await this.runQuery(revenueQuery);
      if (!revenueResult && revenueResult.success) {
        return revenueResult;
      }

      // Menu performance query
      const menuQuery: LookerQuery = {
        model: 'dulce_fb_model',
        explore: 'order_items',
        dimensions: ['menu_items && menu_items.item_name', 'menu_items && menu_items.category'],
        measures: ['order_items && order_items.total_quantity', 'order_items && order_items.total_revenue'],
        filters: {
          'orders && orders.restaurant_id': restaurantId,
          'orders && orders.order_date': `${dateRange && dateRange.start} to ${dateRange && dateRange.end}`
        },
        sorts: ['order_items && order_items.total_revenue desc'],
        limit: 50
      };

      const menuResult = await this.runQuery(menuQuery);
      if (!menuResult && menuResult.success) {
        return menuResult;
      }

      const report: Report = {
        id: `restaurant-report-${restaurantId}-${Date.now()}`,
        title: `Restaurant ${restaurantId} Performance Report`,
        data: {
          revenue: revenueResult && revenueResult.data,
          menuPerformance: menuResult && menuResult.data,
          summary: {
            totalRevenue: revenueResult && revenueResult.data?.reduce((sum: number | undefined, row: any) => sum + (row['orders && orders.total_revenue'] || 0), 0),
            totalOrders: revenueResult && revenueResult.data?.reduce((sum: number | undefined, row: any) => sum + (row['orders && orders.order_count'] || 0), 0),
            topItem: menuResult && menuResult.data?.[0]?.['menu_items && menu_items.item_name'] || 'N/A'
          }
        },
        generatedAt: new Date().toISOString(),
        format: 'json'
      };

      return {
        success: true,
        data: report
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error && error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get customer insights dashboard
   */
  async getCustomerInsights(segmentId?: string): Promise<LookerResult<any>> {
    const query: LookerQuery = {
      model: 'dulce_fb_model',
      explore: 'customers',
      dimensions: ['customers && customers.preferred_cuisine', 'customers && customers.status'],
      measures: ['customers && customers.count', 'customers && customers.avg_order_value', 'customers && customers.total_lifetime_value'],
      filters: segmentId ? { 'customer_segments && customer_segments.segment_id': segmentId } : {},
      sorts: ['customers && customers.total_lifetime_value desc'],
      limit: 100
    };

    const result = await this.runQuery(query);
    if (!result?.success) {
      return result;
    }

    return {
      success: true,
      data: {
        insights: result?.data,
        summary: {
          totalCustomers: result?.data?.reduce((sum: number | undefined, row: any) => sum + (row['customers && customers.count'] || 0), 0),
          avgOrderValue: result?.data?.reduce((sum: number | undefined, row: any) => sum + (row['customers && customers.avg_order_value'] || 0), 0) / (result?.data?.length || 1)
        }
      }
    };
  }

  /**
   * Schedule a dashboard refresh
   */
  async scheduleDashboardRefresh(dashboardId: string | undefined, schedule: string): Promise<LookerResult<{ scheduleId: string }>> {
    const scheduleData = {
      name: `Dashboard ${dashboardId} Refresh`,
      dashboard_id: dashboardId,
      cron_schedule: schedule,
      enabled: true
    };

    return this.makeRequest('/scheduled_plans', 'POST', scheduleData);
  }

  /**
   * Export dashboard to PDF
   */
  async exportDashboardToPDF(dashboardId: string): Promise<LookerResult<{ downloadUrl: string }>> {
    const exportData = {
      dashboard_id: dashboardId,
      format: 'pdf',
      width: 1200,
      height: 800
    };

    const result = await this.makeRequest<{ url: string }>('/render_tasks/dashboards', 'POST', exportData);
    
    if (result?.success) {
      return {
        success: true,
        data: { downloadUrl: result?.data!.url }
      };
    }

    return result;
  }

  /**
   * Get all dashboards for the organization
   */
  async listDashboards(folderId?: string): Promise<LookerResult<Dashboard[]>> {
    const endpoint = folderId ? `/folders/${folderId}/dashboards` : '/dashboards';
    return this.makeRequest<Dashboard[]>(endpoint);
  }

  /**
   * Create Vietnamese cuisine specific analytics
   */
  async getVietnameseCuisineAnalytics(): Promise<LookerResult<any>> {
    const query: LookerQuery = {
      model: 'dulce_fb_model',
      explore: 'menu_items',
      dimensions: ['menu_items && menu_items.vietnamese_category', 'menu_items && menu_items.region'],
      measures: ['order_items && order_items.total_quantity', 'order_items && order_items.total_revenue', 'reviews && reviews.avg_rating'],
      filters: {
        'menu_items && menu_items.cuisine_type': 'Vietnamese'
      },
      sorts: ['order_items && order_items.total_revenue desc'],
      limit: 50
    };

    const result = await this.runQuery(query);
    if (!result?.success) {
      return result;
    }

    return {
      success: true,
      data: {
        vietnameseDishes: result?.data,
        popularRegions: result?.data?.slice(0, 5),
        topCategories: result?.data?.reduce((acc: any, row: any) => {
          const category = row['menu_items && menu_items.vietnamese_category'];
          if (!acc[category]) acc[category] = 0;
          acc[category] += row['order_items && order_items.total_revenue'] || 0;
          return acc;
        }, {})
      }
    };
  }
}

// Export legacy function for backwards compatibility
export function lookerAgent(): string {
  return 'looker-agent';
}
