// Rate limiting - temporarily stubbed (tables not yet created)

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  currentCount?: number;
}

export class RateLimitService {
  async canSubmitSignal(userId?: string): Promise<RateLimitResult> {
    return { allowed: true };
  }

  async canSubmitStory(userId?: string): Promise<RateLimitResult> {
    return { allowed: true };
  }

  async canSubmitCCI(userId?: string): Promise<RateLimitResult> {
    return { allowed: true };
  }

  async recordSubmission(
    type: 'signal' | 'story' | 'cci',
    userId?: string
  ): Promise<void> {
    // Stub: do nothing
  }
}

export const rateLimitService = new RateLimitService();

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
