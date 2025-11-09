// Data retention and cleanup service

import { supabase } from '@/integrations/supabase/client';
import { storyClusteringService, processStoryBatch } from './storyClustering';

export interface RetentionPolicy {
  storyRetentionDays: number;
  videoRetentionDays: number;
  signalRetentionDays: number;
  cciRetentionDays: number;
  aggregationEnabled: boolean;
  backupEnabled: boolean;
}

const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  storyRetentionDays: 90,
  videoRetentionDays: 180,
  signalRetentionDays: 365,
  cciRetentionDays: 730,
  aggregationEnabled: true,
  backupEnabled: true,
};

export interface AggregatedThemeData {
  theme: string;
  count: number;
  avgConfidence: number;
  districts: string[];
  roles: string[];
  dateRange: {
    start: string;
    end: string;
  };
  sampleKeywords: string[];
  albertaSpecific: boolean;
}

export interface CleanupResult {
  storiesDeleted: number;
  videosDeleted: number;
  signalsDeleted: number;
  cciSubmissionsDeleted: number;
  aggregatedThemes: AggregatedThemeData[];
  backupCreated: boolean;
  errors: string[];
}

export class RetentionService {
  private policy: RetentionPolicy;

  constructor(policy: Partial<RetentionPolicy> = {}) {
    this.policy = { ...DEFAULT_RETENTION_POLICY, ...policy };
  }

