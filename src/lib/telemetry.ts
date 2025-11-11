// Telemetry collection and transmission
// Buffers Web Vitals and error reports, flushes on pagehide/visibilitychange
// Implements privacy scrubbing, retries with jitter, and circuit breaking
// Respects privacy flags: VITE_TELEMETRY_ENABLED, VITE_TELEMETRY_SAMPLE_RATE, VITE_TELEMETRY_RESPECT_DNT

import type { WebVitalReport } from './webVitals';
import { hashSessionId } from './crypto';
import { getTelemetryConsent } from '../components/TelemetryConsentBanner';

// Privacy Configuration - ALL env vars must use VITE_ prefix for client access
const TELEMETRY_ENABLED = import.meta.env.VITE_TELEMETRY_ENABLED === 'true'; // Default: false (opt-in)
const TELEMETRY_SAMPLE_RATE = parseFloat(import.meta.env.VITE_TELEMETRY_SAMPLE_RATE || '1.0'); // Default: 100%
const TELEMETRY_RESPECT_DNT = import.meta.env.VITE_TELEMETRY_RESPECT_DNT !== 'false'; // Default: true
const ANON_ID_SALT = import.meta.env.VITE_ANON_ID_SALT || 'default-salt-change-in-production';

// Dev-time warning for missing env vars
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  const missingVars = [];
  if (import.meta.env.VITE_TELEMETRY_ENABLED === undefined) missingVars.push('VITE_TELEMETRY_ENABLED');
  if (import.meta.env.VITE_TELEMETRY_SAMPLE_RATE === undefined) missingVars.push('VITE_TELEMETRY_SAMPLE_RATE');
  if (import.meta.env.VITE_TELEMETRY_RESPECT_DNT === undefined) missingVars.push('VITE_TELEMETRY_RESPECT_DNT');
  if (import.meta.env.VITE_ANON_ID_SALT === undefined) missingVars.push('VITE_ANON_ID_SALT');
  
  if (missingVars.length > 0) {
    console.warn(
      '[Telemetry] Missing environment variables (check .env.local):',
      missingVars.join(', ')
    );
  }
}

// Endpoint Configuration
const TELEMETRY_ENDPOINT = import.meta.env.VITE_TELEMETRY_ENDPOINT || '/api/telemetry';
const ERROR_ENDPOINT = import.meta.env.VITE_ERROR_ENDPOINT || '/api/errors';
const MAX_BUFFER_SIZE = 50;
const FLUSH_INTERVAL_MS = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const CIRCUIT_BREAK_THRESHOLD = 5;
const CIRCUIT_BREAK_RESET_MS = 60000;

// Types
export interface TelemetryEvent {
  session_id: string;
  ts: number;
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  url: string;
  device: string;
  app_version: string;
}

export interface ErrorReport {
  session_id: string;
  ts: number;
  message: string;
  stack_hash: string;
  stack?: string;
  app_version: string;
  url: string;
  device: string;
  context?: Record<string, unknown>;
}

// Circuit breaker state
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private isOpen = false;

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= CIRCUIT_BREAK_THRESHOLD) {
      this.isOpen = true;
      console.warn('[Telemetry] Circuit breaker opened due to repeated failures');
    }
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.isOpen = false;
  }

  shouldAllow(): boolean {
    if (!this.isOpen) return true;
    
    // Check if we should reset the circuit breaker
    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    if (timeSinceLastFailure > CIRCUIT_BREAK_RESET_MS) {
      console.log('[Telemetry] Circuit breaker reset after cooldown');
      this.isOpen = false;
      this.failureCount = 0;
      return true;
    }
    
    return false;
  }
}

// Privacy scrubber for URLs
function scrubUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove query params and hash
    urlObj.search = '';
    urlObj.hash = '';
    
    // Truncate path to max 3 segments
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 3) {
      urlObj.pathname = '/' + pathSegments.slice(0, 3).join('/') + '/...';
    }
    
    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, return a generic placeholder
    return window.location.origin + '/...';
  }
}

