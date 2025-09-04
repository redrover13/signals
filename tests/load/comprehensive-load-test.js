import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://example.com';

export const options = {
  scenarios: {
    // Smoke test - single user
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
    },

    // Load test - average expected load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 }, // Ramp up
        { duration: '5m', target: 10 }, // Stay at load
        { duration: '2m', target: 0 }, // Ramp down
      ],
      tags: { test_type: 'load' },
    },

    // Stress test - above normal conditions
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 }, // Normal load
        { duration: '5m', target: 20 }, // Stress load
        { duration: '3m', target: 30 }, // Peak stress
        { duration: '2m', target: 0 }, // Ramp down
      ],
      tags: { test_type: 'stress' },
    },

    // Spike test - sudden traffic surge
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 }, // Normal load
        { duration: '30s', target: 50 }, // Spike!
        { duration: '3m', target: 10 }, // Back to normal
        { duration: '1m', target: 0 }, // Ramp down
      ],
      tags: { test_type: 'spike' },
    },
  },

  thresholds: {
    // Overall HTTP request duration thresholds
    http_req_duration: [
      'p(50)<200', // 50% of requests under 200ms
      'p(95)<500', // 95% of requests under 500ms
      'p(99)<1000', // 99% of requests under 1s
    ],

    // HTTP request failure rate
    http_req_failed: ['rate<0.05'], // Less than 5% failures

    // Custom error rate
    errors: ['rate<0.05'], // Less than 5% custom errors

    // API-specific response time
    api_response_time: [
      'p(95)<300', // 95% of API calls under 300ms
      'avg<150', // Average under 150ms
    ],

    // Scenario-specific thresholds
    'http_req_duration{test_type:smoke}': ['p(95)<100'],
    'http_req_duration{test_type:load}': ['p(95)<500'],
    'http_req_duration{test_type:stress}': ['p(95)<1000'],
    'http_req_duration{test_type:spike}': ['p(95)<2000'],
  },
};

// Test scenarios data
const endpoints = [
  { path: '/health', weight: 1 },
  { path: '/api/status', weight: 0.8 },
  { path: '/api/analytics/events', weight: 0.6 },
  { path: '/api/social/posts', weight: 0.4 },
  { path: '/api/crm/customers', weight: 0.3 },
  { path: '/api/reviews', weight: 0.5 },
];

// Helper function to select weighted endpoint
function selectEndpoint() {
  const random = Math.random();
  let cumulativeWeight = 0;

  for (const endpoint of endpoints) {
    cumulativeWeight += endpoint.weight;
    if (random <= cumulativeWeight / endpoints.length) {
      return endpoint.path;
    }
  }

  return endpoints[0].path; // Fallback
}

// Main test function
export default function () {
  const endpoint = selectEndpoint();
  const url = `${BASE_URL}${endpoint}`;

  // Add request headers
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-load-test/1.0',
      Accept: 'application/json',
    },
    timeout: '30s',
  };

  // Make HTTP request
  const response = http.get(url, params);

  // Record custom metric
  apiResponseTime.add(response.timings.duration);

  // Basic checks
  const checks = check(response, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'response has body': (r) => r.body && r.body.length > 0,
    'no server errors': (r) => r.status < 500,
  });

  // Advanced checks for specific endpoints
  if (endpoint === '/health') {
    const healthChecks = check(response, {
      'health status is 200': (r) => r.status === 200,
      'health response time < 100ms': (r) => r.timings.duration < 100,
      'health response contains status': (r) => r.body.includes('healthy') || r.body.includes('ok'),
    });
    errorRate.add(!healthChecks);
  } else if (endpoint.startsWith('/api/')) {
    const apiChecks = check(response, {
      'api response time < 500ms': (r) => r.timings.duration < 500,
      'api returns JSON or 404': (r) => {
        if (r.status === 404) return true;
        try {
          JSON.parse(r.body);
          return true;
        } catch (e) {
          return false;
        }
      },
    });
    errorRate.add(!apiChecks && response.status !== 404);
  }

  // Record overall errors
  errorRate.add(!checks);

  // Realistic user behavior - pause between requests
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// Setup function - runs once before all iterations
export function setup() {
  console.log(`🚀 Starting load test for: ${BASE_URL}`);
  console.log(`📊 Test scenarios: ${Object.keys(options.scenarios).join(', ')}`);

  // Warm-up request
  const warmupResponse = http.get(`${BASE_URL}/health`);

  if (warmupResponse.status !== 200 && warmupResponse.status !== 404) {
    console.warn(`⚠️ Warmup request failed with status: ${warmupResponse.status}`);
  } else {
    console.log(`✅ Warmup request successful`);
  }

  return { baseUrl: BASE_URL };
}

