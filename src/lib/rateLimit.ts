import { supabase } from '@/integrations/supabase/client';
import { getRateLimitIdentifiers } from './deviceFingerprint';

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  currentCount?: number;
}

interface RateLimitConfig {
  maxSubmissionsPerDay: number;
  maxDevicesPerHourPerASN: number;
  timeWindows: {
    day: number;
    hour: number;
  };
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxSubmissionsPerDay: 1,
  maxDevicesPerHourPerASN: 10,
  timeWindows: {
    day: 24 * 60 * 60 * 1000, // 24 hours in ms
    hour: 60 * 60 * 1000, // 1 hour in ms
  },
};

export class RateLimitService {
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async canSubmitSignal(userId?: string): Promise<RateLimitResult> {
    try {
      const { deviceHash, asnIdentifier } = await getRateLimitIdentifiers();
      const now = new Date();
      const dayAgo = new Date(now.getTime() - this.config.timeWindows.day);

      // Check device-based rate limiting
      const deviceResult = await this.checkDeviceLimit(deviceHash, dayAgo);
      if (!deviceResult.allowed) {
        return deviceResult;
      }

      // Check ASN-based rate limiting (if we have a valid ASN)
      if (asnIdentifier !== 'fallback-asn') {
        const asnResult = await this.checkASNLimit(asnIdentifier, now);
        if (!asnResult.allowed) {
          return asnResult;
        }
      }

      // Check user-based rate limiting if user is authenticated
      if (userId) {
        const userResult = await this.checkUserLimit(userId, dayAgo);
        if (!userResult.allowed) {
          return userResult;
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Rate limiting check failed:', error);
      // Fail open - allow submission if rate limiting fails
      return { allowed: true };
    }
  }

  async canSubmitStory(userId?: string): Promise<RateLimitResult> {
    // Stories have more lenient rate limiting
    return this.canSubmitSignal(userId);
  }

  async canSubmitCCI(userId?: string): Promise<RateLimitResult> {
    // CCI submissions follow the same rate limiting as signals
    return this.canSubmitSignal(userId);
  }

  async recordSubmission(
    type: 'signal' | 'story' | 'cci',
    userId?: string
  ): Promise<void> {
    try {
      const { deviceHash, asnIdentifier } = await getRateLimitIdentifiers();
      const now = new Date();

      // Record device submission
      await this.recordDeviceSubmission(deviceHash, type, now);

      // Record ASN submission
      if (asnIdentifier !== 'fallback-asn') {
        await this.recordASNSubmission(asnIdentifier, deviceHash, now);
      }

      // Record user submission if authenticated
      if (userId) {
        await this.recordUserSubmission(userId, type, now);
      }
    } catch (error) {
      console.error('Failed to record submission:', error);
      // Don't fail the submission if logging fails
    }
  }

  private async checkDeviceLimit(deviceHash: string, since: Date): Promise<RateLimitResult> {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('device_hash', deviceHash)
      .gte('last_submission', since.toISOString())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking device limit:', error);
      return { allowed: true };
    }

    if (data) {
      const submissions = data.submission_count || 0;
      const lastSubmission = new Date(data.last_submission);
      const hoursSince = (Date.now() - lastSubmission.getTime()) / (1000 * 60 * 60);

      if (submissions >= this.config.maxSubmissionsPerDay && hoursSince < 24) {
        const retryAfter = Math.ceil(24 - hoursSince);
        return {
          allowed: false,
          reason: `Daily submission limit reached. Try again in ${retryAfter} hours.`,
          retryAfter,
          currentCount: submissions,
        };
      }
    }

    return { allowed: true };
  }

  private async checkASNLimit(asnIdentifier: string, now: Date): Promise<RateLimitResult> {
    const hourAgo = new Date(now.getTime() - this.config.timeWindows.hour);

    const { data, error } = await supabase
      .from('asn_submissions')
      .select('device_hash')
      .eq('asn_identifier', asnIdentifier)
      .gte('submitted_at', hourAgo.toISOString());

    if (error) {
      console.error('Error checking ASN limit:', error);
      return { allowed: true };
    }

    const uniqueDevices = new Set(data.map(row => row.device_hash)).size;

    if (uniqueDevices >= this.config.maxDevicesPerHourPerASN) {
      return {
        allowed: false,
        reason: 'Too many submissions from your network. Please try again later.',
        currentCount: uniqueDevices,
      };
    }

    return { allowed: true };
  }

  private async checkUserLimit(userId: string, since: Date): Promise<RateLimitResult> {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .gte('last_submission', since.toISOString())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user limit:', error);
      return { allowed: true };
    }

    if (data) {
      const submissions = data.submission_count || 0;
      const lastSubmission = new Date(data.last_submission);
      const hoursSince = (Date.now() - lastSubmission.getTime()) / (1000 * 60 * 60);

      if (submissions >= this.config.maxSubmissionsPerDay && hoursSince < 24) {
        const retryAfter = Math.ceil(24 - hoursSince);
        return {
          allowed: false,
          reason: `Daily submission limit reached. Try again in ${retryAfter} hours.`,
          retryAfter,
          currentCount: submissions,
        };
      }
    }

    return { allowed: true };
  }

  private async recordDeviceSubmission(deviceHash: string, type: string, timestamp: Date): Promise<void> {
    const { error } = await supabase
      .from('rate_limits')
      .upsert({
        device_hash: deviceHash,
        last_submission: timestamp.toISOString(),
        submission_type: type,
        submission_count: 1,
      }, {
        onConflict: 'device_hash',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error recording device submission:', error);
    }
  }

  private async recordASNSubmission(asnIdentifier: string, deviceHash: string, timestamp: Date): Promise<void> {
    const { error } = await supabase
      .from('asn_submissions')
      .insert({
        asn_identifier: asnIdentifier,
        device_hash: deviceHash,
        submitted_at: timestamp.toISOString(),
      });

    if (error) {
      console.error('Error recording ASN submission:', error);
    }
  }

  private async recordUserSubmission(userId: string, type: string, timestamp: Date): Promise<void> {
    const { error } = await supabase
      .from('rate_limits')
      .upsert({
        user_id: userId,
        last_submission: timestamp.toISOString(),
        submission_type: type,
        submission_count: 1,
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error recording user submission:', error);
    }
  }
}

// Singleton instance
export const rateLimitService = new RateLimitService();

// Hook for React components
export function useRateLimit() {
  const checkSubmission = async (type: 'signal' | 'story' | 'cci', userId?: string) => {
    return rateLimitService.canSubmitSignal(userId);
  };

  const recordSubmission = async (type: 'signal' | 'story' | 'cci', userId?: string) => {
    return rateLimitService.recordSubmission(type, userId);
  };

  return {
    checkSubmission,
    recordSubmission,
  };
}