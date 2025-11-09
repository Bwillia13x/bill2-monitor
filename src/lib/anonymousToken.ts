// Anonymous token system for personal dashboards without authentication

import { supabase } from '@/integrations/supabase/client';

export interface AnonymousToken {
  token: string;
  created_at: string;
  expires_at: string;
  user_agent: string;
  ip_hash: string;
}

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

const TOKEN_EXPIRY_DAYS = 365; // Tokens expire after 1 year

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
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

    // Get device info for token association
    const userAgent = navigator.userAgent;
    const ipHash = await this.hashString(userAgent + Date.now() + Math.random());

    const { error } = await supabase
      .from('anonymous_tokens')
      .insert({
        token,
        expires_at: expiresAt.toISOString(),
        user_agent: userAgent,
        ip_hash: ipHash,
      });

    if (error) {
      throw new Error(`Failed to generate anonymous token: ${error.message}`);
    }

    return token;
  }

  // Get existing token from localStorage or generate new one
  async getOrCreateToken(): Promise<string> {
    // Check for existing token
    const existingToken = localStorage.getItem('anonymous_token');
    
    if (existingToken) {
      // Validate token is still valid
      const isValid = await this.validateToken(existingToken);
      if (isValid) {
        return existingToken;
      }
    }

    // Generate new token
    const newToken = await this.generateToken();
    localStorage.setItem('anonymous_token', newToken);
    
    return newToken;
  }

  // Validate token exists and hasn't expired
  async validateToken(token: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('anonymous_tokens')
      .select('expires_at')
      .eq('token', token)
      .single();

    if (error || !data) {
      return false;
    }

    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    
    return expiresAt > now;
  }

  // Associate a submission with a token
  async associateSubmission(
    token: string,
    submissionId: string,
    submissionType: 'signal' | 'story' | 'cci',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const { error } = await supabase
      .from('token_submissions')
      .insert({
        token,
        submission_id: submissionId,
        submission_type: submissionType,
        metadata,
      });

    if (error) {
      console.error('Failed to associate submission with token:', error);
    }
  }

  // Get personal dashboard data for a token
  async getDashboardData(token: string): Promise<PersonalDashboardData> {
    // Get all submissions for this token
    const { data: submissions, error: submissionsError } = await supabase
      .from('token_submissions')
      .select('*')
      .eq('token', token)
      .order('created_at', { ascending: false });

    if (submissionsError) {
      throw new Error(`Failed to fetch submissions: ${submissionsError.message}`);
    }

    // Get actual submission data based on type
    const enrichedSubmissions = await Promise.all(
      (submissions || []).map(async (sub) => {
        let submissionData = null;
        
        switch (sub.submission_type) {
          case 'signal':
            const { data: signal } = await supabase
              .from('signals')
              .select('*, created_at')
              .eq('id', sub.submission_id)
              .single();
            submissionData = signal;
            break;
          
          case 'story':
            const { data: story } = await supabase
              .from('stories')
              .select('*, created_at')
              .eq('id', sub.submission_id)
              .single();
            submissionData = story;
            break;
          
          case 'cci':
            const { data: cci } = await supabase
              .from('cci_submissions')
              .select('*, created_at')
              .eq('id', sub.submission_id)
              .single();
            submissionData = cci;
            break;
        }

        return {
          id: sub.submission_id,
          type: sub.submission_type,
          date: submissionData?.created_at || sub.created_at,
          district: submissionData?.district || sub.metadata?.district,
          role: submissionData?.role || sub.metadata?.role,
          metadata: sub.metadata,
        };
      })
    );

    // Calculate statistics
    const stats = this.calculateStats(enrichedSubmissions);
    
    // Generate trends data
    const trends = this.generateTrends(enrichedSubmissions);

    return {
      token,
      submissions: enrichedSubmissions,
      stats,
      trends,
    };
  }

  // Calculate statistics from submissions
  private calculateStats(submissions: PersonalDashboardData['submissions']) {
    if (submissions.length === 0) {
      return {
        totalSubmissions: 0,
        firstSubmission: '',
        lastSubmission: '',
      };
    }

    const districts = submissions.map(s => s.district).filter(Boolean);
    const roles = submissions.map(s => s.role).filter(Boolean);
    
    const districtCounts = districts.reduce((acc, district) => {
      acc[district] = (acc[district] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const roleCounts = roles.reduce((acc, role) => {
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveDistrict = Object.entries(districtCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    const mostActiveRole = Object.entries(roleCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    return {
      totalSubmissions: submissions.length,
      firstSubmission: submissions[submissions.length - 1]?.date || '',
      lastSubmission: submissions[0]?.date || '',
      mostActiveDistrict,
      mostActiveRole,
    };
  }

  // Generate trends data for sparklines
  private generateTrends(submissions: PersonalDashboardData['submissions']) {
    if (submissions.length === 0) return [];

    // Group by date and type
    const dailyCounts = new Map<string, Map<string, number>>();
    
    submissions.forEach(sub => {
      const date = new Date(sub.date).toISOString().split('T')[0];
      if (!dailyCounts.has(date)) {
        dailyCounts.set(date, new Map());
      }
      
      const typeCounts = dailyCounts.get(date)!;
      typeCounts.set(sub.type, (typeCounts.get(sub.type) || 0) + 1);
    });

    // Convert to array format
    const trends: PersonalDashboardData['trends'] = [];
    
    dailyCounts.forEach((typeCounts, date) => {
      typeCounts.forEach((count, type) => {
        trends.push({ date, count, type });
      });
    });

    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }

  // Export dashboard data
  async exportDashboardData(token: string, format: 'csv' | 'json'): Promise<string> {
    const data = await this.getDashboardData(token);
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    // CSV format
    const headers = ['Date', 'Type', 'District', 'Role'];
    const rows = data.submissions.map(sub => [
      new Date(sub.date).toLocaleDateString(),
      sub.type,
      sub.district || '',
      sub.role || '',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }

  // Delete token and all associated data (GDPR compliance)
  async deleteTokenData(token: string): Promise<void> {
    // Delete submissions association
    const { error: submissionsError } = await supabase
      .from('token_submissions')
      .delete()
      .eq('token', token);

    if (submissionsError) {
      console.error('Failed to delete token submissions:', submissionsError);
    }

    // Delete the token itself
    const { error: tokenError } = await supabase
      .from('anonymous_tokens')
      .delete()
      .eq('token', token);

    if (tokenError) {
      console.error('Failed to delete token:', tokenError);
    }

    // Remove from localStorage
    localStorage.removeItem('anonymous_token');
  }

  // Generate cryptographically secure token
  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Simple hash function for IP/user agent
  private async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).substr(0, 16);
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