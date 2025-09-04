# API Design Standards

## Overview

This document defines API design standards for the Signals monorepo, ensuring consistent, secure, and user-friendly APIs that serve the Vietnamese F&B market effectively while maintaining international best practices.

## RESTful API Design

### Rule: Consistent Resource Naming

**Severity**: Warning  
**Category**: API Design

API endpoints should follow consistent naming conventions with proper resource hierarchy.

#### ✅ Compliant Examples

```typescript
// Good: Consistent RESTful resource naming
export class OrdersController {
  // GET /api/v1/orders - List orders
  async listOrders(req: Request, res: Response): Promise<void> {
    const { page = 1, limit = 20, status, customerId } = req.query;

    const filters: OrderFilters = {
      ...(status && { status: status as OrderStatus }),
      ...(customerId && { customerId: customerId as string }),
    };

    const result = await this.orderService.listOrders(filters, {
      page: Number(page),
      limit: Math.min(Number(limit), 100), // Max 100 items per page
    });

    res.json({
      data: result.orders,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
      meta: {
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Ho_Chi_Minh',
      },
    });
  }

  // GET /api/v1/orders/:orderId - Get specific order
  async getOrder(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;

    const order = await this.orderService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Order not found',
        details: { orderId },
      });
      return;
    }

    res.json({
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Ho_Chi_Minh',
      },
    });
  }

  // POST /api/v1/orders - Create new order
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData = await this.validateCreateOrderRequest(req.body);
      const order = await this.orderService.createOrder(orderData);

      res.status(201).json({
        data: order,
        meta: {
          timestamp: new Date().toISOString(),
          timezone: 'Asia/Ho_Chi_Minh',
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PUT /api/v1/orders/:orderId - Update entire order
  async updateOrder(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;

    try {
      const updateData = await this.validateUpdateOrderRequest(req.body);
      const order = await this.orderService.updateOrder(orderId, updateData);

      res.json({
        data: order,
        meta: {
          timestamp: new Date().toISOString(),
          timezone: 'Asia/Ho_Chi_Minh',
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /api/v1/orders/:orderId/status - Partial update (status only)
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const { status, reason } = req.body;

    try {
      const order = await this.orderService.updateOrderStatus(orderId, status, reason);

      res.json({
        data: order,
        meta: {
          timestamp: new Date().toISOString(),
          timezone: 'Asia/Ho_Chi_Minh',
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE /api/v1/orders/:orderId - Cancel order
  async cancelOrder(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const { reason } = req.body;

    try {
      await this.orderService.cancelOrder(orderId, reason);

      res.status(204).send(); // No content for successful deletion
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /api/v1/orders/:orderId/items - Nested resource
  async getOrderItems(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;

    const items = await this.orderService.getOrderItems(orderId);

    res.json({
      data: items,
      meta: {
        orderId,
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Ho_Chi_Minh',
      },
    });
  }
}
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Inconsistent naming and structure
export class BadOrdersController {
  // Bad: Inconsistent endpoint naming
  async getAllOrders(req: Request, res: Response): Promise<void> {
    // GET /orders/getAll - Not RESTful
  }

  async orderById(req: Request, res: Response): Promise<void> {
    // GET /order/:id - Inconsistent resource naming
  }

  async createNewOrder(req: Request, res: Response): Promise<void> {
    // POST /orders/create - Redundant 'create' in URL
  }

  async deleteOrderById(req: Request, res: Response): Promise<void> {
    // DELETE /orders/delete/:id - Redundant 'delete' in URL
  }
}
```

### Rule: Proper HTTP Status Codes

**Severity**: Error  
**Category**: API Design

Use appropriate HTTP status codes for different response scenarios.

#### ✅ Compliant Examples

```typescript
// Good: Proper HTTP status code usage
export class MenuController {
  async getMenuItem(req: Request, res: Response): Promise<void> {
    const { itemId } = req.params;

    try {
      const item = await this.menuService.getMenuItem(itemId);

      if (!item) {
        // 404 - Resource not found
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Menu item not found',
          details: { itemId },
        });
        return;
      }

      // 200 - Success
      res.status(200).json({
        data: item,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      // 500 - Internal server error
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve menu item',
        details: { itemId },
      });
    }
  }

  async createMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const itemData = await this.validateMenuItemData(req.body);
      const item = await this.menuService.createMenuItem(itemData);

      // 201 - Created
      res.status(201).json({
        data: item,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        // 400 - Bad request
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: error.message,
          details: error.context,
        });
      } else if (error instanceof ConflictError) {
        // 409 - Conflict
        res.status(409).json({
          error: 'CONFLICT',
          message: error.message,
          details: error.context,
        });
      } else {
        // 500 - Internal server error
        res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create menu item',
        });
      }
    }
  }

  async updateMenuItem(req: Request, res: Response): Promise<void> {
    const { itemId } = req.params;

    try {
      const updateData = await this.validateMenuItemUpdate(req.body);
      const item = await this.menuService.updateMenuItem(itemId, updateData);

      // 200 - Success
      res.status(200).json({
        data: item,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        // 404 - Not found
        res.status(404).json({
          error: 'NOT_FOUND',
          message: error.message,
          details: { itemId },
        });
      } else if (error instanceof ValidationError) {
        // 400 - Bad request
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: error.message,
          details: error.context,
        });
      } else {
        // 500 - Internal server error
        res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update menu item',
        });
      }
    }
  }

  async deleteMenuItem(req: Request, res: Response): Promise<void> {
    const { itemId } = req.params;

    try {
      await this.menuService.deleteMenuItem(itemId);

      // 204 - No content (successful deletion)
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        // 404 - Not found
        res.status(404).json({
          error: 'NOT_FOUND',
          message: error.message,
          details: { itemId },
        });
      } else {
        // 500 - Internal server error
        res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete menu item',
        });
      }
    }
  }
}
```

