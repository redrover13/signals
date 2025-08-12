import { BetaAnalyticsDataClient } from '@google-analytics/data';

export interface GA4QueryOptions {
  propertyId: string;
  dimensions: string[];
  metrics: string[];
  dateRanges: { startDate: string; endDate: string }[];
}

export async function fetchGA4Data({ propertyId, dimensions, metrics, dateRanges }: GA4QueryOptions) {
  const client = new BetaAnalyticsDataClient();
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dimensions: dimensions.map(name => ({ name })),
    metrics: metrics.map(name => ({ name })),
    dateRanges,
  });
  return response;
}
