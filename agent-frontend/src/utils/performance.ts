/**
 * @fileoverview Performance monitoring utilities
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains utilities for monitoring and improving application performance.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { useEffect, useRef } from 'react';
import { isProduction } from './env-config';

/**
 * Measures the render time of a component
 * @param componentName - Name of the component to measure
 * @param threshold - Threshold in milliseconds to log a warning
 */
export const useRenderPerformance = (componentName: string, threshold = 16): void => {
  const renderStart = useRef<number>(0);
  
  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    
    if (renderTime > threshold) {
      console.warn(`[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render, which is above the threshold of ${threshold}ms.`);
    }
    
    // Log all render times in development
    if (!isProduction()) {
      console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }
    
    return () => {
      renderStart.current = performance.now();
    };
  });
  
  // Set the initial render start time
  if (renderStart.current === 0) {
    renderStart.current = performance.now();
  }
};

/**
 * Tracks and reports a user interaction
 * @param name - Name of the interaction
 * @param callback - Function to execute
 * @returns The interaction callback
 */
export const trackInteraction = <T extends (...args: any[]) => any>(
  name: string,
  callback: T
): T => {
  return ((...args) => {
    const start = performance.now();
    const result = callback(...args);
    
    // If the result is a promise, measure its completion time
    if (result instanceof Promise) {
      result.finally(() => {
        const end = performance.now();
        console.log(`[Performance] Interaction "${name}" took ${(end - start).toFixed(2)}ms to complete`);
      });
    } else {
      const end = performance.now();
      console.log(`[Performance] Interaction "${name}" took ${(end - start).toFixed(2)}ms to complete`);
    }
    
    return result;
  }) as T;
};

/**
 * Tracks a web vital metric
 * @param metric - The web vital metric
 */
export const reportWebVital = (metric: { name: string; value: number }): void => {
  // In production, send to analytics service
  if (isProduction()) {
    // sendToAnalyticsService(metric);
    console.log(`[WebVital] ${metric.name}: ${metric.value}`);
  } else {
    console.log(`[WebVital] ${metric.name}: ${metric.value}`);
  }
};