// Check if telemetry should be collected based on privacy settings
function shouldCollectTelemetry(): boolean {
  // Check if telemetry is globally disabled
  if (!TELEMETRY_ENABLED) {
    return false;
  }

  // Check user consent (must be explicitly granted)
  const consent = getTelemetryConsent();
  if (consent !== 'granted') {
    return false;
  }

  // Check Do Not Track (DNT) header if respect DNT is enabled
  if (TELEMETRY_RESPECT_DNT && typeof navigator !== 'undefined') {
    const dnt = (navigator as any).doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
    if (dnt === '1' || dnt === 'yes') {
      return false;
    }
  }

  // Check sampling rate
  if (TELEMETRY_SAMPLE_RATE <= 0) {
    // 0% sample rate means no collection
    return false;
  }
  
  if (TELEMETRY_SAMPLE_RATE < 1.0) {
    // Use a consistent hash-based value per session for sampling
    // This ensures user either is always sampled or never sampled during their session
    const sessionId = getOrCreateSessionId();
    const hashValue = simpleHash(sessionId);
    // Convert base-36 hash to a number between 0 and 1
    const hashNum = parseInt(hashValue, 36);
    const normalized = (hashNum % 1000000) / 1000000; // Normalize to 0-1 range
    
    if (normalized > TELEMETRY_SAMPLE_RATE) {
      return false;
    }
  }

  return true;
}

// Simple hash for legacy compatibility (sampling only, not for anonymization)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Get or create a session ID (used for sampling consistency)
function getOrCreateSessionId(): string {
  if (typeof sessionStorage === 'undefined') return 'ssr-session';
  
  let sessionId = sessionStorage.getItem('telemetry_session_id');
  if (!sessionId) {
    // Use crypto.getRandomValues for secure random generation
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomBytes = crypto.getRandomValues(new Uint8Array(16));
      sessionId = `${Date.now()}-${Array.from(randomBytes).map(b => b.toString(36)).join('')}`;
    } else {
      // Fallback for environments without crypto (should be rare)
      sessionId = `${Date.now()}-fallback`;
    }
    sessionStorage.setItem('telemetry_session_id', sessionId);
  }
  return sessionId;
}

// Main telemetry service
class TelemetryService {
  private vitalBuffer: TelemetryEvent[] = [];
  private errorBuffer: ErrorReport[] = [];
  private sessionId: string;
  private flushTimer: number | null = null;
  private circuitBreaker = new CircuitBreaker();
  private errorDedupeMap = new Map<string, number>();

  constructor() {
    // Use async initialization for HMAC hashing
    this.initializeSessionId();
    this.setupFlushHandlers();
  }

  private async initializeSessionId(): Promise<void> {
    // Generate base session ID and hash it with HMAC-SHA-256 for anonymization
    const baseSessionId = this.generateBaseSessionId();
    try {
      this.sessionId = await hashSessionId(baseSessionId, ANON_ID_SALT);
    } catch (error) {
      console.error('[Telemetry] Failed to hash session ID, using fallback:', error);
      // Fallback: use simple hash if HMAC fails
      this.sessionId = simpleHash(`${baseSessionId}:${ANON_ID_SALT}`);
    }
  }

  private generateBaseSessionId(): string {
    // Use crypto.randomUUID for secure random session ID
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers - still better than Math.random alone
    return `${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(36))
      .join('')}`;
  }

