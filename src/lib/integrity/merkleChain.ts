/**
 * Merkle Chain Event Logging
 * Creates tamper-evident log of all signals using SHA256 hashing
 * Each event is hashed and linked to previous hash forming a chain
 */

import { createHash } from 'crypto';

export interface MerkleEvent {
  eventId: string;
  eventType: 'signal_submitted' | 'signal_validated' | 'aggregate_updated' | 'snapshot_created';
  timestamp: string;
  data: any;
  previousHash: string;
  currentHash: string;
}

export class MerkleChain {
  private chain: MerkleEvent[] = [];
  private currentRootHash: string = '';

  /**
   * Add a new event to the Merkle chain
   * @param eventType - Type of event
   * @param data - Event data (will be hashed)
   * @returns The complete MerkleEvent with hashes
   */
  addEvent(eventType: MerkleEvent['eventType'], data: any): MerkleEvent {
    // Create hash of current event data
    const eventDataHash = this.hashData({ eventType, timestamp: new Date().toISOString(), data });
    
    // Get previous hash (empty string for first event)
    const previousHash = this.currentRootHash;
    
    // Create current hash by combining previous hash and event data hash
    const currentHash = this.hashData({ previousHash, eventDataHash });
    
    // Create event object
    const event: MerkleEvent = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      data,
      previousHash,
      currentHash
    };
    
    // Add to chain
    this.chain.push(event);
    
    // Update root hash
    this.currentRootHash = currentHash;
    
    return event;
  }

  /**
   * Get the current root hash of the chain
   * This is the hash of the most recent event
   */
  getRootHash(): string {
    return this.currentRootHash;
  }

  /**
   * Get the entire chain
   */
  getChain(): MerkleEvent[] {
    return [...this.chain]; // Return copy to prevent mutation
  }

  /**
   * Get chain length
   */
  getLength(): number {
    return this.chain.length;
  }

  /**
   * Verify the integrity of the entire chain
   * Checks that all hashes are correctly linked
   */
  verifyChain(): {
    isValid: boolean;
    errors: string[];
    firstInvalidIndex: number | null;
  } {
    const errors: string[] = [];
    let firstInvalidIndex: number | null = null;

    for (let i = 0; i < this.chain.length; i++) {
      const event = this.chain[i];
      
      // Verify event hash
      const expectedEventHash = this.hashData({
        eventType: event.eventType,
        timestamp: event.timestamp,
        data: event.data
      });
      
      const expectedCurrentHash = this.hashData({
        previousHash: event.previousHash,
        eventDataHash: expectedEventHash
      });

      if (event.currentHash !== expectedCurrentHash) {
        const error = `Event ${i} hash mismatch. Expected: ${expectedCurrentHash}, Got: ${event.currentHash}`;
        errors.push(error);
        if (firstInvalidIndex === null) {
          firstInvalidIndex = i;
        }
      }

      // Verify chain linkage (except for first event)
      if (i > 0) {
        const previousEvent = this.chain[i - 1];
        if (event.previousHash !== previousEvent.currentHash) {
          const error = `Event ${i} linkage broken. Previous hash doesn't match.`;
          errors.push(error);
          if (firstInvalidIndex === null) {
            firstInvalidIndex = i;
          }
        }
      } else {
        // First event should have empty previous hash
        if (event.previousHash !== '') {
          const error = `First event should have empty previous hash. Got: ${event.previousHash}`;
          errors.push(error);
          firstInvalidIndex = 0;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      firstInvalidIndex
    };
  }

  /**
   * Get audit trail for a specific event
   */
  getAuditTrail(eventId: string): MerkleEvent | null {
    return this.chain.find(event => event.eventId === eventId) || null;
  }

  /**
   * Export chain for backup or transfer
   */
  exportChain(): string {
    return JSON.stringify({
      version: '1.0',
      rootHash: this.currentRootHash,
      length: this.chain.length,
      events: this.chain,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import chain from backup
   */
  importChain(exportedData: string): {
    success: boolean;
    error?: string;
    eventsImported: number;
  } {
    try {
      const data = JSON.parse(exportedData);
      
      // Validate structure
      if (!data.events || !Array.isArray(data.events)) {
        return { success: false, error: 'Invalid chain format: missing events array', eventsImported: 0 };
      }

      // Clear existing chain
      this.chain = [];
      this.currentRootHash = '';

      // Import events
      for (const event of data.events) {
        this.chain.push(event);
        this.currentRootHash = event.currentHash;
      }

      // Verify imported chain
      const verification = this.verifyChain();
      if (!verification.isValid) {
        return {
          success: false,
          error: `Chain verification failed: ${verification.errors.join(', ')}`,
          eventsImported: 0
        };
      }

      return {
        success: true,
        eventsImported: this.chain.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown import error',
        eventsImported: 0
      };
    }
  }

  /**
   * Generate cryptographic hash of data
   */
  private hashData(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for readability
  }

  /**
   * Get summary statistics of the chain
   */
  getStats(): {
    totalEvents: number;
    rootHash: string;
    firstEventDate: string | null;
    lastEventDate: string | null;
    eventTypes: Record<string, number>;
  } {
    const eventTypes: Record<string, number> = {};
    
    for (const event of this.chain) {
      eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
    }
    
    return {
      totalEvents: this.chain.length,
      rootHash: this.currentRootHash,
      firstEventDate: this.chain.length > 0 ? this.chain[0].timestamp : null,
      lastEventDate: this.chain.length > 0 ? this.chain[this.chain.length - 1].timestamp : null,
      eventTypes
    };
  }
}

/**
 * Global Merkle Chain instance
 * Use this singleton for the entire application
 */
export const globalMerkleChain = new MerkleChain();

/**
 * Log a signal submission event
 * Convenience function for common use case
 */
export function logSignalSubmission(
  signalId: string,
  district: string,
  tenure: string,
  satisfaction: number,
  exhaustion: number
): MerkleEvent {
  return globalMerkleChain.addEvent('signal_submitted', {
    signalId,
    district,
    tenure,
    satisfaction,
    exhaustion,
    cci: 10 * (0.4 * satisfaction + 0.6 * (10 - exhaustion))
  });
}

/**
 * Log aggregate update event
 */
export function logAggregateUpdate(
  district: string,
  nSignals: number,
  avgCCI: number
): MerkleEvent {
  return globalMerkleChain.addEvent('aggregate_updated', {
    district,
    nSignals,
    avgCCI,
    timestamp: new Date().toISOString()
  });
}