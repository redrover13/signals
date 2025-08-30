/**
 * @fileoverview Analytics tracking module index
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Exports all analytics tracking modules for easy importing.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

// Export core types and interfaces
export * from './core-events';

// Export platform-specific trackers
export * from './web-tracker';
export * from './android-tracker';
export * from './ios-tracker';

// Export default tracker based on environment
import { WebAnalyticsTracker } from './web-tracker';
import { AndroidAnalyticsTracker } from './android-tracker';
import { IOSAnalyticsTracker } from './ios-tracker';
import { TrackerConfig } from './core-events';

/**
 * Create an analytics tracker based on the current platform
 * @param config Tracker configuration
 * @returns An appropriate analytics tracker instance
 */
export function createAnalyticsTracker(config: TrackerConfig) {
  // Determine platform
  const isBrowser = typeof window !== 'undefined';
  const isAndroid = isBrowser && /android/i.test(navigator.userAgent);
  const isIOS = isBrowser && /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Create appropriate tracker
  if (isAndroid) {
    return new AndroidAnalyticsTracker(config);
  } else if (isIOS) {
    return new IOSAnalyticsTracker(config);
  } else {
    return new WebAnalyticsTracker(config);
  }
}