  private setupFlushHandlers(): void {
    // Flush on page hide
    window.addEventListener('pagehide', () => this.flush(true));
    
    // Flush on visibility change (when page becomes hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(true);
      }
    });

    // Periodic flush
    this.startFlushTimer();
  }

  private startFlushTimer(): void {
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = window.setInterval(() => {
      this.flush(false);
    }, FLUSH_INTERVAL_MS);
  }

  // Send vitals data
  async sendVitals(vital: WebVitalReport): Promise<void> {
    // Check privacy settings before collecting
    if (!shouldCollectTelemetry()) {
      return;
    }

    const event: TelemetryEvent = {
      session_id: this.sessionId,
      ts: vital.timestamp,
      metric: vital.name,
      value: vital.value,
      rating: vital.rating,
      url: scrubUrl(vital.url),
      device: this.getDeviceInfo(),
      app_version: this.getAppVersion(),
    };

    this.vitalBuffer.push(event);

    // Flush if buffer is full
    if (this.vitalBuffer.length >= MAX_BUFFER_SIZE) {
      await this.flush(false);
    }
  }

  // Send error report
  async sendError(
    error: Error,
    context?: Record<string, unknown>
  ): Promise<void> {
    // Check privacy settings before collecting
    if (!shouldCollectTelemetry()) {
      return;
    }

    // Use HMAC-SHA-256 for stack hash (privacy-preserving)
    let stackHash: string;
    try {
      stackHash = await hashSessionId(error.stack || error.message, ANON_ID_SALT);
    } catch (hashError) {
      // Fallback to simple hash if HMAC fails
      stackHash = simpleHash(error.stack || error.message);
    }
    
    const dedupeKey = `${error.message}-${stackHash}-${this.getAppVersion()}`;
    
    // Check for duplicate within 1 hour
    const now = Date.now();
    const lastSeen = this.errorDedupeMap.get(dedupeKey);
    if (lastSeen && (now - lastSeen) < 3600000) {
      console.log('[Telemetry] Duplicate error suppressed:', error.message);
      return;
    }

    // Record this error
    this.errorDedupeMap.set(dedupeKey, now);
    
    // Clean up old entries (older than 1 hour)
    for (const [key, timestamp] of this.errorDedupeMap.entries()) {
      if (now - timestamp > 3600000) {
        this.errorDedupeMap.delete(key);
      }
    }

    const report: ErrorReport = {
      session_id: this.sessionId,
      ts: now,
      message: error.message,
      stack_hash: stackHash,
      stack: this.sanitizeStack(error.stack),
      app_version: this.getAppVersion(),
      url: scrubUrl(window.location.href),
      device: this.getDeviceInfo(),
      context: this.sanitizeContext(context),
    };

    this.errorBuffer.push(report);

    // Flush if buffer is full
    if (this.errorBuffer.length >= MAX_BUFFER_SIZE) {
      await this.flush(false);
    }
  }

  private sanitizeStack(stack?: string): string | undefined {
    if (!stack) return undefined;
    
    // Remove file paths, keep only function names and line numbers
    return stack
      .split('\n')
      .map(line => {
        // Remove full paths, keep only filename:line:col
        return line.replace(/https?:\/\/[^)]+\/([^/:]+:\d+:\d+)/, '$1');
      })
      .join('\n')
      .substring(0, 1000); // Truncate to 1000 chars
  }

  private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined;
    
    // Remove any potential PII from context
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
      // Skip keys that might contain PII
      if (['email', 'phone', 'name', 'address', 'token', 'password'].some(pii => 
        key.toLowerCase().includes(pii)
      )) {
        continue;
      }
      sanitized[key] = value;
    }
    return sanitized;
  }

  private getDeviceInfo(): string {
    // Return basic device info without PII
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && 
                     window.innerWidth > 768;
    
    if (isTablet) return 'tablet';
    if (isMobile) return 'mobile';
    return 'desktop';
  }

  private getAppVersion(): string {
    return import.meta.env.VITE_APP_VERSION || 
           document.querySelector('meta[name="version"]')?.getAttribute('content') || 
           '0.0.0';
  }

  // Flush buffers to backend
  async flush(useSendBeacon: boolean): Promise<void> {
    if (!this.circuitBreaker.shouldAllow()) {
      console.warn('[Telemetry] Circuit breaker is open, dropping events');
      this.vitalBuffer = [];
      this.errorBuffer = [];
      return;
    }

    // Flush vitals
    if (this.vitalBuffer.length > 0) {
      await this.flushVitals(useSendBeacon);
    }

    // Flush errors
    if (this.errorBuffer.length > 0) {
      await this.flushErrors(useSendBeacon);
    }
  }

  private async flushVitals(useSendBeacon: boolean): Promise<void> {
    const events = [...this.vitalBuffer];
    this.vitalBuffer = [];

    try {
      await this.sendWithRetry(TELEMETRY_ENDPOINT, events, useSendBeacon);
      this.circuitBreaker.recordSuccess();
    } catch (error) {
      console.error('[Telemetry] Failed to send vitals:', error);
      this.circuitBreaker.recordFailure();
      // Events are lost, but we don't want to accumulate indefinitely
    }
  }

  private async flushErrors(useSendBeacon: boolean): Promise<void> {
    const errors = [...this.errorBuffer];
    this.errorBuffer = [];

    try {
      await this.sendWithRetry(ERROR_ENDPOINT, errors, useSendBeacon);
      this.circuitBreaker.recordSuccess();
    } catch (error) {
      console.error('[Telemetry] Failed to send errors:', error);
      this.circuitBreaker.recordFailure();
      // Errors are lost, but we don't want to accumulate indefinitely
    }
  }

  private async sendWithRetry(
    endpoint: string,
    data: unknown[],
    useSendBeacon: boolean,
    attempt = 0
  ): Promise<void> {
    if (useSendBeacon && navigator.sendBeacon) {
      // Use sendBeacon for reliability during page unload
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const success = navigator.sendBeacon(endpoint, blob);
      if (!success) {
        console.warn('[Telemetry] sendBeacon failed (likely due to browser constraints, not network error). Telemetry data dropped.');
        return;
      }
      return;
    }

    // Use fetch for regular flushes
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        // Exponential backoff with jitter
        const backoff = Math.min(
          INITIAL_BACKOFF_MS * Math.pow(2, attempt),
          MAX_BACKOFF_MS
        );
        const jitter = Math.random() * backoff * 0.1;
        const delay = backoff + jitter;

        console.log(`[Telemetry] Retry ${attempt + 1}/${MAX_RETRIES} after ${delay.toFixed(0)}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(endpoint, data, false, attempt + 1);
      }
      
      throw error;
    }
  }

  // Manual flush for testing
  async forceFlush(): Promise<void> {
    await this.flush(false);
  }

  // Get buffer stats for debugging
  getBufferStats(): { vitals: number; errors: number } {
    return {
      vitals: this.vitalBuffer.length,
      errors: this.errorBuffer.length,
    };
  }
}

// Singleton instance - only initialize in browser environment
export const telemetryService = typeof window !== 'undefined' ? new TelemetryService() : null;

// Export convenience functions with SSR safety checks
export const sendVitals = (vital: WebVitalReport) => 
  telemetryService ? telemetryService.sendVitals(vital) : Promise.resolve();
export const sendError = (error: Error, context?: Record<string, unknown>) => 
  telemetryService ? telemetryService.sendError(error, context) : Promise.resolve();
export const flushTelemetry = () => 
  telemetryService ? telemetryService.forceFlush() : Promise.resolve();

// Export privacy check function for testing
export { shouldCollectTelemetry };

// Export telemetry status for diagnostics and testing
export interface TelemetryStatus {
  enabled: boolean;
  consent: 'granted' | 'denied' | null;
  dntRespected: boolean;
  dntActive: boolean;
  sampleRate: number;
  isCollecting: boolean;
}

/**
 * Get the current telemetry status for diagnostics and testing
 * Returns all relevant flags that determine whether telemetry is active
 */
export function getTelemetryStatus(): TelemetryStatus {
  const consent = getTelemetryConsent();
  
  let dntActive = false;
  if (typeof navigator !== 'undefined') {
    const dnt = (navigator as any).doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
    dntActive = dnt === '1' || dnt === 'yes';
  }

  return {
    enabled: TELEMETRY_ENABLED,
    consent,
    dntRespected: TELEMETRY_RESPECT_DNT,
    dntActive,
    sampleRate: TELEMETRY_SAMPLE_RATE,
    isCollecting: shouldCollectTelemetry(),
  };
}

// Export configuration for testing (legacy compatibility)
export const getTelemetryConfig = () => ({
  enabled: TELEMETRY_ENABLED,
  sampleRate: TELEMETRY_SAMPLE_RATE,
  respectDNT: TELEMETRY_RESPECT_DNT,
  hasCustomSalt: ANON_ID_SALT !== 'default-salt-change-in-production',
});
