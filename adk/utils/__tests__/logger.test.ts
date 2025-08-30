import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Logger, LogLevel } from '../logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
    
    // Spy on console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
    
    // Create logger with INFO level
    logger = new Logger({
      minLevel: LogLevel.INFO,
      serviceName: 'TestService'
    });
  });

  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  it('should initialize with config values', () => {
    expect(logger['config'].minLevel).toBe(LogLevel.INFO);
    expect(logger['config'].serviceName).toBe('TestService');
  });

  it('should log at INFO level', () => {
    logger.info('Test info message');
    
    expect(console.info).toHaveBeenCalledTimes(1);
    const loggedMessage = console.info.mock.calls[0][0];
    expect(loggedMessage).toContain('TestService');
    expect(loggedMessage).toContain('INFO');
    expect(loggedMessage).toContain('Test info message');
  });

  it('should log at ERROR level', () => {
    logger.error('Test error message', { code: 500 });
    
    expect(console.error).toHaveBeenCalledTimes(1);
    const loggedMessage = console.error.mock.calls[0][0];
    expect(loggedMessage).toContain('TestService');
    expect(loggedMessage).toContain('ERROR');
    expect(loggedMessage).toContain('Test error message');
    expect(loggedMessage).toContain('code');
    expect(loggedMessage).toContain('500');
  });

  it('should log at WARN level', () => {
    logger.warn('Test warning message');
    
    expect(console.warn).toHaveBeenCalledTimes(1);
    const loggedMessage = console.warn.mock.calls[0][0];
    expect(loggedMessage).toContain('TestService');
    expect(loggedMessage).toContain('WARN');
    expect(loggedMessage).toContain('Test warning message');
  });

  it('should not log below minimum level', () => {
    // Create logger with WARN level
    logger = new Logger({
      minLevel: LogLevel.WARN,
      serviceName: 'TestService'
    });
    
    // This should not log anything
    logger.info('This should not be logged');
    logger.debug('This should not be logged either');
    
    expect(console.info).not.toHaveBeenCalled();
    expect(console.debug).not.toHaveBeenCalled();
    
    // These should log
    logger.warn('This should be logged');
    logger.error('This should be logged too');
    
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('should allow changing log level at runtime', () => {
    // Start with WARN level
    logger = new Logger({
      minLevel: LogLevel.WARN,
      serviceName: 'TestService'
    });
    
    // This should not log anything
    logger.info('This should not be logged');
    expect(console.info).not.toHaveBeenCalled();
    
    // Change log level to INFO
    logger.setLogLevel(LogLevel.INFO);
    
    // Now this should log
    logger.info('This should be logged now');
    expect(console.info).toHaveBeenCalledTimes(1);
  });

  it('should format metadata correctly', () => {
    const complexMetadata = {
      userId: 123,
      nested: {
        property: 'value',
        array: [1, 2, 3]
      },
      date: new Date('2023-01-01')
    };
    
    logger.info('Message with complex metadata', complexMetadata);
    
    expect(console.info).toHaveBeenCalledTimes(1);
    const loggedMessage = console.info.mock.calls[0][0];
    expect(loggedMessage).toContain('userId');
    expect(loggedMessage).toContain('123');
    expect(loggedMessage).toContain('nested');
    expect(loggedMessage).toContain('property');
    expect(loggedMessage).toContain('value');
    expect(loggedMessage).toContain('array');
    expect(loggedMessage).toContain('date');
  });
});