  // Get stories that are older than retention period
  async getStoriesForCleanup(): Promise<Array<{
    id: string;
    text: string;
    district?: string;
    role?: string;
    created_at: string;
  }>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.policy.storyRetentionDays);

    const { data, error } = await supabase
      .from('stories')
      .select('id, text, district, role, created_at')
      .lt('created_at', cutoffDate.toISOString())
      .eq('approved', true) // Only cleanup approved stories
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch stories for cleanup: ${error.message}`);
    }

    return data || [];
  }

  // Aggregate stories by theme before deletion
  async aggregateStoriesByTheme(stories: Array<{
    id: string;
    text: string;
    district?: string;
    role?: string;
    created_at: string;
  }>): Promise<AggregatedThemeData[]> {
    if (!this.policy.aggregationEnabled || stories.length === 0) {
      return [];
    }

    try {
      // Process stories through clustering service
      const batchResult = await processStoryBatch(stories);
      
      // Convert clusters to aggregated theme data
      const aggregatedThemes: AggregatedThemeData[] = batchResult.summary.map(summary => {
        const themeStories = stories.filter(story => {
          const clusterResult = storyClusteringService.clusterStory(story);
          return clusterResult.primaryTheme === summary.theme;
        });

        return {
          theme: summary.theme,
          count: summary.count,
          avgConfidence: summary.avgConfidence,
          districts: [...new Set(themeStories.map(s => s.district).filter(Boolean))] as string[],
          roles: [...new Set(themeStories.map(s => s.role).filter(Boolean))] as string[],
          dateRange: {
            start: themeStories[themeStories.length - 1]?.created_at || new Date().toISOString(),
            end: themeStories[0]?.created_at || new Date().toISOString(),
          },
          sampleKeywords: summary.samplePhrases,
          albertaSpecific: summary.albertaSpecific,
        };
      });

      return aggregatedThemes;
    } catch (error) {
      console.error('Failed to aggregate stories by theme:', error);
      return [];
    }
  }

  // Create backup of stories before deletion
  async createStoriesBackup(stories: Array<{
    id: string;
    text: string;
    district?: string;
    role?: string;
    created_at: string;
  }>, aggregatedThemes: AggregatedThemeData[]): Promise<boolean> {
    if (!this.policy.backupEnabled) {
      return false;
    }

    try {
      const backupData = {
        backupDate: new Date().toISOString(),
        retentionPolicy: this.policy,
        totalStories: stories.length,
        stories: stories.map(s => ({
          id: s.id,
          district: s.district,
          role: s.role,
          created_at: s.created_at,
          // Note: We don't store the actual text for privacy, just metadata
        })),
        aggregatedThemes,
        summary: {
          totalStories: stories.length,
          uniqueDistricts: [...new Set(stories.map(s => s.district).filter(Boolean))].length,
          uniqueRoles: [...new Set(stories.map(s => s.role).filter(Boolean))].length,
          dateRange: {
            oldest: stories[stories.length - 1]?.created_at,
            newest: stories[0]?.created_at,
          },
        },
      };

      const { error } = await supabase
        .from('story_backups')
        .insert({
          backup_data: backupData,
          backup_type: 'retention_cleanup',
          story_count: stories.length,
          theme_aggregation: aggregatedThemes,
        });

      if (error) {
        console.error('Failed to create backup:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  // Perform cleanup of old stories
  async cleanupStories(): Promise<{ deletedCount: number; aggregatedThemes: AggregatedThemeData[]; backupCreated: boolean }> {
    try {
      // Get stories for cleanup
      const stories = await this.getStoriesForCleanup();
      
      if (stories.length === 0) {
        return {
          deletedCount: 0,
          aggregatedThemes: [],
          backupCreated: false,
        };
      }

      // Aggregate by theme before deletion
      const aggregatedThemes = await this.aggregateStoriesByTheme(stories);
      
      // Create backup
      const backupCreated = await this.createStoriesBackup(stories, aggregatedThemes);

      // Delete the stories (soft delete by marking as deleted)
      const storyIds = stories.map(s => s.id);
      const { error: deleteError } = await supabase
        .from('stories')
        .update({ 
          deleted: true,
          deleted_at: new Date().toISOString(),
          deletion_reason: 'retention_policy',
        })
        .in('id', storyIds);

      if (deleteError) {
        throw new Error(`Failed to delete stories: ${deleteError.message}`);
      }

      return {
        deletedCount: stories.length,
        aggregatedThemes,
        backupCreated,
      };
    } catch (error) {
      console.error('Failed to cleanup stories:', error);
      throw error;
    }
  }

  // Cleanup old story videos
  async cleanupStoryVideos(): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.policy.videoRetentionDays);

    try {
      const { error } = await supabase
        .from('story_videos')
        .update({ 
          deleted: true,
          deleted_at: new Date().toISOString(),
          deletion_reason: 'retention_policy',
        })
        .lt('created_at', cutoffDate.toISOString())
        .eq('approved', true);

      if (error) {
        throw new Error(`Failed to cleanup videos: ${error.message}`);
      }

      return { deletedCount: 0 }; // Note: We should track this better
    } catch (error) {
      console.error('Failed to cleanup videos:', error);
      throw error;
    }
  }

  // Cleanup old signals
  async cleanupSignals(): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.policy.signalRetentionDays);

    try {
      const { error } = await supabase
        .from('signals')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw new Error(`Failed to cleanup signals: ${error.message}`);
      }

      return { deletedCount: 0 }; // Note: We should track this better
    } catch (error) {
      console.error('Failed to cleanup signals:', error);
      throw error;
    }
  }

  // Cleanup old CCI submissions
  async cleanupCCI(): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.policy.cciRetentionDays);

    try {
      const { error } = await supabase
        .from('cci_submissions')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw new Error(`Failed to cleanup CCI submissions: ${error.message}`);
      }

      return { deletedCount: 0 }; // Note: We should track this better
    } catch (error) {
      console.error('Failed to cleanup CCI submissions:', error);
      throw error;
    }
  }

  // Run full cleanup process
  async runCleanup(): Promise<CleanupResult> {
    const result: CleanupResult = {
      storiesDeleted: 0,
      videosDeleted: 0,
      signalsDeleted: 0,
      cciSubmissionsDeleted: 0,
      aggregatedThemes: [],
      backupCreated: false,
      errors: [],
    };

    try {
      // Cleanup stories (with aggregation and backup)
      const storyCleanup = await this.cleanupStories();
      result.storiesDeleted = storyCleanup.deletedCount;
      result.aggregatedThemes = storyCleanup.aggregatedThemes;
      result.backupCreated = storyCleanup.backupCreated;

      // Cleanup videos
      const videoCleanup = await this.cleanupStoryVideos();
      result.videosDeleted = videoCleanup.deletedCount;

      // Cleanup signals
      const signalCleanup = await this.cleanupSignals();
      result.signalsDeleted = signalCleanup.deletedCount;

      // Cleanup CCI submissions
      const cciCleanup = await this.cleanupCCI();
      result.cciSubmissionsDeleted = cciCleanup.deletedCount;

    } catch (error) {
      result.errors.push(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // Get retention statistics
  async getRetentionStats(): Promise<{
    storiesEligible: number;
    videosEligible: number;
    signalsEligible: number;
    cciEligible: number;
    nextCleanup: string;
  }> {
    const now = new Date();
    
    const storyCutoff = new Date(now);
    storyCutoff.setDate(storyCutoff.getDate() - this.policy.storyRetentionDays);
    
    const videoCutoff = new Date(now);
    videoCutoff.setDate(videoCutoff.getDate() - this.policy.videoRetentionDays);
    
    const signalCutoff = new Date(now);
    signalCutoff.setDate(signalCutoff.getDate() - this.policy.signalRetentionDays);
    
    const cciCutoff = new Date(now);
    cciCutoff.setDate(cciCutoff.getDate() - this.policy.cciRetentionDays);

    // Count eligible items for each type
    const [stories, videos, signals, cci] = await Promise.all([
      supabase.from('stories').select('id', { count: 'exact' }).lt('created_at', storyCutoff.toISOString()),
      supabase.from('story_videos').select('id', { count: 'exact' }).lt('created_at', videoCutoff.toISOString()),
      supabase.from('signals').select('id', { count: 'exact' }).lt('created_at', signalCutoff.toISOString()),
      supabase.from('cci_submissions').select('id', { count: 'exact' }).lt('created_at', cciCutoff.toISOString()),
    ]);

    const nextCleanup = new Date(now);
    nextCleanup.setHours(2, 0, 0, 0); // 2 AM next day
    if (nextCleanup <= now) {
      nextCleanup.setDate(nextCleanup.getDate() + 1);
    }

    return {
      storiesEligible: stories.count || 0,
      videosEligible: videos.count || 0,
      signalsEligible: signals.count || 0,
      cciEligible: cci.count || 0,
      nextCleanup: nextCleanup.toISOString(),
    };
  }
}

// Singleton instance
export const retentionService = new RetentionService();

// Scheduled cleanup function (to be called by cron/job scheduler)
export async function runScheduledCleanup(): Promise<CleanupResult> {
  console.log('Starting scheduled cleanup...');
  const result = await retentionService.runCleanup();
  
  console.log('Cleanup completed:', {
    storiesDeleted: result.storiesDeleted,
    videosDeleted: result.videosDeleted,
    signalsDeleted: result.signalsDeleted,
    cciDeleted: result.cciSubmissionsDeleted,
    errors: result.errors.length,
  });
  
  return result;
}

// Export for use in hooks and components
export { DEFAULT_RETENTION_POLICY };
export type { RetentionPolicy, CleanupResult, AggregatedThemeData };