# Testing Patterns and Standards

## Overview

This document defines comprehensive testing patterns and standards for the Signals monorepo. These patterns ensure consistent, reliable, and maintainable tests across all projects while supporting both unit and integration testing scenarios.

## Test Structure and Organization

### Rule: Arrange-Act-Assert Pattern

**Severity**: Warning  
**Category**: Test Structure

All tests should follow the Arrange-Act-Assert (AAA) pattern for clarity and consistency.

#### ✅ Compliant Examples

```typescript
// Good: Clear AAA structure
describe('OrderService', () => {
  describe('calculateTotal', () => {
    it('should calculate total with tax for Vietnamese orders', () => {
      // Arrange
      const orderItems: OrderItem[] = [
        { id: '1', price: 100000, quantity: 2 }, // 200,000 VND
        { id: '2', price: 50000, quantity: 1 }, // 50,000 VND
      ];
      const taxRate = 0.1; // 10% VAT in Vietnam
      const expectedTotal = 275000; // (200,000 + 50,000) * 1.1

      // Act
      const result = orderService.calculateTotal(orderItems, taxRate);

      // Assert
      expect(result).toBe(expectedTotal);
    });

    it('should handle empty order items', () => {
      // Arrange
      const orderItems: OrderItem[] = [];
      const taxRate = 0.1;

      // Act
      const result = orderService.calculateTotal(orderItems, taxRate);

      // Assert
      expect(result).toBe(0);
    });
  });
});
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Mixed arrange/act/assert without clear separation
it('should calculate total', () => {
  const items = [{ price: 100, quantity: 2 }];
  expect(orderService.calculateTotal(items, 0.1)).toBe(220);
  const moreItems = [{ price: 50, quantity: 1 }];
  expect(orderService.calculateTotal(moreItems, 0.1)).toBe(55);
});
```

### Rule: Descriptive Test Names

**Severity**: Warning  
**Category**: Test Structure

Test names should clearly describe the behavior being tested.

#### ✅ Compliant Examples

```typescript
// Good: Descriptive test names
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid Vietnamese phone number', async () => {
      // Test implementation
    });

    it('should throw ValidationError when email is invalid', async () => {
      // Test implementation
    });

    it('should throw ConflictError when user already exists', async () => {
      // Test implementation
    });
  });

  describe('authenticateUser', () => {
    it('should return user profile when credentials are valid', async () => {
      // Test implementation
    });

    it('should throw AuthenticationError when password is incorrect', async () => {
      // Test implementation
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Test implementation
    });
  });
});
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Vague test names
describe('UserService', () => {
  it('should work', () => {
    // What should work?
  });

  it('test user creation', () => {
    // What aspect of user creation?
  });

  it('should fail', () => {
    // When should it fail? How should it fail?
  });
});
```

## Mocking and Test Doubles

### Rule: Proper Mock Setup and Cleanup

**Severity**: Error  
**Category**: Mocking

Mocks should be properly set up and cleaned up to avoid test interference.

#### ✅ Compliant Examples

```typescript
// Good: Proper mock setup and cleanup
describe('BigQueryService', () => {
  let bigQueryService: BigQueryService;
  let mockBigQueryClient: jest.Mocked<BigQuery>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockBigQueryClient = {
      query: jest.fn(),
      dataset: jest.fn(),
      createQueryJob: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    bigQueryService = new BigQueryService(mockBigQueryClient, mockLogger);
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  describe('executeQuery', () => {
    it('should execute query and return results', async () => {
      // Arrange
      const sql = 'SELECT * FROM users WHERE id = ?';
      const params = ['user123'];
      const expectedResults = [{ id: 'user123', name: 'John Doe' }];

      mockBigQueryClient.query.mockResolvedValue([expectedResults]);

      // Act
      const results = await bigQueryService.executeQuery(sql, params);

      // Assert
      expect(results).toEqual(expectedResults);
      expect(mockBigQueryClient.query).toHaveBeenCalledWith({
        query: sql,
        params,
        location: 'asia-southeast1',
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Executing BigQuery query',
        expect.objectContaining({
          sql: expect.stringContaining('SELECT * FROM users'),
          paramCount: 1,
        }),
      );
    });

    it('should handle query errors and log appropriately', async () => {
      // Arrange
      const sql = 'INVALID SQL';
      const queryError = new Error('Syntax error in SQL');

      mockBigQueryClient.query.mockRejectedValue(queryError);

      // Act & Assert
      await expect(bigQueryService.executeQuery(sql)).rejects.toThrow(ExternalServiceError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'BigQuery query failed',
        expect.objectContaining({
          sql: expect.stringContaining('INVALID SQL'),
          error: expect.objectContaining({
            message: 'Syntax error in SQL',
          }),
        }),
      );
    });
  });
});
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Shared mocks without proper cleanup
describe('BigQueryService', () => {
  const mockBigQueryClient = jest.fn(); // Shared across tests

  it('should execute query', async () => {
    mockBigQueryClient.mockResolvedValue([{ id: '1' }]);
    // Test implementation
  });

  it('should handle errors', async () => {
    // Previous mock state might interfere
    mockBigQueryClient.mockRejectedValue(new Error('Test error'));
    // Test implementation
  });
});
```

