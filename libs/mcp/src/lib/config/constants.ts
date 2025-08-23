// Timeout constants
export const SHORT_TIMEOUT = 5000;
export const LONG_TIMEOUT = 30000;

// Health check constants
export const DEV_HEALTH_CHECK = {
  path: '/api/health',
  expectedStatus: 200,
  expectedResponse: { status: 'ok' }
};

export const CORE_HEALTH_CHECK = {
  path: '/api/health',
  expectedStatus: 200,
  expectedResponse: { status: 'ok' }
};

export const WEB_API_HEALTH_CHECK = {
  path: '/api/v1/health',
  expectedStatus: 200,
  expectedResponse: { status: 'ok' }
};

export const TESTING_HEALTH_CHECK = {
  path: '/api/test/health',
  expectedStatus: 200,
  expectedResponse: { status: 'ok' }
};

export const DATA_HEALTH_CHECK = {
  path: '/api/data/health',
  expectedStatus: 200,
  expectedResponse: { status: 'ok' }
};

export const PLATFORM_HEALTH_CHECK = {
  path: '/api/platform/health',
  expectedStatus: 200,
  expectedResponse: { status: 'ok' }
};

export const SPECIALIZED_HEALTH_CHECK = {
  path: '/api/specialized/health',
  expectedStatus: 200,
  expectedResponse: { status: 'ok' }
};

export const AUTOMATION_HEALTH_CHECK = {
  path: '/api/automation/health',
  expectedStatus: 200,
  expectedResponse: { status: 'ok' }
};