// Teardown function - runs once after all iterations
export function teardown(data) {
  console.log(`🏁 Load test completed for: ${data.baseUrl}`);
}

// Custom summary handler
export function handleSummary(data) {
  const summary = {
    testStarted: new Date(data.state.testRunDurationMs).toISOString(),
    testDuration: `${data.state.testRunDurationMs / 1000}s`,
    scenarios: {},
    metrics: {},
    checks: {},
  };

  // Extract scenario results
  for (const [scenarioName, scenarioData] of Object.entries(data.metrics)) {
    if (scenarioName.startsWith('iteration_duration{scenario:')) {
      const scenario = scenarioName.match(/scenario:([^}]+)/)[1];
      summary.scenarios[scenario] = {
        iterations: scenarioData.values.count,
        avgDuration: `${scenarioData.values.avg.toFixed(2)}ms`,
      };
    }
  }

  // Extract key metrics
  const keyMetrics = [
    'http_req_duration',
    'http_req_failed',
    'http_reqs',
    'vus',
    'vus_max',
    'errors',
    'api_response_time',
  ];

  for (const metric of keyMetrics) {
    if (data.metrics[metric]) {
      const metricData = data.metrics[metric];
      summary.metrics[metric] = {
        count: metricData.values.count || 0,
        avg: metricData.values.avg?.toFixed(2) || 0,
        min: metricData.values.min?.toFixed(2) || 0,
        max: metricData.values.max?.toFixed(2) || 0,
        p95: metricData.values['p(95)']?.toFixed(2) || 0,
        p99: metricData.values['p(99)']?.toFixed(2) || 0,
      };

      if (metricData.values.rate !== undefined) {
        summary.metrics[metric].rate = `${(metricData.values.rate * 100).toFixed(2)}%`;
      }
    }
  }

  // Extract check results
  for (const [checkName, checkData] of Object.entries(data.metrics)) {
    if (checkName.startsWith('checks{')) {
      const checkType = checkName.match(/checks\{([^}]+)\}/)[1];
      summary.checks[checkType] = {
        passes: checkData.values.passes,
        fails: checkData.values.fails,
        rate: `${(checkData.values.rate * 100).toFixed(2)}%`,
      };
    }
  }

  // Generate multiple output formats
  return {
    'load-test-results.json': JSON.stringify(summary, null, 2),
    'load-test-detailed.json': JSON.stringify(data, null, 2),
    stdout: `
📊 Load Test Summary
===================

🎯 Target: ${BASE_URL}
⏱️  Duration: ${summary.testDuration}
📈 Total Requests: ${summary.metrics.http_reqs?.count || 0}
❌ Failure Rate: ${summary.metrics.http_req_failed?.rate || '0%'}
⚡ Avg Response Time: ${summary.metrics.http_req_duration?.avg || 0}ms
🔥 95th Percentile: ${summary.metrics.http_req_duration?.p95 || 0}ms

🏃 Virtual Users: ${summary.metrics.vus_max?.max || 0} peak

${
  Object.keys(summary.scenarios).length > 0
    ? '📋 Scenarios:\n' +
      Object.entries(summary.scenarios)
        .map(([name, data]) => `  • ${name}: ${data.iterations} iterations`)
        .join('\n')
    : ''
}

${
  Object.keys(summary.checks).length > 0
    ? '✅ Checks:\n' +
      Object.entries(summary.checks)
        .map(([name, data]) => `  • ${name}: ${data.rate}`)
        .join('\n')
    : ''
}
    `,
  };
}
