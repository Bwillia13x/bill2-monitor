// Anonymous token system - temporarily stubbed (tables not yet created)

export interface PersonalDashboardData {
  token: string;
  submissions: Array<{
    id: string;
    type: 'signal' | 'story' | 'cci';
    date: string;
    district?: string;
    role?: string;
    metadata?: Record<string, any>;
  }>;
  stats: {
    totalSubmissions: number;
    firstSubmission: string;
    lastSubmission: string;
    mostActiveDistrict?: string;
    mostActiveRole?: string;
  };
  trends: Array<{
    date: string;
    count: number;
    type: string;
  }>;
}

export class AnonymousTokenService {
  private static instance: AnonymousTokenService;

  static getInstance(): AnonymousTokenService {
    if (!AnonymousTokenService.instance) {
      AnonymousTokenService.instance = new AnonymousTokenService();
    }
    return AnonymousTokenService.instance;
  }

  // Generate a new anonymous token
  async generateToken(): Promise<string> {
    const token = this.generateSecureToken();
    localStorage.setItem('anonymous_token', token);
    return token;
  }

  // Get existing token from localStorage or generate new one
  async getOrCreateToken(): Promise<string> {
    const existingToken = localStorage.getItem('anonymous_token');
    if (existingToken) {
      return existingToken;
    }
    return this.generateToken();
  }

  // Validate token exists and hasn't expired
  async validateToken(token: string): Promise<boolean> {
    // Stub: always return true
    return true;
  }

  // Associate a submission with a token
  async associateSubmission(
    token: string,
    submissionId: string,
    submissionType: 'signal' | 'story' | 'cci',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    // Stub: do nothing
  }

  // Get personal dashboard data for a token
  async getDashboardData(token: string): Promise<PersonalDashboardData> {
    // Stub: return empty data
    return {
      token,
      submissions: [],
      stats: {
        totalSubmissions: 0,
        firstSubmission: '',
        lastSubmission: '',
      },
      trends: [],
    };
  }

  // Export dashboard data
  async exportDashboardData(token: string, format: 'csv' | 'json'): Promise<string> {
    const data = await this.getDashboardData(token);
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    // CSV format
    return 'Date,Type,District,Role\n';
  }

  // Delete token and all associated data
  async deleteTokenData(token: string): Promise<void> {
    localStorage.removeItem('anonymous_token');
  }

  // Generate cryptographically secure token
  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Singleton instance
export const anonymousTokenService = AnonymousTokenService.getInstance();

// Hook for React components
export function useAnonymousToken() {
  const getToken = async () => {
    return anonymousTokenService.getOrCreateToken();
  };

  const validateToken = async (token: string) => {
    return anonymousTokenService.validateToken(token);
  };

  return {
    getToken,
    validateToken,
  };
}
