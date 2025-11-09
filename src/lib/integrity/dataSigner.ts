/**
 * Ed25519 Digital Signing for Data Integrity
 * Signs district aggregates nightly to ensure tamper-evidence
 * Uses tweetnacl for Ed25519 signature algorithm
 */

import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export interface DataSignature {
  signature: string;
  publicKey: string;
  timestamp: string;
  dataHash: string;
  algorithm: 'Ed25519';
}

export interface SignedAggregate {
  district: string;
  date: string;
  nSignals: number;
  avgCCI: number;
  ciLower: number;
  ciUpper: number;
  signature: DataSignature;
}

export class DataSigner {
  private keyPair: nacl.SignKeyPair;
  private publicKeyString: string;
  private secretKeyString: string;

  constructor() {
    // Generate Ed25519 key pair
    this.keyPair = nacl.sign.keyPair();
    
    // Convert to base64 strings for storage/transmission
    this.publicKeyString = util.encodeBase64(this.keyPair.publicKey);
    this.secretKeyString = util.encodeBase64(this.keyPair.secretKey);
  }

  /**
   * Get the public key (can be shared publicly)
   */
  getPublicKey(): string {
    return this.publicKeyString;
  }

  /**
   * Get the key pair (keep secret key secure!)
   */
  getKeyPair(): KeyPair {
    return {
      publicKey: this.publicKeyString,
      secretKey: this.secretKeyString
    };
  }

  /**
   * Sign data with Ed25519
   * @param data - Data to sign (will be JSON serialized)
   * @returns Signature object with all verification info
   */
  signData(data: any): DataSignature {
    // Create canonical JSON representation
    const dataString = this.canonicalStringify(data);
    const dataHash = this.hashData(dataString);
    
    // Sign the data hash
    const message = util.decodeUTF8(dataHash);
    const signatureBytes = nacl.sign.detached(message, this.keyPair.secretKey);
    const signatureString = util.encodeBase64(signatureBytes);

    return {
      signature: signatureString,
      publicKey: this.publicKeyString,
      timestamp: new Date().toISOString(),
      dataHash,
      algorithm: 'Ed25519'
    };
  }

  /**
   * Sign district aggregate data
   * Convenience method for common use case
   */
  signAggregate(
    district: string,
    date: string,
    nSignals: number,
    avgCCI: number,
    ciLower: number,
    ciUpper: number
  ): SignedAggregate {
    const aggregateData = {
      district,
      date,
      nSignals,
      avgCCI,
      ciLower,
      ciUpper,
      version: '1.0'
    };

    const signature = this.signData(aggregateData);

    return {
      ...aggregateData,
      signature
    };
  }

