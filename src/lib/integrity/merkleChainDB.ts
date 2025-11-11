/**
 * Database-Integrated Merkle Chain Event Logging
 * Stores events in Supabase for persistence and auditability
 */

import { supabase } from '@/integrations/supabase/client';

export interface MerkleEvent {
  eventId: string;
  eventType: 'signal_submitted' | 'signal_validated' | 'aggregate_updated' | 'snapshot_created';
  timestamp: string;
  data: any;
  previousHash: string;
  currentHash: string;
}

/**
 * Browser-compatible SHA-256 hashing
 */
async function hashData(data: any): Promise<string> {
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate unique event ID
 */
function generateEventId(): string {
  return crypto.randomUUID().substring(0, 16);
}

/**
 * Database-backed Merkle Chain
 * Persists all events to Supabase for tamper-evident logging
 */
export class MerkleChainDB {
  /**
   * Add a new event to the Merkle chain
   * @param eventType - Type of event
   * @param data - Event data (will be hashed)
   * @returns The complete MerkleEvent with hashes
   */
  async addEvent(eventType: MerkleEvent['eventType'], data: any): Promise<MerkleEvent | null> {
    try {
      // Get the current root hash from database
      const { data: rootHashData } = await (supabase.rpc as any)('get_merkle_root_hash');
      const previousHash = (rootHashData as string) || '';

      // Create hash of current event data
      const timestamp = new Date().toISOString();
      const eventDataHash = await hashData({ eventType, timestamp, data });

      // Create current hash by combining previous hash and event data hash
      const currentHash = await hashData({ previousHash, eventDataHash });

      // Generate event ID
      const eventId = generateEventId();

      // Store in database
      const { data: dbEvent, error } = await (supabase.rpc as any)('add_merkle_event', {
        p_event_id: eventId,
        p_event_type: eventType,
        p_data: data,
        p_previous_hash: previousHash,
        p_current_hash: currentHash
      });

      if (error) {
        console.error('Error adding merkle event:', error);
        return null;
      }

      // Return event object
      return {
        eventId,
        eventType,
        timestamp,
        data,
        previousHash,
        currentHash
      };
    } catch (error) {
      console.error('Failed to add merkle event:', error);
      return null;
    }
  }

  /**
   * Get the current root hash of the chain from database
   */
  async getRootHash(): Promise<string> {
    try {
      const { data, error } = await (supabase.rpc as any)('get_merkle_root_hash');
      if (error) {
        console.error('Error getting root hash:', error);
        return '';
      }
      return (data as string) || '';
    } catch (error) {
      console.error('Failed to get root hash:', error);
      return '';
    }
  }

  /**
   * Get chain statistics from database
   */
  async getStats(): Promise<{
    totalEvents: number;
    rootHash: string;
    firstEventDate: string | null;
    lastEventDate: string | null;
    signalsSubmitted: number;
    aggregatesUpdated: number;
    snapshotsCreated: number;
  }> {
    try {
      const { data, error } = await (supabase.rpc as any)('get_merkle_chain_stats');
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        return {
          totalEvents: 0,
          rootHash: '',
          firstEventDate: null,
          lastEventDate: null,
          signalsSubmitted: 0,
          aggregatesUpdated: 0,
          snapshotsCreated: 0
        };
      }

      const stats = data[0];
      return {
        totalEvents: stats.total_events || 0,
        rootHash: stats.root_hash || '',
        firstEventDate: stats.first_event_date,
        lastEventDate: stats.last_event_date,
        signalsSubmitted: stats.signals_submitted || 0,
        aggregatesUpdated: stats.aggregates_updated || 0,
        snapshotsCreated: stats.snapshots_created || 0
      };
    } catch (error) {
      console.error('Failed to get merkle stats:', error);
      return {
        totalEvents: 0,
        rootHash: '',
        firstEventDate: null,
        lastEventDate: null,
        signalsSubmitted: 0,
        aggregatesUpdated: 0,
        snapshotsCreated: 0
      };
    }
  }

  /**
   * Verify the integrity of the entire chain from database
   */
  async verifyChain(): Promise<{
    isValid: boolean;
    totalEvents: number;
    firstInvalidIndex: number | null;
    errorMessage: string | null;
  }> {
    try {
      const { data, error } = await (supabase.rpc as any)('verify_merkle_chain');
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        return {
          isValid: false,
          totalEvents: 0,
          firstInvalidIndex: null,
          errorMessage: 'Failed to verify chain'
        };
      }

      const result = data[0];
      return {
        isValid: result.is_valid || false,
        totalEvents: result.total_events || 0,
        firstInvalidIndex: result.first_invalid_index,
        errorMessage: result.error_message
      };
    } catch (error) {
      console.error('Failed to verify chain:', error);
      return {
        isValid: false,
        totalEvents: 0,
        firstInvalidIndex: null,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get recent events from the chain
   */
  async getRecentEvents(limit: number = 100): Promise<MerkleEvent[]> {
    try {
      const { data, error } = await (supabase.from as any)('recent_merkle_events')
        .select('*')
        .limit(limit);

      if (error) {
        console.error('Error getting recent events:', error);
        return [];
      }

      // @ts-ignore - Type will be correct after DB types regenerate
      return (data || []).map((event: any) => ({
        eventId: event.event_id,
        eventType: event.event_type,
        timestamp: event.timestamp,
        data: event.data,
        previousHash: '', // Not included in view for performance
        currentHash: event.current_hash
      }));
    } catch (error) {
      console.error('Failed to get recent events:', error);
      return [];
    }
  }
}

/**
 * Global database-backed Merkle Chain instance
 */
export const globalMerkleChainDB = new MerkleChainDB();

/**
 * Log a signal submission event to database
 */
export async function logSignalSubmission(
  signalId: string,
  district: string,
  tenure: string,
  satisfaction: number,
  exhaustion: number
): Promise<MerkleEvent | null> {
  const cci = 10 * (0.4 * satisfaction + 0.6 * (10 - exhaustion));

  return globalMerkleChainDB.addEvent('signal_submitted', {
    signalId,
    district,
    tenure,
    satisfaction,
    exhaustion,
    cci
  });
}

/**
 * Log aggregate update event to database
 */
export async function logAggregateUpdate(
  district: string,
  nSignals: number,
  avgCCI: number
): Promise<MerkleEvent | null> {
  return globalMerkleChainDB.addEvent('aggregate_updated', {
    district,
    nSignals,
    avgCCI,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log snapshot creation event to database
 */
export async function logSnapshotCreation(
  snapshotId: string,
  totalRecords: number,
  dataHash: string
): Promise<MerkleEvent | null> {
  return globalMerkleChainDB.addEvent('snapshot_created', {
    snapshotId,
    totalRecords,
    dataHash,
    timestamp: new Date().toISOString()
  });
}
