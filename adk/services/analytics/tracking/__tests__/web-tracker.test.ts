import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { WebAnalyticsTracker, EventCategory } from '../web-tracker';

// Mock BigQuery client
jest.mock('@google-cloud/bigquery', () => {
  return {
    BigQuery: jest.fn().mockImplementation(() => {
      return {
        dataset: jest.fn().mockReturnValue({
          table: jest.fn().mockReturnValue({
            insert: jest.fn().mockResolvedValue([{}])
          })
        })
      };
    })
  };
});

describe('WebAnalyticsTracker', () => {
  let tracker: WebAnalyticsTracker;
  const mockConfig = {
    projectId: 'test-project',
    datasetId: 'analytics',
    tableId: 'events'
  };

  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
    tracker = new WebAnalyticsTracker(mockConfig);
  });

  it('should be defined', () => {
    expect(tracker).toBeDefined();
  });

  it('should initialize with config values', () => {
    expect(tracker['config'].projectId).toBe('test-project');
    expect(tracker['config'].datasetId).toBe('analytics');
    expect(tracker['config'].tableId).toBe('events');
  });

  it('should track an event', async () => {
    const mockEvent = {
      category: EventCategory.USER,
      action: 'click',
      label: 'submit_button',
      value: 1
    };

    // Get access to the mocked insert method
    const bigQueryInstance = require('@google-cloud/bigquery').BigQuery;
    const mockInsert = bigQueryInstance().dataset().table().insert;

    await tracker.trackEvent(mockEvent);

    // Verify the insert method was called
    expect(mockInsert).toHaveBeenCalledTimes(1);
    
    // Verify the event data was passed correctly
    const insertedData = mockInsert.mock.calls[0][0];
    expect(insertedData[0].category).toBe(EventCategory.USER);
    expect(insertedData[0].action).toBe('click');
    expect(insertedData[0].label).toBe('submit_button');
    expect(insertedData[0].value).toBe(1);
    expect(insertedData[0].platform).toBe('web');
    expect(insertedData[0].timestamp).toBeDefined();
  });

  it('should handle errors when tracking events', async () => {
    // Override the mock to throw an error
    const bigQueryInstance = require('@google-cloud/bigquery').BigQuery;
    bigQueryInstance.mockImplementationOnce(() => {
      return {
        dataset: jest.fn().mockReturnValue({
          table: jest.fn().mockReturnValue({
            insert: jest.fn().mockRejectedValue(new Error('Insert Error'))
          })
        })
      };
    });

    tracker = new WebAnalyticsTracker(mockConfig);

    const mockEvent = {
      category: EventCategory.USER,
      action: 'click',
      label: 'submit_button',
      value: 1
    };

    // Expect the error to be caught
    await expect(tracker.trackEvent(mockEvent)).rejects.toThrow('Insert Error');
  });

  it('should batch track multiple events', async () => {
    const mockEvents = [
      {
        category: EventCategory.USER,
        action: 'click',
        label: 'button_1',
        value: 1
      },
      {
        category: EventCategory.SYSTEM,
        action: 'load',
        label: 'page',
        value: 0
      }
    ];

    // Get access to the mocked insert method
    const bigQueryInstance = require('@google-cloud/bigquery').BigQuery;
    const mockInsert = bigQueryInstance().dataset().table().insert;

    await tracker.batchTrackEvents(mockEvents);

    // Verify the insert method was called once with multiple events
    expect(mockInsert).toHaveBeenCalledTimes(1);
    
    // Verify the event data was passed correctly
    const insertedData = mockInsert.mock.calls[0][0];
    expect(insertedData.length).toBe(2);
    expect(insertedData[0].category).toBe(EventCategory.USER);
    expect(insertedData[1].category).toBe(EventCategory.SYSTEM);
  });
});
