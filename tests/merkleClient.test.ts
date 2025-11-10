// Unit tests for Merkle Client
import { describe, it, expect } from 'vitest';
import { 
  logSignalSubmission, 
  isMerkleLoggingEnabled, 
  getBackendMode,
  __test__ 
} from '../src/lib/merkleClient';

describe('Merkle Client', () => {
  describe('Feature Flags', () => {
    it('should check if logging is enabled', () => {
      const enabled = isMerkleLoggingEnabled();
      expect(typeof enabled).toBe('boolean');
    });

    it('should return backend mode', () => {
      const mode = getBackendMode();
      expect(['mock', 'live']).toContain(mode);
    });
  });

  describe('Mock Mode', () => {
    it('should log successfully in mock mode', async () => {
      const result = await logSignalSubmission(
        'test-signal-1',
        'Calgary',
        '0-5 years',
        7.5,
        3.0,
        { mode: 'mock', enabled: true }
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.eventId).toContain('mock');
    });

    it('should handle multiple submissions in mock mode', async () => {
      const results = await Promise.all([
        logSignalSubmission('signal-1', 'Calgary', '0-5', 8, 2, { mode: 'mock' }),
        logSignalSubmission('signal-2', 'Edmonton', '6-10', 6, 5, { mode: 'mock' }),
        logSignalSubmission('signal-3', 'Red Deer', '11-20', 7, 4, { mode: 'mock' }),
      ]);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.eventId).toBeDefined();
      });
    });
  });

  describe('Disabled Mode', () => {
    it('should return success when logging is disabled', async () => {
      const result = await logSignalSubmission(
        'test-signal-disabled',
        'Calgary',
        '0-5 years',
        7.5,
        3.0,
        { enabled: false }
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toContain('disabled');
    });
  });

  describe('Retry Logic', () => {
    it('should calculate backoff delay with jitter', () => {
      const delay0 = __test__.calculateBackoffDelay(0, 500);
      const delay1 = __test__.calculateBackoffDelay(1, 500);
      const delay2 = __test__.calculateBackoffDelay(2, 500);

      // Delay should increase exponentially
      expect(delay0).toBeGreaterThanOrEqual(500);
      expect(delay0).toBeLessThan(1000);
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(2000);
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThan(4000);
    });

    it('should cap delay at MAX_DELAY_MS', () => {
      const delay = __test__.calculateBackoffDelay(10, 500);
      expect(delay).toBeLessThanOrEqual(5000); // MAX_DELAY_MS
    });

    it('should identify retriable errors', () => {
      const networkError = new Error('network timeout');
      const connectionError = new Error('ECONNREFUSED');
      const rateLimitError = new Error('rate limit exceeded');
      const terminalError = new Error('invalid data');

      expect(__test__.isRetriableError(networkError)).toBe(true);
      expect(__test__.isRetriableError(connectionError)).toBe(true);
      expect(__test__.isRetriableError(rateLimitError)).toBe(true);
      expect(__test__.isRetriableError(terminalError)).toBe(false);
    });

    it('should identify non-retriable errors', () => {
      const authError = new Error('authentication failed');
      const validationError = new Error('invalid parameters');

      expect(__test__.isRetriableError(authError)).toBe(false);
      expect(__test__.isRetriableError(validationError)).toBe(false);
    });
  });

  describe('Success Path', () => {
    it('should handle valid CCI values', async () => {
      const testCases = [
        { satisfaction: 10, exhaustion: 0 },
        { satisfaction: 5, exhaustion: 5 },
        { satisfaction: 0, exhaustion: 10 },
        { satisfaction: 7.5, exhaustion: 3.2 },
      ];

      for (const testCase of testCases) {
        const result = await logSignalSubmission(
          `test-${Date.now()}`,
          'Calgary',
          '0-5 years',
          testCase.satisfaction,
          testCase.exhaustion,
          { mode: 'mock' }
        );

        expect(result.success).toBe(true);
      }
    });

    it('should handle different districts', async () => {
      const districts = ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge'];

      for (const district of districts) {
        const result = await logSignalSubmission(
          `test-${Date.now()}`,
          district,
          '0-5 years',
          7.5,
          3.0,
          { mode: 'mock' }
        );

        expect(result.success).toBe(true);
      }
    });

    it('should handle different tenure brackets', async () => {
      const tenures = ['0-5 years', '6-10 years', '11-20 years', '21+ years'];

      for (const tenure of tenures) {
        const result = await logSignalSubmission(
          `test-${Date.now()}`,
          'Calgary',
          tenure,
          7.5,
          3.0,
          { mode: 'mock' }
        );

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Configuration Override', () => {
    it('should allow runtime configuration override', async () => {
      const result = await logSignalSubmission(
        'test-override',
        'Calgary',
        '0-5 years',
        7.5,
        3.0,
        {
          enabled: true,
          mode: 'mock',
          maxRetries: 5,
          baseDelayMs: 100,
        }
      );

      expect(result.success).toBe(true);
    });

    it('should respect maxRetries override', async () => {
      // In mock mode, this always succeeds, but tests that config is accepted
      const result = await logSignalSubmission(
        'test-retries',
        'Calgary',
        '0-5 years',
        7.5,
        3.0,
        { mode: 'mock', maxRetries: 1 }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme CCI values', async () => {
      const extremeCases = [
        { satisfaction: 0, exhaustion: 0 },
        { satisfaction: 10, exhaustion: 10 },
        { satisfaction: 0, exhaustion: 10 },
        { satisfaction: 10, exhaustion: 0 },
      ];

      for (const testCase of extremeCases) {
        const result = await logSignalSubmission(
          `extreme-${Date.now()}`,
          'Calgary',
          '0-5 years',
          testCase.satisfaction,
          testCase.exhaustion,
          { mode: 'mock' }
        );

        expect(result.success).toBe(true);
      }
    });

    it('should handle empty district gracefully', async () => {
      const result = await logSignalSubmission(
        'test-empty-district',
        '',
        '0-5 years',
        7.5,
        3.0,
        { mode: 'mock' }
      );

      expect(result.success).toBe(true);
    });

    it('should generate unique event IDs', async () => {
      const results = await Promise.all([
        logSignalSubmission('sig-1', 'Calgary', '0-5', 7, 3, { mode: 'mock' }),
        logSignalSubmission('sig-2', 'Calgary', '0-5', 7, 3, { mode: 'mock' }),
        logSignalSubmission('sig-3', 'Calgary', '0-5', 7, 3, { mode: 'mock' }),
      ]);

      const eventIds = results.map(r => r.eventId);
      const uniqueIds = new Set(eventIds);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('Performance', () => {
    it('should complete mock submissions quickly', async () => {
      const startTime = Date.now();
      
      await Promise.all(
        Array(100).fill(null).map((_, i) =>
          logSignalSubmission(
            `perf-test-${i}`,
            'Calgary',
            '0-5 years',
            7.5,
            3.0,
            { mode: 'mock' }
          )
        )
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete 100 in under 5 seconds
    });

    it('should handle concurrent submissions', async () => {
      const concurrent = 50;
      const promises = Array(concurrent).fill(null).map((_, i) =>
        logSignalSubmission(
          `concurrent-${i}`,
          'Calgary',
          '0-5 years',
          7.5,
          3.0,
          { mode: 'mock' }
        )
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(concurrent);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', async () => {
      const result = await logSignalSubmission(
        'test-no-config',
        'Calgary',
        '0-5 years',
        7.5,
        3.0
        // No config provided - should use defaults
      );

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should provide structured error information on failure', async () => {
      // In mock mode failures don't occur, but we can test the structure
      const result = await logSignalSubmission(
        'test-structure',
        'Calgary',
        '0-5 years',
        7.5,
        3.0,
        { mode: 'mock' }
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('eventId');
      
      // Error fields should exist in failure cases
      if (!result.success) {
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('retriable');
        expect(result).toHaveProperty('attemptCount');
      }
    });
  });
});
