/**
 * Merkle Chain Client with Feature Flags and Retry Logic
 * 
 * This module provides a thin adapter layer for Merkle chain logging with:
 * - Feature flags to enable/disable logging
 * - Backend mode switching (mock vs live)
 * - Retry logic with exponential backoff and jitter
 * - Structured error logging
 */

import { logSignalSubmission as dbLogSignalSubmission } from './integrity/merkleChainDB';

// Environment configuration with defaults
const MERKLE_LOGGING_ENABLED = import.meta.env.VITE_MERKLE_LOGGING_ENABLED !== 'false';
const BACKEND_MODE = import.meta.env.VITE_BACKEND_MODE || 'mock';

// Retry configuration
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 5000;

export interface MerkleClientConfig {
  enabled?: boolean;
  mode?: 'mock' | 'live';
  maxRetries?: number;
  baseDelayMs?: number;
}

export interface MerkleSubmissionResult {
  success: boolean;
  eventId?: string;
  error?: string;
  retriable?: boolean;
  attemptCount?: number;
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(attempt: number, baseDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine if an error is retriable
 */
function isRetriableError(error: any): boolean {
  // Network errors are usually retriable
  if (error?.message?.includes('network') || 
      error?.message?.includes('timeout') ||
      error?.message?.includes('ECONNREFUSED')) {
    return true;
  }
  
  // Database connection errors are retriable
  if (error?.code === 'PGRST301' || // PostgreSQL connection error
      error?.code === 'ECONNRESET') {
    return true;
  }
  
  // Rate limit errors might be retriable with backoff
  if (error?.code === '429' || error?.message?.includes('rate limit')) {
    return true;
  }
  
  return false;
}

/**
 * Mock implementation for testing
 */
async function mockLogSignalSubmission(
  signalId: string,
  district: string,
  tenure: string,
  satisfaction: number,
  exhaustion: number
): Promise<MerkleSubmissionResult> {
  // Simulate processing delay
  await sleep(10);
  
  console.log('[MOCK] Merkle chain event logged:', {
    signalId,
    district,
    tenure,
    satisfaction,
    exhaustion,
    mode: 'mock'
  });
  
  return {
    success: true,
    eventId: `mock-${signalId}`,
  };
}

/**
 * Log a signal submission to the Merkle chain with retry logic
 * 
 * @param signalId - Unique signal identifier
 * @param district - School district
 * @param tenure - Teacher tenure bracket
 * @param satisfaction - Job satisfaction score (0-10)
 * @param exhaustion - Work exhaustion score (0-10)
 * @param config - Optional configuration override
 * @returns Result object with success status and metadata
 */
export async function logSignalSubmission(
  signalId: string,
  district: string,
  tenure: string,
  satisfaction: number,
  exhaustion: number,
  config?: MerkleClientConfig
): Promise<MerkleSubmissionResult> {
  const enabled = config?.enabled ?? MERKLE_LOGGING_ENABLED;
  const mode = config?.mode ?? BACKEND_MODE;
  const maxRetries = config?.maxRetries ?? MAX_RETRIES;
  const baseDelay = config?.baseDelayMs ?? BASE_DELAY_MS;
  
  // If logging is disabled, return early
  if (!enabled) {
    console.log('[Merkle] Logging disabled by feature flag');
    return {
      success: true,
      eventId: `disabled-${signalId}`,
    };
  }
  
  // If in mock mode, use mock implementation
  if (mode === 'mock') {
    return mockLogSignalSubmission(signalId, district, tenure, satisfaction, exhaustion);
  }
  
  // Live mode with retry logic
  let lastError: any;
  let attemptCount = 0;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attemptCount = attempt + 1;
    
    try {
      const result = await dbLogSignalSubmission(
        signalId,
        district,
        tenure,
        satisfaction,
        exhaustion
      );
      
      if (result) {
        console.log('[Merkle] Event logged successfully:', {
          eventId: result.eventId,
          attempt: attemptCount,
        });
        
        return {
          success: true,
          eventId: result.eventId,
          attemptCount,
        };
      } else {
        // Result is null, which might indicate a terminal error
        throw new Error('Merkle chain returned null - database error');
      }
    } catch (error) {
      lastError = error;
      
      // Log the error with structure
      console.error('[Merkle] Attempt failed:', {
        signalId,
        attempt: attemptCount,
        maxRetries,
        error: error instanceof Error ? error.message : String(error),
        retriable: isRetriableError(error),
      });
      
      // If this is not the last attempt and error is retriable, retry with backoff
      if (attempt < maxRetries && isRetriableError(error)) {
        const delay = calculateBackoffDelay(attempt, baseDelay);
        console.log(`[Merkle] Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      
      // Otherwise, break out of retry loop
      break;
    }
  }
  
  // All retries exhausted or terminal error encountered
  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  
  console.error('[Merkle] Failed after all retries:', {
    signalId,
    attempts: attemptCount,
    error: errorMessage,
  });
  
  return {
    success: false,
    error: errorMessage,
    retriable: isRetriableError(lastError),
    attemptCount,
  };
}

/**
 * Check if Merkle logging is enabled
 */
export function isMerkleLoggingEnabled(): boolean {
  return MERKLE_LOGGING_ENABLED;
}

/**
 * Get current backend mode
 */
export function getBackendMode(): 'mock' | 'live' {
  return BACKEND_MODE as 'mock' | 'live';
}

/**
 * Export for testing purposes
 */
export const __test__ = {
  calculateBackoffDelay,
  isRetriableError,
  mockLogSignalSubmission,
};
