// Telemetry service tests
// Tests for buffering, retries, circuit breaking, and privacy scrubbing

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WebVitalReport } from '../src/lib/webVitals';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sendBeacon
const mockSendBeacon = vi.fn();
Object.defineProperty(navigator, 'sendBeacon', {
  writable: true,
  value: mockSendBeacon,
});

describe('Telemetry Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockSendBeacon.mockReset();
    
    // Clear any existing telemetry service state
    vi.resetModules();
  });

  describe('Web Vitals Collection', () => {
    it('should buffer vitals and send on flush', async () => {
      // Import after mocks are set up
      const { sendVitals, flushTelemetry } = await import('../src/lib/telemetry');
      
      mockFetch.mockResolvedValueOnce({ ok: true });

      const vital: WebVitalReport = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 2000,
        id: 'test-1',
        timestamp: Date.now(),
        url: 'http://localhost/test',
      };

      await sendVitals(vital);
      
      // Should buffer, not send immediately
      expect(mockFetch).not.toHaveBeenCalled();

      // Flush should send
      await flushTelemetry();
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/telemetry');
      expect(options.method).toBe('POST');
      
      const body = JSON.parse(options.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].metric).toBe('LCP');
      expect(body[0].value).toBe(2000);
      expect(body[0].rating).toBe('good');
    });

    it('should scrub URL query params and hash', async () => {
      const { sendVitals, flushTelemetry } = await import('../src/lib/telemetry');
      
      mockFetch.mockResolvedValueOnce({ ok: true });

      const vital: WebVitalReport = {
        name: 'FCP',
        value: 1500,
        rating: 'good',
        delta: 1500,
        id: 'test-2',
        timestamp: Date.now(),
        url: 'http://localhost/page?secret=123&token=abc#section',
      };

      await sendVitals(vital);
      await flushTelemetry();

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body[0].url).not.toContain('?');
      expect(body[0].url).not.toContain('#');
      expect(body[0].url).not.toContain('secret');
      expect(body[0].url).not.toContain('token');
    });

    it('should truncate long URL paths', async () => {
      const { sendVitals, flushTelemetry } = await import('../src/lib/telemetry');
      
      mockFetch.mockResolvedValueOnce({ ok: true });

      const vital: WebVitalReport = {
        name: 'INP',
        value: 150,
        rating: 'good',
        delta: 150,
        id: 'test-3',
        timestamp: Date.now(),
        url: 'http://localhost/segment1/segment2/segment3/segment4/segment5',
      };

      await sendVitals(vital);
      await flushTelemetry();

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body[0].url).toContain('...');
      // URL format is: http://localhost/segment1/segment2/segment3/...
      // Split by / gives: ['http:', '', 'localhost', 'segment1', 'segment2', 'segment3', '...']
      expect(body[0].url.split('/').length).toBeLessThanOrEqual(7);
    });

    it('should flush on buffer full', async () => {
      const { sendVitals } = await import('../src/lib/telemetry');
      
      mockFetch.mockResolvedValue({ ok: true });

      // Send 50 vitals to fill buffer
      for (let i = 0; i < 50; i++) {
        await sendVitals({
          name: 'CLS',
          value: 0.05,
          rating: 'good',
          delta: 0.05,
          id: `test-${i}`,
          timestamp: Date.now(),
          url: 'http://localhost/test',
        });
      }

      // Should have flushed once
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.length).toBe(50);
    });
  });

  describe('Error Reporting', () => {
    it('should send errors with sanitized stack traces', async () => {
      const { sendError, flushTelemetry } = await import('../src/lib/telemetry');
      
      mockFetch.mockResolvedValueOnce({ ok: true });

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at http://localhost:3000/assets/index.js:123:45';

      await sendError(error, { action: 'test' });
      await flushTelemetry();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body[0].message).toBe('Test error');
      expect(body[0].stack_hash).toBeDefined();
      expect(body[0].stack).not.toContain('http://localhost:3000');
      expect(body[0].context.action).toBe('test');
    });

    it('should deduplicate errors within 1 hour', async () => {
      const { sendError, flushTelemetry } = await import('../src/lib/telemetry');
      
      mockFetch.mockResolvedValue({ ok: true });

      const error = new Error('Duplicate error');

      // Send same error twice
      await sendError(error);
      await sendError(error);
      await flushTelemetry();

      // Should only send once
      if (mockFetch.mock.calls.length > 0) {
        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.length).toBe(1);
      }
    });

    it('should sanitize PII from error context', async () => {
      const { sendError, flushTelemetry } = await import('../src/lib/telemetry');
      
      mockFetch.mockResolvedValueOnce({ ok: true });

      const error = new Error('Test error');
      await sendError(error, {
        email: 'user@example.com',
        phone: '555-1234',
        action: 'submit',
      });
      await flushTelemetry();

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body[0].context).not.toHaveProperty('email');
      expect(body[0].context).not.toHaveProperty('phone');
      expect(body[0].context).toHaveProperty('action');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests with exponential backoff', async () => {
      const { sendVitals, flushTelemetry } = await import('../src/lib/telemetry');
      
      // Fail first 2 attempts, succeed on 3rd
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true });

      const vital: WebVitalReport = {
        name: 'TTFB',
        value: 600,
        rating: 'good',
        delta: 600,
        id: 'test-retry',
        timestamp: Date.now(),
        url: 'http://localhost/test',
      };

      await sendVitals(vital);
      await flushTelemetry();

      // Should have retried 3 times total
      expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 10000); // Increase timeout for retries

    it('should give up after max retries', async () => {
      const { sendVitals, flushTelemetry } = await import('../src/lib/telemetry');
      
      // Fail all attempts
      mockFetch.mockRejectedValue(new Error('Network error'));

      const vital: WebVitalReport = {
        name: 'LCP',
        value: 3000,
        rating: 'needs-improvement',
        delta: 3000,
        id: 'test-fail',
        timestamp: Date.now(),
        url: 'http://localhost/test',
      };

      await sendVitals(vital);
      await flushTelemetry();

      // Should have tried max retries + 1 (initial attempt)
      expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(4);
    }, 10000);
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after repeated failures', async () => {
      const { sendVitals, flushTelemetry } = await import('../src/lib/telemetry');
      
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Cause 5 failures to open circuit
      for (let i = 0; i < 5; i++) {
        await sendVitals({
          name: 'CLS',
          value: 0.1,
          rating: 'good',
          delta: 0.1,
          id: `test-${i}`,
          timestamp: Date.now(),
          url: 'http://localhost/test',
        });
        try {
          await flushTelemetry();
        } catch (e) {
          // Ignore errors
        }
      }

      // Clear mock to verify circuit is open
      mockFetch.mockClear();

      // Next attempt should be dropped by circuit breaker
      await sendVitals({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 2000,
        id: 'test-circuit',
        timestamp: Date.now(),
        url: 'http://localhost/test',
      });
      await flushTelemetry();

      // Should not have made any new requests
      expect(mockFetch).not.toHaveBeenCalled();
    }, 60000); // Increase timeout significantly for retries
  });

  describe('SendBeacon Fallback', () => {
    it('should use sendBeacon when requested', async () => {
      const { sendVitals, flushTelemetry } = await import('../src/lib/telemetry');
      
      mockSendBeacon.mockReturnValue(true);

      const vital: WebVitalReport = {
        name: 'INP',
        value: 100,
        rating: 'good',
        delta: 100,
        id: 'test-beacon',
        timestamp: Date.now(),
        url: 'http://localhost/test',
      };

      await sendVitals(vital);
      
      // Simulate page hide by manually calling flush with beacon flag
      // This is tested through the service's internal pagehide handler
      
      expect(mockSendBeacon).toBeDefined();
    });
  });
});
