// Tests for telemetry privacy controls
// Verifies TELEMETRY_ENABLED, TELEMETRY_SAMPLE_RATE, TELEMETRY_RESPECT_DNT, and ANON_ID_SALT

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Telemetry Privacy Controls', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('TELEMETRY_ENABLED Flag', () => {
    it('should not collect telemetry when TELEMETRY_ENABLED is false', async () => {
      // Set environment variable
      vi.stubEnv('TELEMETRY_ENABLED', 'false');
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      expect(shouldCollectTelemetry()).toBe(false);
      
      vi.unstubAllEnvs();
    });

    it('should collect telemetry when TELEMETRY_ENABLED is true', async () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'true');
      vi.stubEnv('TELEMETRY_SAMPLE_RATE', '1.0');
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'false');
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      expect(shouldCollectTelemetry()).toBe(true);
      
      vi.unstubAllEnvs();
    });

    it('should default to enabled when flag is not set', async () => {
      vi.stubEnv('TELEMETRY_SAMPLE_RATE', '1.0');
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'false');
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      // Default should be enabled
      expect(shouldCollectTelemetry()).toBe(true);
      
      vi.unstubAllEnvs();
    });
  });

  describe('TELEMETRY_SAMPLE_RATE', () => {
    it('should respect 0% sample rate (no collection)', async () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'true');
      vi.stubEnv('TELEMETRY_SAMPLE_RATE', '0.0');
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'false');
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      // With 0% sample rate, should never collect
      expect(shouldCollectTelemetry()).toBe(false);
      
      vi.unstubAllEnvs();
    });

    it('should respect 100% sample rate (full collection)', async () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'true');
      vi.stubEnv('TELEMETRY_SAMPLE_RATE', '1.0');
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'false');
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      // With 100% sample rate, should always collect
      expect(shouldCollectTelemetry()).toBe(true);
      
      vi.unstubAllEnvs();
    });

    it('should default to 100% when not set', async () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'true');
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'false');
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      // Default should be 100%
      expect(shouldCollectTelemetry()).toBe(true);
      
      vi.unstubAllEnvs();
    });
  });

  describe('TELEMETRY_RESPECT_DNT (Do Not Track)', () => {
    it('should respect DNT when enabled and DNT header is set', async () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'true');
      vi.stubEnv('TELEMETRY_SAMPLE_RATE', '1.0');
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'true');
      
      // Mock navigator.doNotTrack
      Object.defineProperty(navigator, 'doNotTrack', {
        writable: true,
        value: '1',
      });
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      expect(shouldCollectTelemetry()).toBe(false);
      
      vi.unstubAllEnvs();
    });

    it('should collect when DNT is not set', async () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'true');
      vi.stubEnv('TELEMETRY_SAMPLE_RATE', '1.0');
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'true');
      
      // Mock navigator.doNotTrack as undefined
      Object.defineProperty(navigator, 'doNotTrack', {
        writable: true,
        value: undefined,
      });
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      expect(shouldCollectTelemetry()).toBe(true);
      
      vi.unstubAllEnvs();
    });

    it('should ignore DNT when TELEMETRY_RESPECT_DNT is false', async () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'true');
      vi.stubEnv('TELEMETRY_SAMPLE_RATE', '1.0');
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'false');
      
      // Mock navigator.doNotTrack
      Object.defineProperty(navigator, 'doNotTrack', {
        writable: true,
        value: '1',
      });
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      // Should still collect because we're not respecting DNT
      expect(shouldCollectTelemetry()).toBe(true);
      
      vi.unstubAllEnvs();
    });

    it('should handle "yes" value for DNT', async () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'true');
      vi.stubEnv('TELEMETRY_SAMPLE_RATE', '1.0');
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'true');
      
      // Mock navigator.doNotTrack with 'yes' value
      Object.defineProperty(navigator, 'doNotTrack', {
        writable: true,
        value: 'yes',
      });
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      expect(shouldCollectTelemetry()).toBe(false);
      
      vi.unstubAllEnvs();
    });
  });

  describe('ANON_ID_SALT - ID Hashing', () => {
    it('should hash IDs with provided salt', async () => {
      vi.stubEnv('ANON_ID_SALT', 'test-salt-123');
      
      const { hashWithSalt } = await import('../src/lib/telemetry');
      
      const originalId = 'user-12345';
      const hashedId = hashWithSalt(originalId, 'test-salt-123');
      
      // Hash should not equal original
      expect(hashedId).not.toBe(originalId);
      
      // Hash should be consistent
      const hashedId2 = hashWithSalt(originalId, 'test-salt-123');
      expect(hashedId).toBe(hashedId2);
      
      vi.unstubAllEnvs();
    });

    it('should produce different hashes with different salts', async () => {
      const { hashWithSalt } = await import('../src/lib/telemetry');
      
      const originalId = 'user-12345';
      const hash1 = hashWithSalt(originalId, 'salt-1');
      const hash2 = hashWithSalt(originalId, 'salt-2');
      
      // Different salts should produce different hashes
      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for different IDs with same salt', async () => {
      const { hashWithSalt } = await import('../src/lib/telemetry');
      
      const salt = 'same-salt';
      const hash1 = hashWithSalt('user-1', salt);
      const hash2 = hashWithSalt('user-2', salt);
      
      // Different IDs should produce different hashes
      expect(hash1).not.toBe(hash2);
    });

    it('should use default salt if not configured', async () => {
      const { getTelemetryConfig } = await import('../src/lib/telemetry');
      
      const config = getTelemetryConfig();
      
      // hasCustomSalt should be false when using default
      expect(config.hasCustomSalt).toBe(false);
    });

    it('should detect custom salt when configured', async () => {
      vi.stubEnv('ANON_ID_SALT', 'my-custom-production-salt');
      
      const { getTelemetryConfig } = await import('../src/lib/telemetry');
      
      const config = getTelemetryConfig();
      
      // hasCustomSalt should be true when custom salt is set
      expect(config.hasCustomSalt).toBe(true);
      
      vi.unstubAllEnvs();
    });
  });

  describe('Combined Privacy Controls', () => {
    it('should not collect when TELEMETRY_ENABLED is false, regardless of other settings', async () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'false');
      vi.stubEnv('TELEMETRY_SAMPLE_RATE', '1.0');
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'false');
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      expect(shouldCollectTelemetry()).toBe(false);
      
      vi.unstubAllEnvs();
    });

    it('should respect the strictest privacy setting', async () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'true');
      vi.stubEnv('TELEMETRY_SAMPLE_RATE', '0.0'); // 0% sample rate
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'true');
      
      Object.defineProperty(navigator, 'doNotTrack', {
        writable: true,
        value: undefined, // DNT not set
      });
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      // Should not collect due to 0% sample rate
      expect(shouldCollectTelemetry()).toBe(false);
      
      vi.unstubAllEnvs();
    });

    it('should collect when all privacy settings allow it', async () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'true');
      vi.stubEnv('TELEMETRY_SAMPLE_RATE', '1.0');
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'true');
      
      Object.defineProperty(navigator, 'doNotTrack', {
        writable: true,
        value: undefined, // DNT not set
      });
      
      const { shouldCollectTelemetry } = await import('../src/lib/telemetry');
      
      // All settings allow collection
      expect(shouldCollectTelemetry()).toBe(true);
      
      vi.unstubAllEnvs();
    });
  });

  describe('Configuration Export', () => {
    it('should expose telemetry configuration for verification', async () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'true');
      vi.stubEnv('TELEMETRY_SAMPLE_RATE', '0.5');
      vi.stubEnv('TELEMETRY_RESPECT_DNT', 'true');
      vi.stubEnv('ANON_ID_SALT', 'test-salt');
      
      const { getTelemetryConfig } = await import('../src/lib/telemetry');
      
      const config = getTelemetryConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.sampleRate).toBe(0.5);
      expect(config.respectDNT).toBe(true);
      expect(config.hasCustomSalt).toBe(true);
      
      vi.unstubAllEnvs();
    });
  });
});
