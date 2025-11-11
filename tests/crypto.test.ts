/**
 * Tests for crypto.ts - HMAC-SHA-256 hashing
 * Verifies determinism, salt sensitivity, Unicode handling, and security properties
 */

import { describe, it, expect } from 'vitest';
import { hashSessionId, verifyHash } from '../src/lib/crypto';

describe('Crypto Module', () => {
  describe('hashSessionId', () => {
    it('should produce deterministic hashes for the same input and salt', async () => {
      const input = 'test-session-123';
      const salt = 'my-secret-salt';

      const hash1 = await hashSessionId(input, salt);
      const hash2 = await hashSessionId(input, salt);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/); // 64 hex chars (32 bytes)
    });

    it('should produce different hashes for different salts', async () => {
      const input = 'test-session-123';
      const salt1 = 'salt-one';
      const salt2 = 'salt-two';

      const hash1 = await hashSessionId(input, salt1);
      const hash2 = await hashSessionId(input, salt2);

      expect(hash1).not.toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
      expect(hash2).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce different hashes for different inputs', async () => {
      const input1 = 'session-abc';
      const input2 = 'session-xyz';
      const salt = 'my-salt';

      const hash1 = await hashSessionId(input1, salt);
      const hash2 = await hashSessionId(input2, salt);

      expect(hash1).not.toBe(hash2);
    });

    it('should differ from plaintext input', async () => {
      const input = 'my-session-id';
      const salt = 'my-salt';

      const hash = await hashSessionId(input, salt);

      expect(hash).not.toBe(input);
      expect(hash).not.toContain(input);
      expect(hash.length).toBe(64); // SHA-256 produces 32 bytes = 64 hex chars
    });

    it('should handle empty input', async () => {
      const hash = await hashSessionId('', 'salt');
      
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash.length).toBe(64);
    });

    it('should reject empty salt (security requirement)', async () => {
      // Empty salts are insecure - HMAC requires a non-empty key
      await expect(hashSessionId('input', '')).rejects.toThrow();
    });

    it('should handle Unicode characters in input', async () => {
      const unicodeInputs = [
        'café-session-☕',
        '用户会话-123',
        'сессия-пользователя',
        '🔐-secure-session-🔒',
        'Ñoño-señor-session',
      ];

      const salt = 'unicode-salt';

      for (const input of unicodeInputs) {
        const hash = await hashSessionId(input, salt);
        
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
        expect(hash.length).toBe(64);
      }
    });

    it('should handle Unicode characters in salt', async () => {
      const input = 'test-session';
      const unicodeSalts = [
        'café-salt-☕',
        '盐-salt',
        'соль',
        '🧂-salt-seasoning',
      ];

      for (const salt of unicodeSalts) {
        const hash = await hashSessionId(input, salt);
        
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
        expect(hash.length).toBe(64);
      }
    });

    it('should produce consistent hashes for very long inputs', async () => {
      const longInput = 'a'.repeat(10000);
      const salt = 'test-salt';

      const hash1 = await hashSessionId(longInput, salt);
      const hash2 = await hashSessionId(longInput, salt);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce different hashes for inputs that differ by one character', async () => {
      const salt = 'test-salt';
      const input1 = 'session-id-123';
      const input2 = 'session-id-124'; // Last char different

      const hash1 = await hashSessionId(input1, salt);
      const hash2 = await hashSessionId(input2, salt);

      expect(hash1).not.toBe(hash2);
      // Avalanche effect: even 1 bit change should affect ~50% of output bits
      const differentChars = countDifferentChars(hash1, hash2);
      expect(differentChars).toBeGreaterThan(20); // At least 20 out of 64 chars different
    });

    it('should return lowercase hex only', async () => {
      const hash = await hashSessionId('test', 'salt');
      
      expect(hash).toMatch(/^[0-9a-f]+$/);
      expect(hash).toBe(hash.toLowerCase());
      expect(hash).not.toMatch(/[A-F]/); // No uppercase hex
    });

    it('should be sensitive to salt order (salt as key, not concatenation)', async () => {
      // HMAC(key=salt, message=input) should differ from HMAC(key=input, message=salt)
      const input = 'my-input';
      const salt = 'my-salt';

      const hash1 = await hashSessionId(input, salt);
      const hash2 = await hashSessionId(salt, input); // Swapped

      expect(hash1).not.toBe(hash2);
    });

    it('should handle special characters and whitespace', async () => {
      const specialInputs = [
        'session with spaces',
        'session\twith\ttabs',
        'session\nwith\nnewlines',
        'session!@#$%^&*()_+-=[]{}|;:",.<>?',
        'session\\with\\backslashes',
        'session/with/slashes',
      ];

      const salt = 'special-salt';

      for (const input of specialInputs) {
        const hash = await hashSessionId(input, salt);
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
      }
    });
  });

  describe('verifyHash', () => {
    it('should return true for identical hashes', () => {
      const hash = 'a1b2c3d4e5f6';
      expect(verifyHash(hash, hash)).toBe(true);
    });

    it('should return false for different hashes', () => {
      const hash1 = 'a1b2c3d4e5f6';
      const hash2 = 'f6e5d4c3b2a1';
      expect(verifyHash(hash1, hash2)).toBe(false);
    });

    it('should return false for hashes of different lengths', () => {
      const hash1 = 'a1b2c3';
      const hash2 = 'a1b2c3d4';
      expect(verifyHash(hash1, hash2)).toBe(false);
    });

    it('should perform constant-time comparison', () => {
      // While we can't directly test timing, we can verify behavior is consistent
      const hash = 'a'.repeat(64);
      const different = 'b'.repeat(64);
      
      expect(verifyHash(hash, hash)).toBe(true);
      expect(verifyHash(hash, different)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(verifyHash('', '')).toBe(true);
      expect(verifyHash('', 'a')).toBe(false);
      expect(verifyHash('a', '')).toBe(false);
    });

    it('should be case-sensitive', () => {
      const hash1 = 'abcdef';
      const hash2 = 'ABCDEF';
      expect(verifyHash(hash1, hash2)).toBe(false);
    });
  });

  describe('Security Properties', () => {
    it('should not be reversible (one-way function)', async () => {
      const input = 'secret-session-id';
      const salt = 'my-salt';
      
      const hash = await hashSessionId(input, salt);
      
      // Hash should not contain input substring
      expect(hash).not.toContain(input);
      expect(hash).not.toContain('secret');
      expect(hash).not.toContain('session');
    });

    it('should produce uniformly distributed output', async () => {
      // Generate multiple hashes and check hex character distribution
      const salt = 'test-salt';
      const hashes = await Promise.all(
        Array.from({ length: 100 }, (_, i) => hashSessionId(`session-${i}`, salt))
      );

      // Count occurrences of each hex character across all hashes
      const charCounts: Record<string, number> = {};
      const hexChars = '0123456789abcdef';
      
      for (const char of hexChars) {
        charCounts[char] = 0;
      }

      for (const hash of hashes) {
        for (const char of hash) {
          charCounts[char]++;
        }
      }

      // With 100 hashes of 64 chars each = 6400 chars total
      // Expected: 6400/16 = 400 per character
      // Allow 25% deviation (300-500 range)
      for (const char of hexChars) {
        expect(charCounts[char]).toBeGreaterThan(300);
        expect(charCounts[char]).toBeLessThan(500);
      }
    });

    it('should produce different hashes even for similar salts', async () => {
      const input = 'session-123';
      const salts = ['salt1', 'salt2', 'salt3', 'salt4', 'salt5'];
      
      const hashes = await Promise.all(
        salts.map(salt => hashSessionId(input, salt))
      );

      // All hashes should be unique
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(salts.length);
    });

    it('should maintain determinism across multiple invocations', async () => {
      const input = 'test-session';
      const salt = 'test-salt';
      
      const hashes = await Promise.all(
        Array.from({ length: 10 }, () => hashSessionId(input, salt))
      );

      // All should be identical
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(1);
    });
  });
});

/**
 * Helper: Count how many character positions differ between two strings
 */
function countDifferentChars(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  let count = 0;
  
  for (let i = 0; i < maxLen; i++) {
    if (str1[i] !== str2[i]) {
      count++;
    }
  }
  
  return count;
}