### Rule: Mock External Dependencies Only

**Severity**: Warning  
**Category**: Mocking

Only mock external dependencies, not the code under test.

#### ✅ Compliant Examples

```typescript
// Good: Mocking external dependencies
describe('OrderService', () => {
  let orderService: OrderService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    mockOrderRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    mockPaymentService = {
      processPayment: jest.fn(),
      refundPayment: jest.fn(),
    } as any;

    mockEmailService = {
      sendOrderConfirmation: jest.fn(),
    } as any;

    // Don't mock the service under test
    orderService = new OrderService(mockOrderRepository, mockPaymentService, mockEmailService);
  });

  it('should create order and send confirmation email', async () => {
    // Arrange
    const orderData = createTestOrderData();
    const createdOrder = { ...orderData, id: 'order123' };

    mockOrderRepository.create.mockResolvedValue(createdOrder);
    mockPaymentService.processPayment.mockResolvedValue({ id: 'payment123' });
    mockEmailService.sendOrderConfirmation.mockResolvedValue(undefined);

    // Act
    const result = await orderService.createOrder(orderData);

    // Assert
    expect(result).toEqual(createdOrder);
    expect(mockOrderRepository.create).toHaveBeenCalledWith(orderData);
    expect(mockPaymentService.processPayment).toHaveBeenCalled();
    expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith(createdOrder);
  });
});
```

#### ❌ Non-Compliant Examples

```typescript
// Bad: Mocking the code under test
describe('OrderService', () => {
  it('should create order', async () => {
    const mockOrderService = {
      createOrder: jest.fn().mockResolvedValue({ id: 'order123' }),
    };

    // This doesn't test the actual implementation
    const result = await mockOrderService.createOrder({});
    expect(result).toEqual({ id: 'order123' });
  });
});
```

## Integration Testing Patterns

### Rule: Database Integration Tests

**Severity**: Warning  
**Category**: Integration Testing

Database integration tests should use test databases and proper cleanup.

#### ✅ Compliant Examples

```typescript
// Good: Database integration test with proper setup
describe('UserRepository Integration', () => {
  let userRepository: UserRepository;
  let testDatabase: Database;

  beforeAll(async () => {
    // Set up test database
    testDatabase = await createTestDatabase();
    await testDatabase.migrate();

    userRepository = new UserRepository(testDatabase);
  });

  afterAll(async () => {
    // Clean up test database
    await testDatabase.close();
  });

  beforeEach(async () => {
    // Clean data before each test
    await testDatabase.truncateAll();
  });

  describe('create', () => {
    it('should create user with Vietnamese phone number', async () => {
      // Arrange
      const userData: CreateUserData = {
        email: 'test@example.com',
        name: 'Nguyễn Văn A',
        phoneNumber: '+84901234567',
        address: 'Hồ Chí Minh, Việt Nam',
      };

      // Act
      const createdUser = await userRepository.create(userData);

      // Assert
      expect(createdUser).toMatchObject({
        email: userData.email,
        name: userData.name,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
      });
      expect(createdUser.id).toBeDefined();
      expect(createdUser.createdAt).toBeInstanceOf(Date);

      // Verify in database
      const foundUser = await userRepository.findById(createdUser.id);
      expect(foundUser).toEqual(createdUser);
    });

    it('should enforce unique email constraint', async () => {
      // Arrange
      const userData: CreateUserData = {
        email: 'duplicate@example.com',
        name: 'User 1',
        phoneNumber: '+84901234567',
      };

      await userRepository.create(userData);

      // Act & Assert
      await expect(userRepository.create({ ...userData, name: 'User 2' })).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe('findByEmail', () => {
    it('should find user by email case-insensitively', async () => {
      // Arrange
      const userData: CreateUserData = {
        email: 'Test@Example.Com',
        name: 'Test User',
        phoneNumber: '+84901234567',
      };

      const createdUser = await userRepository.create(userData);

      // Act
      const foundUser = await userRepository.findByEmail('test@example.com');

      // Assert
      expect(foundUser).toEqual(createdUser);
    });
  });
});
```