## Request/Response Standards

### Rule: Consistent Response Format

**Severity**: Warning  
**Category**: API Design

All API responses should follow a consistent format with proper metadata.

#### ✅ Compliant Examples

```typescript
// Good: Consistent response format
export interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
  pagination?: PaginationMeta;
  links?: ResponseLinks;
}

export interface ResponseMeta {
  timestamp: string;
  timezone: string;
  requestId?: string;
  version: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ResponseLinks {
  self: string;
  next?: string;
  prev?: string;
  first?: string;
  last?: string;
}

export class ResponseBuilder {
  static success<T>(data: T, meta: Partial<ResponseMeta> = {}): ApiResponse<T> {
    return {
      data,
      meta: {
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Ho_Chi_Minh',
        version: 'v1',
        ...meta,
      },
    };
  }

  static paginated<T>(
    data: T[],
    pagination: PaginationMeta,
    baseUrl: string,
    meta: Partial<ResponseMeta> = {},
  ): ApiResponse<T[]> {
    const links: ResponseLinks = {
      self: `${baseUrl}?page=${pagination.page}&limit=${pagination.limit}`,
    };

    if (pagination.hasNext) {
      links.next = `${baseUrl}?page=${pagination.page + 1}&limit=${pagination.limit}`;
      links.last = `${baseUrl}?page=${pagination.totalPages}&limit=${pagination.limit}`;
    }

    if (pagination.hasPrev) {
      links.prev = `${baseUrl}?page=${pagination.page - 1}&limit=${pagination.limit}`;
      links.first = `${baseUrl}?page=1&limit=${pagination.limit}`;
    }

    return {
      data,
      meta: {
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Ho_Chi_Minh',
        version: 'v1',
        ...meta,
      },
      pagination,
      links,
    };
  }

  static error(error: AppError, meta: Partial<ResponseMeta> = {}): ErrorResponse {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.context,
      },
      meta: {
        timestamp: new Date().toISOString(),
        timezone: 'Asia/Ho_Chi_Minh',
        version: 'v1',
        ...meta,
      },
    };
  }
}

// Usage in controllers
export class RestaurantController {
  async getRestaurants(req: Request, res: Response): Promise<void> {
    const { page = 1, limit = 20, city } = req.query;

    const result = await this.restaurantService.getRestaurants(
      {
        city: city as string,
      },
      {
        page: Number(page),
        limit: Math.min(Number(limit), 100),
      },
    );

    const response = ResponseBuilder.paginated(
      result.restaurants,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.page < Math.ceil(result.total / result.limit),
        hasPrev: result.page > 1,
      },
      `${req.protocol}://${req.get('host')}${req.path}`,
      { requestId: req.headers['x-request-id'] as string },
    );

    res.json(response);
  }
}
```

### Rule: Input Validation and Sanitization

**Severity**: Error  
**Category**: API Design

All API inputs must be validated and sanitized, with special attention to Vietnamese-specific formats.

#### ✅ Compliant Examples

```typescript
// Good: Comprehensive input validation
import { z } from 'zod';

// Vietnamese-specific validation schemas
const vietnamesePhoneSchema = z
  .string()
  .regex(
    /^(\+84|84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
    'Invalid Vietnamese phone number format',
  );

const vietnameseAddressSchema = z.object({
  street: z.string().min(1).max(200),
  ward: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  country: z.literal('Việt Nam').default('Việt Nam'),
});

const createOrderSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID format'),
  customerName: z
    .string()
    .min(1, 'Customer name is required')
    .max(100, 'Customer name too long')
    .regex(/^[\p{L}\s\-'\.]+$/u, 'Invalid characters in customer name'),
  customerPhone: vietnamesePhoneSchema,
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1, 'Menu item ID is required'),
        quantity: z
          .number()
          .int('Quantity must be an integer')
          .min(1, 'Quantity must be at least 1')
          .max(50, 'Quantity cannot exceed 50'),
        specialInstructions: z.string().max(500).optional(),
      }),
    )
    .min(1, 'At least one item is required'),
  deliveryAddress: vietnameseAddressSchema.optional(),
  paymentMethod: z.enum([
    'Tiền Mặt',
    'Chuyển Khoản Ngân Hàng',
    'Momo',
    'ZaloPay',
    'VNPay',
    'Thẻ Tín Dụng',
  ]),
  orderType: z.enum(['Tại Chỗ', 'Mang Đi', 'Giao Hàng']),
  specialRequests: z.string().max(1000).optional(),
  scheduledDeliveryTime: z.string().datetime().optional(),
});