  /**
   * Verify a signature
   * @param data - Original signed data
   * @param signature - Signature object to verify
   * @returns true if signature is valid
   */
  static verifySignature(data: any, signature: DataSignature): boolean {
    try {
      // Recreate data hash
      const dataString = this.canonicalStringify(data);
      const expectedHash = this.hashData(dataString);
      
      // Check data hash matches
      if (expectedHash !== signature.dataHash) {
        console.error('Data hash mismatch');
        return false;
      }

      // Decode signature and public key
      const signatureBytes = util.decodeBase64(signature.signature);
      const publicKeyBytes = util.decodeBase64(signature.publicKey);
      const messageBytes = util.decodeUTF8(signature.dataHash);

      // Verify Ed25519 signature
      return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Verify a signed aggregate
   * Convenience method for common use case
   */
  static verifySignedAggregate(signedAggregate: SignedAggregate): boolean {
    const { signature, ...data } = signedAggregate;
    return this.verifySignature(data, signature);
  }

  /**
   * Export public key for sharing
   */
  exportPublicKey(): {
    publicKey: string;
    algorithm: string;
    exportedAt: string;
  } {
    return {
      publicKey: this.publicKeyString,
      algorithm: 'Ed25519',
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import existing key pair
   * Useful for loading previously generated keys
   */
  static importKeyPair(keyPair: KeyPair): DataSigner {
    const signer = new DataSigner();
    
    // Decode base64 keys
    const publicKeyBytes = util.decodeBase64(keyPair.publicKey);
    const secretKeyBytes = util.decodeBase64(keyPair.secretKey);
    
    // Verify key lengths
    if (publicKeyBytes.length !== 32) {
      throw new Error('Invalid public key length. Expected 32 bytes.');
    }
    if (secretKeyBytes.length !== 64) {
      throw new Error('Invalid secret key length. Expected 64 bytes.');
    }
    
    // Create key pair from bytes
    signer.keyPair = {
      publicKey: publicKeyBytes,
      secretKey: secretKeyBytes
    };
    
    signer.publicKeyString = keyPair.publicKey;
    signer.secretKeyString = keyPair.secretKey;
    
    return signer;
  }

  /**
   * Create canonical JSON string (sorted keys)
   * Ensures consistent hashing across different systems
   */
  private static canonicalStringify(obj: any): string {
    if (obj === null) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.canonicalStringify(item)).join(',') + ']';
    }
    
    const sortedKeys = Object.keys(obj).sort();
    const pairs = sortedKeys.map(key => 
      `"${key}":${this.canonicalStringify(obj[key])}`
    );
    
    return '{' + pairs.join(',') + '}';
  }

  /**
   * Create SHA256 hash of data
   */
  private static hashData(dataString: string): string {
    const hash = createHash('sha256');
    hash.update(dataString);
    return hash.digest('hex');
  }
}

/**
 * Global data signer instance
 * Use this singleton for the entire application
 */
export const globalDataSigner = new DataSigner();

/**
 * Nightly signing job
 * Signs all district aggregates for the day
 */
export async function performNightlySigning(
  districtAggregates: Array<{
    district: string;
    date: string;
    nSignals: number;
    avgCCI: number;
    ciLower: number;
    ciUpper: number;
  }>
): Promise<{
  signedAggregates: SignedAggregate[];
  timestamp: string;
  publicKey: string;
}> {
  const signer = globalDataSigner;
  const signedAggregates: SignedAggregate[] = [];

  for (const aggregate of districtAggregates) {
    const signed = signer.signAggregate(
      aggregate.district,
      aggregate.date,
      aggregate.nSignals,
      aggregate.avgCCI,
      aggregate.ciLower,
      aggregate.ciUpper
    );
    signedAggregates.push(signed);
  }

  return {
    signedAggregates,
    timestamp: new Date().toISOString(),
    publicKey: signer.getPublicKey()
  };
}

/**
 * Verify all signatures in a batch
 * Useful for auditing
 */
export function verifyAllSignatures(signedAggregates: SignedAggregate[]): {
  allValid: boolean;
  invalidSignatures: Array<{ district: string; date: string; error: string }>;
  validCount: number;
  totalCount: number;
} {
  const invalidSignatures: Array<{ district: string; date: string; error: string }> = [];
  let validCount = 0;

  for (const signed of signedAggregates) {
    try {
      if (DataSigner.verifySignedAggregate(signed)) {
        validCount++;
      } else {
        invalidSignatures.push({
          district: signed.district,
          date: signed.date,
          error: 'Signature verification failed'
        });
      }
    } catch (error) {
      invalidSignatures.push({
        district: signed.district,
        date: signed.date,
        error: error instanceof Error ? error.message : 'Unknown verification error'
      });
    }
  }

  return {
    allValid: invalidSignatures.length === 0,
    invalidSignatures,
    validCount,
    totalCount: signedAggregates.length
  };
}

// Example usage
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('DataSigner', () => {
    it('should sign and verify data correctly', () => {
      const signer = new DataSigner();
      const data = { district: 'test', nSignals: 100, avgCCI: 50.5 };
      
      const signature = signer.signData(data);
      expect(signature.algorithm).toBe('Ed25519');
      expect(signature.publicKey).toBe(signer.getPublicKey());
      
      const isValid = DataSigner.verifySignature(data, signature);
      expect(isValid).toBe(true);
    });

    it('should detect tampered data', () => {
      const signer = new DataSigner();
      const originalData = { district: 'test', nSignals: 100, avgCCI: 50.5 };
      
      const signature = signer.signData(originalData);
      
      // Tamper with data
      const tamperedData = { ...originalData, avgCCI: 60.0 };
      
      const isValid = DataSigner.verifySignature(tamperedData, signature);
      expect(isValid).toBe(false);
    });

    it('should sign aggregates correctly', () => {
      const signer = new DataSigner();
      
      const signed = signer.signAggregate(
        'Edmonton Public',
        '2025-11-08',
        150,
        47.6,
        45.2,
        50.1
      );
      
      expect(signed.district).toBe('Edmonton Public');
      expect(signed.signature.algorithm).toBe('Ed25519');
      
      const isValid = DataSigner.verifySignedAggregate(signed);
      expect(isValid).toBe(true);
    });
  });
}