### Rule: API Integration Tests

**Severity**: Warning  
**Category**: Integration Testing

API integration tests should test the full request/response cycle.

#### ✅ Compliant Examples

```typescript
// Good: API integration test
describe('Orders API Integration', () => {
  let app: Application;
  let testDatabase: Database;
  let authToken: string;

  beforeAll(async () => {
    // Set up test application
    testDatabase = await createTestDatabase();
    app = await createTestApp(testDatabase);

    // Create test user and get auth token
    const testUser = await createTestUser();
    authToken = await generateAuthToken(testUser.id);
  });

  afterAll(async () => {
    await testDatabase.close();
  });

  beforeEach(async () => {
    await testDatabase.truncateAll();
    await seedTestData();
  });

  describe('POST /api/orders', () => {
    it('should create order with Vietnamese address', async () => {
      // Arrange
      const orderData = {
        customerId: 'customer123',
        items: [
          { menuItemId: 'pho-bo', quantity: 2, price: 75000 },
          { menuItemId: 'che-ba-mau', quantity: 1, price: 25000 },
        ],
        deliveryAddress: {
          street: '123 Nguyễn Huệ',
          district: 'Quận 1',
          city: 'Hồ Chí Minh',
          country: 'Việt Nam',
        },
        paymentMethod: 'Momo',
        totalAmount: 175000,
      };

      // Act
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        id: expect.any(String),
        customerId: orderData.customerId,
        items: orderData.items,
        deliveryAddress: orderData.deliveryAddress,
        paymentMethod: orderData.paymentMethod,
        totalAmount: orderData.totalAmount,
        status: 'Đặt Hàng',
        createdAt: expect.any(String),
      });

      // Verify in database
      const createdOrder = await testDatabase
        .collection('orders')
        .findOne({ id: response.body.id });

      expect(createdOrder).toBeTruthy();
      expect(createdOrder.customerId).toBe(orderData.customerId);
    });

    it('should return 400 for invalid Vietnamese phone number', async () => {
      // Arrange
      const invalidOrderData = {
        customerId: 'customer123',
        items: [{ menuItemId: 'pho-bo', quantity: 1, price: 75000 }],
        customerPhone: '123456', // Invalid Vietnamese phone
        totalAmount: 75000,
      };

      // Act
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOrderData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('phone number'),
        details: expect.objectContaining({
          field: 'customerPhone',
        }),
      });
    });

    it('should return 401 without authentication', async () => {
      // Arrange
      const orderData = {
        customerId: 'customer123',
        items: [{ menuItemId: 'pho-bo', quantity: 1, price: 75000 }],
        totalAmount: 75000,
      };

      // Act & Assert
      await request(app).post('/api/orders').send(orderData).expect(401);
    });
  });
});
```

## Test Data Management

### Rule: Test Data Factories

**Severity**: Warning  
**Category**: Test Data

Use factory functions to create consistent test data.

#### ✅ Compliant Examples

