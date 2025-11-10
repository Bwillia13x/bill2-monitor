// Web Vitals monitoring and reporting
// Tracks Core Web Vitals (CLS, FID, LCP) and other metrics (FCP, TTFB, INP)

import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric, ReportCallback } from 'web-vitals';

// Analytics endpoint for reporting (can be configured)
const ANALYTICS_ENDPOINT = '/api/analytics/vitals'; // Placeholder - would be configured

// Thresholds based on Google's Core Web Vitals recommendations
export const WEB_VITALS_THRESHOLDS = {
  // Core Web Vitals
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay (ms) - deprecated
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift (score)
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint (ms) - replaces FID
  
  // Other metrics
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint (ms)
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte (ms)
};

export type WebVitalMetricName = 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB' | 'FID';

export interface WebVitalReport {
  name: WebVitalMetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
  timestamp: number;
  url: string;
}

// Determine rating based on thresholds
function getRating(name: WebVitalMetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = WEB_VITALS_THRESHOLDS[name];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// Format metric for reporting
function formatMetric(metric: Metric): WebVitalReport {
  return {
    name: metric.name as WebVitalMetricName,
    value: metric.value,
    rating: getRating(metric.name as WebVitalMetricName, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
    url: window.location.href,
  };
}

// Console logger for development
function logToConsole(report: WebVitalReport) {
  const emoji = report.rating === 'good' ? '✅' : report.rating === 'needs-improvement' ? '⚠️' : '❌';
  console.log(
    `${emoji} Web Vital: ${report.name}`,
    `\n  Value: ${report.value.toFixed(2)}`,
    `\n  Rating: ${report.rating}`,
    `\n  URL: ${report.url}`
  );
}

// Send to analytics endpoint (stubbed for now)
async function sendToAnalytics(report: WebVitalReport) {
  if (process.env.NODE_ENV === 'development') {
    // In development, just log
    return;
  }
  
  try {
    // Use sendBeacon for reliability (doesn't block page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(report)], { type: 'application/json' });
      navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
    } else {
      // Fallback to fetch
      await fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true, // Keep request alive even if page is unloading
      });
    }
  } catch (error) {
    // Silent fail - don't break user experience for analytics
    console.error('Failed to send Web Vitals:', error);
  }
}

// Main report handler
const handleMetric: ReportCallback = (metric) => {
  const report = formatMetric(metric);
  
  // Always log in development
  if (process.env.NODE_ENV === 'development') {
    logToConsole(report);
  }
  
  // Send to analytics (if configured)
  sendToAnalytics(report);
  
  // Store in sessionStorage for debugging
  try {
    const key = `webvital_${report.name}`;
    sessionStorage.setItem(key, JSON.stringify(report));
  } catch (e) {
    // Ignore storage errors
  }
};

// Initialize Web Vitals monitoring
export function initWebVitals() {
  // Core Web Vitals
  onLCP(handleMetric); // Largest Contentful Paint
  onINP(handleMetric); // Interaction to Next Paint (replaces FID)
  onCLS(handleMetric); // Cumulative Layout Shift
  
  // Other metrics
  onFCP(handleMetric); // First Contentful Paint
  onTTFB(handleMetric); // Time to First Byte
  
  console.log('📊 Web Vitals monitoring initialized');
}

// Get stored vitals from sessionStorage (for debugging)
export function getStoredVitals(): Record<string, WebVitalReport> {
  const vitals: Record<string, WebVitalReport> = {};
  
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('webvital_')) {
        const value = sessionStorage.getItem(key);
        if (value) {
          const metricName = key.replace('webvital_', '');
          vitals[metricName] = JSON.parse(value);
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  return vitals;
}

// Check if any metrics are poor
export function hasPerformanceIssues(): boolean {
  const vitals = getStoredVitals();
  return Object.values(vitals).some(v => v.rating === 'poor');
}

// Get performance summary
export interface PerformanceSummary {
  coreWebVitals: {
    lcp?: WebVitalReport;
    inp?: WebVitalReport;
    cls?: WebVitalReport;
  };
  otherMetrics: {
    fcp?: WebVitalReport;
    ttfb?: WebVitalReport;
  };
  overallRating: 'good' | 'needs-improvement' | 'poor';
  issueCount: number;
}

export function getPerformanceSummary(): PerformanceSummary {
  const vitals = getStoredVitals();
  
  const summary: PerformanceSummary = {
    coreWebVitals: {
      lcp: vitals.LCP,
      inp: vitals.INP,
      cls: vitals.CLS,
    },
    otherMetrics: {
      fcp: vitals.FCP,
      ttfb: vitals.TTFB,
    },
    overallRating: 'good',
    issueCount: 0,
  };
  
  // Count issues
  const coreVitalsRatings = Object.values(summary.coreWebVitals)
    .filter(Boolean)
    .map(v => v!.rating);
  
  const poorCount = coreVitalsRatings.filter(r => r === 'poor').length;
  const needsImprovementCount = coreVitalsRatings.filter(r => r === 'needs-improvement').length;
  
  summary.issueCount = poorCount + needsImprovementCount;
  
  // Determine overall rating (worst of Core Web Vitals)
  if (poorCount > 0) {
    summary.overallRating = 'poor';
  } else if (needsImprovementCount > 0) {
    summary.overallRating = 'needs-improvement';
  }
  
  return summary;
}
