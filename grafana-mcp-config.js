export default {
  grafana: {
    baseUrl: process.env.GRAFANA_URL || 'https://grafana-service-871192566066.us-central1.run.app',
    username: process.env.GRAFANA_USERNAME || 'admin',
    password: process.env.GRAFANA_PASSWORD || 'admin123',
    apiToken: process.env.GRAFANA_API_TOKEN,
  },
  server: {
    port: 3001,
    host: 'localhost',
  },
  cache: {
    enabled: true,
    ttl: 3600000, // 1 hour
  },
  logging: {
    level: 'info',
    format: 'json',
  },
};
