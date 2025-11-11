/**
 * Cryptographic utilities for privacy-preserving hashing
 * Uses HMAC-SHA-256 for session ID anonymization
 */

/**
 * Hash a session ID using HMAC-SHA-256 with a salt
 * 
 * @param input - The input string to hash (e.g., session ID, user identifier)
 * @param salt - The salt to use for HMAC (should be a secret value)
 * @returns Promise resolving to hex-encoded hash (lowercase)
 * 
 * @example
 * const hashed = await hashSessionId('user-session-123', 'my-secret-salt');
 * // Returns: "a1b2c3d4e5f6..." (64 hex characters)
 */
export async function hashSessionId(input: string, salt: string): Promise<string> {
  // Browser environment - use Web Crypto API
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      // Import the salt as an HMAC key
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(salt),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      // Sign the input with the key
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(input)
      );

      // Convert to hex string (lowercase)
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return hashHex;
    } catch (error) {
      console.error('[Crypto] Web Crypto API error:', error);
      throw new Error('Failed to hash session ID using Web Crypto API');
    }
  }

  // Node.js environment - use crypto module
  // This is primarily for tests running in Node.js
  if (typeof require !== 'undefined') {
    try {
      // Dynamic import for Node.js crypto
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', salt);
      hmac.update(input);
      return hmac.digest('hex');
    } catch (error) {
      console.error('[Crypto] Node crypto error:', error);
      throw new Error('Failed to hash session ID using Node crypto');
    }
  }

  throw new Error('No crypto implementation available (neither Web Crypto nor Node crypto)');
}

/**
 * Verify that two hashes match (constant-time comparison to prevent timing attacks)
 * 
 * @param hash1 - First hash to compare
 * @param hash2 - Second hash to compare
 * @returns true if hashes match, false otherwise
 */
export function verifyHash(hash1: string, hash2: string): boolean {
  if (hash1.length !== hash2.length) {
    return false;
  }

  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < hash1.length; i++) {
    result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
  }

  return result === 0;
}