```typescript
// Good: Test data factories
export const TestDataFactory = {
  createUser: (overrides: Partial<User> = {}): User => ({
    id: `user_${Date.now()}_${Math.random()}`,
    email: `test${Math.random()}@example.com`,
    name: 'Nguyễn Văn Test',
    phoneNumber: '+84901234567',
    address: 'Hồ Chí Minh, Việt Nam',
    preferences: {
      language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createOrder: (overrides: Partial<Order> = {}): Order => ({
    id: `order_${Date.now()}_${Math.random()}`,
    customerId: 'customer123',
    items: [
      {
        menuItemId: 'pho-bo-dac-biet',
        itemName: 'Phở Bò Đặc Biệt',
        quantity: 1,
        price: 85000,
      },
    ],
    totalAmount: 85000,
    currency: 'VND',
    status: 'Đặt Hàng',
    paymentMethod: 'Tiền Mặt',
    orderType: 'Tại Chỗ',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createMenuItem: (overrides: Partial<MenuItem> = {}): MenuItem => ({
    id: `menu_${Date.now()}_${Math.random()}`,
    itemName: {
      vi: 'Phở Bò',
      en: 'Beef Pho',
    },
    description: {
      vi: 'Phở bò truyền thống với nước dùng đậm đà',
      en: 'Traditional beef pho with rich broth',
    },
    category: 'Phở',
    price: 75000,
    currency: 'VND',
    isActive: true,
    dietaryInfo: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  // Builder pattern for complex objects
  userBuilder: () => ({
    withEmail: (email: string) => ({ ...TestDataFactory.createUser(), email }),
    withVietnamesePhone: (phone: string) => ({
      ...TestDataFactory.createUser(),
      phoneNumber: phone,
    }),
    withPreferences: (preferences: UserPreferences) => ({
      ...TestDataFactory.createUser(),
      preferences,
    }),
    build: (overrides: Partial<User> = {}) => TestDataFactory.createUser(overrides),
  }),
};

// Usage in tests
describe('UserService', () => {
  it('should create user with Vietnamese preferences', async () => {
    // Arrange
    const userData = TestDataFactory.createUser({
      preferences: {
        language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        notifications: { email: true, push: true, sms: true },
      },
    });

    // Act & Assert
    const result = await userService.createUser(userData);
    expect(result.preferences.language).toBe('vi');
  });

  it('should handle multiple users', async () => {
    // Arrange
    const users = [
      TestDataFactory.createUser({ name: 'Nguyễn Văn A' }),
      TestDataFactory.createUser({ name: 'Trần Thị B' }),
      TestDataFactory.createUser({ name: 'Lê Văn C' }),
    ];

    // Act & Assert
    for (const user of users) {
      const result = await userService.createUser(user);
      expect(result.id).toBeDefined();
    }
  });
});
```

### Rule: Test Database Seeding

**Severity**: Warning  
**Category**: Test Data

Use consistent seeding strategies for integration tests.

#### ✅ Compliant Examples

```typescript
// Good: Structured test seeding
export class TestSeeder {
  constructor(private readonly database: Database) {}

  async seedBasicData(): Promise<TestSeedData> {
    const users = await this.seedUsers();
    const menuItems = await this.seedMenuItems();
    const orders = await this.seedOrders(users, menuItems);

    return { users, menuItems, orders };
  }

  private async seedUsers(): Promise<User[]> {
    const users = [
      TestDataFactory.createUser({
        email: 'admin@dulcedesaigon.com',
        name: 'Admin User',
        role: 'admin',
      }),
      TestDataFactory.createUser({
        email: 'customer@example.com',
        name: 'Nguyễn Văn Khách',
        role: 'customer',
      }),
    ];

    return Promise.all(users.map((user) => this.database.collection('users').insertOne(user)));
  }

  private async seedMenuItems(): Promise<MenuItem[]> {
    const menuItems = [
      TestDataFactory.createMenuItem({
        itemName: { vi: 'Phở Bò Đặc Biệt', en: 'Special Beef Pho' },
        category: 'Phở',
        price: 85000,
      }),
      TestDataFactory.createMenuItem({
        itemName: { vi: 'Bún Bò Huế', en: 'Hue Beef Noodle Soup' },
        category: 'Bún',
        price: 70000,
      }),
      TestDataFactory.createMenuItem({
        itemName: { vi: 'Chè Ba Màu', en: 'Three Color Dessert' },
        category: 'Tráng Miệng',
        price: 25000,
      }),
    ];

    return Promise.all(
      menuItems.map((item) => this.database.collection('menu_items').insertOne(item)),
    );
  }

  async cleanAll(): Promise<void> {
    const collections = ['users', 'orders', 'menu_items', 'payments'];
    await Promise.all(
      collections.map((collection) => this.database.collection(collection).deleteMany({})),
    );
  }
}
```

These testing patterns ensure comprehensive, reliable, and maintainable tests across the Signals monorepo, supporting both development velocity and code quality.
