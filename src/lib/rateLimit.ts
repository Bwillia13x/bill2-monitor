// Rate limiting - client-side and server-side enforcement
// Prevents abuse while allowing legitimate anonymous participation

import { getDeviceHash } from './deviceFingerprint';

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // seconds until can retry
  currentCount?: number;
  limit?: number;
}

// Rate limit configurations
const RATE_LIMITS = {
  signal: {
    perHour: 10,
    perDay: 50,
  },
  story: {
    perHour: 5,
    perDay: 20,
  },
  cci: {
    perHour: 3,
    perDay: 10,
  },
  // Global limits across all types
  global: {
    perHour: 15,
    perDay: 100,
  },
};

interface SubmissionRecord {
  timestamp: number;
  type: 'signal' | 'story' | 'cci';
  deviceHash?: string;
}

export class RateLimitService {
  private storageKey = 'submission_history';
  
  // Get submission history from localStorage
  private getSubmissionHistory(): SubmissionRecord[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const history = JSON.parse(stored) as SubmissionRecord[];
      
      // Clean up old records (older than 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const cleaned = history.filter(r => r.timestamp > oneDayAgo);
      
      // Update storage if we cleaned anything
      if (cleaned.length !== history.length) {
        localStorage.setItem(this.storageKey, JSON.stringify(cleaned));
      }
      
      return cleaned;
    } catch (e) {
      console.error('Error reading submission history:', e);
      return [];
    }
  }
  
  // Record a submission
  private recordSubmissionLocal(type: 'signal' | 'story' | 'cci', deviceHash?: string): void {
    try {
      const history = this.getSubmissionHistory();
      history.push({
        timestamp: Date.now(),
        type,
        deviceHash,
      });
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    } catch (e) {
      console.error('Error recording submission:', e);
    }
  }
  
  // Count submissions in a time window
  private countSubmissions(
    history: SubmissionRecord[],
    type: 'signal' | 'story' | 'cci' | 'all',
    windowMs: number
  ): number {
    const cutoff = Date.now() - windowMs;
    return history.filter(r => {
      if (r.timestamp < cutoff) return false;
      if (type === 'all') return true;
      return r.type === type;
    }).length;
  }
  
  // Check if submission is allowed
  private checkLimit(
    history: SubmissionRecord[],
    type: 'signal' | 'story' | 'cci'
  ): RateLimitResult {
    const limits = RATE_LIMITS[type];
    const oneHourMs = 60 * 60 * 1000;
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Check type-specific hourly limit
    const hourlyCount = this.countSubmissions(history, type, oneHourMs);
    if (hourlyCount >= limits.perHour) {
      return {
        allowed: false,
        reason: `Too many ${type} submissions. Limit: ${limits.perHour} per hour.`,
        retryAfter: 3600,
        currentCount: hourlyCount,
        limit: limits.perHour,
      };
    }
    
    // Check type-specific daily limit
    const dailyCount = this.countSubmissions(history, type, oneDayMs);
    if (dailyCount >= limits.perDay) {
      return {
        allowed: false,
        reason: `Too many ${type} submissions. Limit: ${limits.perDay} per day.`,
        retryAfter: 86400,
        currentCount: dailyCount,
        limit: limits.perDay,
      };
    }
    
    // Check global hourly limit
    const globalHourlyCount = this.countSubmissions(history, 'all', oneHourMs);
    if (globalHourlyCount >= RATE_LIMITS.global.perHour) {
      return {
        allowed: false,
        reason: `Too many submissions overall. Limit: ${RATE_LIMITS.global.perHour} per hour.`,
        retryAfter: 3600,
        currentCount: globalHourlyCount,
        limit: RATE_LIMITS.global.perHour,
      };
    }
    
    // Check global daily limit
    const globalDailyCount = this.countSubmissions(history, 'all', oneDayMs);
    if (globalDailyCount >= RATE_LIMITS.global.perDay) {
      return {
        allowed: false,
        reason: `Too many submissions overall. Limit: ${RATE_LIMITS.global.perDay} per day.`,
        retryAfter: 86400,
        currentCount: globalDailyCount,
        limit: RATE_LIMITS.global.perDay,
      };
    }
    
    return {
      allowed: true,
      currentCount: hourlyCount,
      limit: limits.perHour,
    };
  }
  
  async canSubmitSignal(userId?: string): Promise<RateLimitResult> {
    const history = this.getSubmissionHistory();
    return this.checkLimit(history, 'signal');
  }

  async canSubmitStory(userId?: string): Promise<RateLimitResult> {
    const history = this.getSubmissionHistory();
    return this.checkLimit(history, 'story');
  }

  async canSubmitCCI(userId?: string): Promise<RateLimitResult> {
    const history = this.getSubmissionHistory();
    return this.checkLimit(history, 'cci');
  }

  async recordSubmission(
    type: 'signal' | 'story' | 'cci',
    userId?: string
  ): Promise<void> {
    const deviceHash = await getDeviceHash();
    this.recordSubmissionLocal(type, deviceHash);
  }
  
  // Get current usage stats
  getUsageStats(): {
    signal: { hourly: number; daily: number };
    story: { hourly: number; daily: number };
    cci: { hourly: number; daily: number };
    global: { hourly: number; daily: number };
  } {
    const history = this.getSubmissionHistory();
    const oneHourMs = 60 * 60 * 1000;
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    return {
      signal: {
        hourly: this.countSubmissions(history, 'signal', oneHourMs),
        daily: this.countSubmissions(history, 'signal', oneDayMs),
      },
      story: {
        hourly: this.countSubmissions(history, 'story', oneHourMs),
        daily: this.countSubmissions(history, 'story', oneDayMs),
      },
      cci: {
        hourly: this.countSubmissions(history, 'cci', oneHourMs),
        daily: this.countSubmissions(history, 'cci', oneDayMs),
      },
      global: {
        hourly: this.countSubmissions(history, 'all', oneHourMs),
        daily: this.countSubmissions(history, 'all', oneDayMs),
      },
    };
  }
  
  // Clear submission history (for testing/debugging)
  clearHistory(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export const rateLimitService = new RateLimitService();

export function useRateLimit() {
  const checkSubmission = async (type: 'signal' | 'story' | 'cci', userId?: string) => {
    switch (type) {
      case 'signal':
        return rateLimitService.canSubmitSignal(userId);
      case 'story':
        return rateLimitService.canSubmitStory(userId);
      case 'cci':
        return rateLimitService.canSubmitCCI(userId);
      default:
        return { allowed: false, reason: 'Invalid submission type' };
    }
  };

  const recordSubmission = async (type: 'signal' | 'story' | 'cci', userId?: string) => {
    return rateLimitService.recordSubmission(type, userId);
  };
  
  const getStats = () => {
    return rateLimitService.getUsageStats();
  };

  return {
    checkSubmission,
    recordSubmission,
    getStats,
  };
}

