import { jest } from '@jest/globals';

describe('Monitoring', () => {
  let monitoring;
  
  beforeEach(() => {
    // Reset mocks between tests
    jest.resetAllMocks();
    
    // Mock dependencies
    jest.mock('@opentelemetry/api', () => ({
      metrics: {
        getMeter: jest.fn().mockReturnValue({
          createCounter: jest.fn().mockReturnValue({
            add: jest.fn()
          }),
          createHistogram: jest.fn().mockReturnValue({
            record: jest.fn()
          })
        })
      },
      trace: {
        getTracer: jest.fn().mockReturnValue({
          startSpan: jest.fn().mockImplementation((name, options, fn) => {
            const span = {
              end: jest.fn(),
              setAttributes: jest.fn(),
              recordException: jest.fn()
            };
            return span;
          }),
          startActiveSpan: jest.fn().mockImplementation((name, options, fn) => {
            const span = {
              end: jest.fn(),
              setAttributes: jest.fn(),
              recordException: jest.fn()
            };
            return fn(span);
          })
        })
      },
      context: {
        active: jest.fn()
      }
    }));
    
    // Import the monitoring module after mocking dependencies
    const { Monitoring } = require('./monitoring');
    monitoring = new Monitoring({
      serviceName: 'test-service'
    });
  });
  
  it('should initialize correctly', () => {
    expect(monitoring).toBeDefined();
    expect(monitoring.serviceName).toBe('test-service');
  });
  
  it('should create metrics', () => {
    const counter = monitoring.createCounter('test_counter', 'A test counter');
    const histogram = monitoring.createHistogram('test_histogram', 'A test histogram');
    
    expect(counter).toBeDefined();
    expect(histogram).toBeDefined();
    
    // Record metrics
    counter.add(1, { operation: 'test' });
    histogram.record(100, { operation: 'test' });
  });
  
  it('should create spans', () => {
    const span = monitoring.startSpan('test-operation');
    
    expect(span).toBeDefined();
    expect(typeof span.end).toBe('function');
    
    // End the span
    span.end();
  });
  
  it('should wrap functions with tracing', () => {
    const testFn = jest.fn().mockReturnValue('result');
    const tracedFn = monitoring.traceFunction('test-function', testFn);
    
    const result = tracedFn('arg1', 'arg2');
    
    expect(testFn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(result).toBe('result');
  });
  
  it('should handle errors in traced functions', async () => {
    const errorFn = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    
    const tracedFn = monitoring.traceFunction('error-function', errorFn);
    
    await expect(() => tracedFn())
      .rejects.toThrow('Test error');
  });
  
  it('should instrument functions correctly', async () => {
    const testFn = jest.fn().mockResolvedValue('result');
    const instrumentedFn = monitoring.instrumentFunction({
      name: 'test-function',
      fn: testFn,
      metrics: {
        histogram: monitoring.createHistogram('test_duration', 'Function duration')
      }
    });
    
    const result = await instrumentedFn('arg1');
    
    expect(testFn).toHaveBeenCalledWith('arg1');
    expect(result).toBe('result');
  });
});