export class OrderValidationMiddleware {
  static validateCreateOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Sanitize input
      const sanitizedBody = this.sanitizeInput(req.body);

      // Validate against schema
      const validatedData = createOrderSchema.parse(sanitizedBody);

      // Additional business logic validation
      await this.validateBusinessRules(validatedData);

      // Attach validated data to request
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json(
            ResponseBuilder.error(
              new ValidationError(
                'request_body',
                req.body,
                error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
              ),
            ),
          );
      } else if (error instanceof ValidationError) {
        res.status(400).json(ResponseBuilder.error(error));
      } else {
        res
          .status(500)
          .json(
            ResponseBuilder.error(new InternalServerError('Validation failed', { cause: error })),
          );
      }
    }
  };

  private static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters
      return input
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeInput(item));
    }

    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  private static async validateBusinessRules(data: any): Promise<void> {
    // Validate delivery address is provided for delivery orders
    if (data.orderType === 'Giao Hàng' && !data.deliveryAddress) {
      throw new ValidationError(
        'deliveryAddress',
        data.deliveryAddress,
        'Delivery address is required for delivery orders',
      );
    }

    // Validate scheduled delivery time is in the future
    if (data.scheduledDeliveryTime) {
      const scheduledTime = new Date(data.scheduledDeliveryTime);
      const now = new Date();

      if (scheduledTime <= now) {
        throw new ValidationError(
          'scheduledDeliveryTime',
          data.scheduledDeliveryTime,
          'Scheduled delivery time must be in the future',
        );
      }

      // Check if scheduled time is within business hours (Vietnam time)
      const vietnamTime = new Date(
        scheduledTime.toLocaleString('en-US', {
          timeZone: 'Asia/Ho_Chi_Minh',
        }),
      );
      const hour = vietnamTime.getHours();

      if (hour < 6 || hour > 22) {
        throw new ValidationError(
          'scheduledDeliveryTime',
          data.scheduledDeliveryTime,
          'Delivery is only available between 6:00 AM and 10:00 PM Vietnam time',
        );
      }
    }
  }
}
```

## Authentication and Authorization

### Rule: JWT Token Standards

**Severity**: Error  
**Category**: Security

Implement secure JWT token handling with proper validation and Vietnamese market considerations.

#### ✅ Compliant Examples

```typescript
// Good: Secure JWT implementation
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  // Vietnamese market specific claims
  preferredLanguage: 'vi' | 'en';
  timezone: string;
  region: 'VN';
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtIssuer = 'dulce-de-saigon-api';
  private readonly jwtAudience = 'dulce-de-saigon-app';

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    if (!this.jwtSecret) {
      throw new ConfigurationError('JWT_SECRET', 'string');
    }
  }

  generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      iss: this.jwtIssuer,
      aud: this.jwtAudience,
      preferredLanguage: user.preferences.language,
      timezone: user.preferences.timezone || 'Asia/Ho_Chi_Minh',
      region: 'VN',
    };

    return jwt.sign(payload, this.jwtSecret, {
      algorithm: 'HS256',
    });
  }

  verifyToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
        algorithms: ['HS256'],
      }) as JWTPayload;

      // Additional validation for Vietnamese market
      if (payload.region !== 'VN') {
        throw new AuthenticationError('Invalid token region');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token', { cause: error });
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired', { cause: error });
      }
      throw error;
    }
  }
}

export class AuthMiddleware {
  constructor(private readonly authService: AuthService) {}

  authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res
          .status(401)
          .json(
            ResponseBuilder.error(
              new AuthenticationError('Missing or invalid authorization header'),
            ),
          );
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const payload = this.authService.verifyToken(token);

      // Attach user info to request
      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
        preferredLanguage: payload.preferredLanguage,
        timezone: payload.timezone,
      };

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json(ResponseBuilder.error(error));
      } else {
        res
          .status(500)
          .json(
            ResponseBuilder.error(
              new InternalServerError('Authentication failed', { cause: error }),
            ),
          );
      }
    }
  };

  authorize = (requiredPermissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res
          .status(401)
          .json(ResponseBuilder.error(new AuthenticationError('Authentication required')));
        return;
      }

      const hasPermission = requiredPermissions.every((permission) =>
        req.user.permissions.includes(permission),
      );

      if (!hasPermission) {
        res.status(403).json(
          ResponseBuilder.error(
            new AuthorizationError('Insufficient permissions', {
              required: requiredPermissions,
              actual: req.user.permissions,
            }),
          ),
        );
        return;
      }

      next();
    };
  };
}
```

These API design standards ensure consistent, secure, and user-friendly APIs that effectively serve the Vietnamese F&B market while maintaining international best practices and proper error handling.
