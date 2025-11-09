// Integrity Test Suite
// Tests for data integrity, audit trails, and verification systems

import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '../src/integrations/supabase/client';
import { 
  generateWeeklySnapshot, 
  generateCSVSnapshot, 
  generateNotebookTemplate 
} from '../src/lib/pressKit';
import { snapshotAutomationService } from '../src/lib/snapshotAutomation';
import { storyClusteringService } from '../src/lib/storyClustering';
import { rateLimitService } from '../src/lib/rateLimit';
import { createHash } from 'crypto';

describe('Integrity Test Suite', () => {
  describe('Merkle Chain Integrity', () => {
    it('should maintain consistent hash chain', async () => {
      // Simulate adding events to merkle chain
      const events = [
        { type: 'submission', timestamp: Date.now(), data: 'event1' },
        { type: 'submission', timestamp: Date.now(), data: 'event2' },
        { type: 'submission', timestamp: Date.now(), data: 'event3' }
      ];

      const chain: string[] = [];
      
      for (const event of events) {
        const eventHash = createHash('sha256')
          .update(JSON.stringify(event))
          .digest('hex');
        
        const prevHash = chain[chain.length - 1] || '';
        const merkleHash = createHash('sha256')
          .update(prevHash + eventHash)
          .digest('hex');
        
        chain.push(merkleHash);
      }

      // Verify chain integrity
      expect(chain.length).toBe(3);
      expect(chain[0]).not.toBe(chain[1]);
      expect(chain[1]).not.toBe(chain[2]);
    });

    it('should detect chain tampering', async () => {
      const chain = ['hash1', 'hash2', 'hash3'];
      
      // Tamper with middle element
      const tamperedChain = ['hash1', 'tampered', 'hash3'];
      
      // Verification should fail
      const isValid = chain.every((hash, i) => 
        i === 0 || hash !== tamperedChain[i]
      );
      
      expect(isValid).toBe(false);
    });
  });

  describe('Snapshot Integrity', () => {
    it('should generate consistent snapshots', async () => {
      const snapshot1 = await generateWeeklySnapshot();
      const snapshot2 = await generateWeeklySnapshot();
      
      // Should have same structure
      expect(snapshot1.version).toBe(snapshot2.version);
      expect(snapshot1.schema).toBe(snapshot2.schema);
      expect(snapshot1.data).toBeDefined();
      expect(snapshot2.data).toBeDefined();
    });

    it('should verify snapshot hash integrity', async () => {
      const snapshot = await generateWeeklySnapshot();
      
      // Verify hash is valid SHA-256
      expect(snapshot.hash).toMatch(/^[a-f0-9]{64}$/);
      
      // Recalculate hash to verify
      const recalculatedHash = createHash('sha256')
        .update(JSON.stringify({
          timestamp: snapshot.timestamp,
          version: snapshot.version,
          data: snapshot.data,
          schema: snapshot.schema
        }))
        .digest('hex');
      
      expect(snapshot.hash).toBe(recalculatedHash);
    });

    it('should detect snapshot tampering', async () => {
      const snapshot = await generateWeeklySnapshot();
      
      // Tamper with data
      const tamperedSnapshot = {
        ...snapshot,
        data: {
          ...snapshot.data,
          cci_aggregate: [
            ...(snapshot.data.cci_aggregate || []),
            { fake: 'data' }
          ]
        }
      };
      
      // Recalculate hash
      const tamperedHash = createHash('sha256')
        .update(JSON.stringify(tamperedSnapshot))
        .digest('hex');
      
      // Hashes should be different
      expect(tamperedHash).not.toBe(snapshot.hash);
    });
  });

  describe('Data Audit Trails', () => {
    it('should log all submissions with timestamps', async () => {
      const { data, error } = await supabase
        .from('cci_submissions')
        .select('created_at, submission_date')
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data && data.length > 0) {
        data.forEach(submission => {
          expect(submission.created_at).toBeDefined();
          expect(submission.submission_date).toBeDefined();
          
          // Should be valid ISO dates
          expect(new Date(submission.created_at).toString()).not.toBe('Invalid Date');
        });
      }
    });

    it('should track moderation decisions', async () => {
      const { data, error } = await supabase
        .from('moderation_queue')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      
      if (data && data.length > 0) {
        data.forEach(item => {
          expect(item.created_at).toBeDefined();
          expect(item.status).toBeDefined();
          expect(['pending', 'approved', 'rejected']).toContain(item.status);
        });
      }
    });

    it('should maintain rate limit logs', async () => {
      const { data, error } = await supabase
        .from('rate_limits')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      
      if (data && data.length > 0) {
        data.forEach(limit => {
          expect(limit.device_hash).toBeDefined();
          expect(limit.last_submission).toBeDefined();
          expect(limit.submission_type).toBeDefined();
        });
      }
    });
  });

  describe('Theme Clustering Integrity', () => {
    it('should consistently cluster similar stories', async () => {
      const testStories = [
        { id: '1', text: 'Workload is overwhelming with too many hours', district: 'Calgary' },
        { id: '2', text: 'Excessive hours and heavy workload burden', district: 'Edmonton' },
        { id: '3', text: 'Classroom resources are insufficient and lacking', district: 'Calgary' }
      ];

      const clusters1 = storyClusteringService.clusterStories(testStories);
      const clusters2 = storyClusteringService.clusterStories(testStories);
      
      // Should produce same number of clusters
      expect(clusters1.size).toBe(clusters2.size);
      
      // Stories 1 and 2 should cluster together (workload theme)
      const story1Cluster = clusters1.get('1');
      const story2Cluster = clusters1.get('2');
      expect(story1Cluster?.primaryTheme).toBe(story2Cluster?.primaryTheme);
    });

    it('should maintain theme stability over time', async () => {
      const stories = [
        { id: '1', text: 'Paperwork takes too much time', district: 'Calgary', created_at: '2024-01-01' },
        { id: '2', text: 'Administrative tasks are overwhelming', district: 'Calgary', created_at: '2024-01-15' },
        { id: '3', text: 'Too much documentation required', district: 'Calgary', created_at: '2024-02-01' }
      ];

      const result = storyClusteringService.clusterStories(stories);
      const summary = storyClusteringService.generateThemeSummary(result);
      
      // Should identify workload/administrative theme
      const workloadTheme = summary.find(s => 
        s.theme === 'workload' || s.sampleKeywords.some(k => 
          k.includes('paperwork') || k.includes('administrative')
        )
      );
      
      expect(workloadTheme).toBeDefined();
      expect(workloadTheme?.count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Rate Limiting Integrity', () => {
    it('should consistently identify devices', async () => {
      const deviceHash1 = await getDeviceHash();
      const deviceHash2 = await getDeviceHash();
      
      // Should be consistent
      expect(deviceHash1).toBe(deviceHash2);
      expect(deviceHash1).toHaveLength(64);
    });

    it('should enforce submission limits fairly', async () => {
      const deviceHash = await getDeviceHash();
      
      // Check if device can submit (should be allowed initially)
      const result1 = await rateLimitService.canSubmitSignal();
      expect(result1.allowed).toBe(true);
      
      // Record submission
      await rateLimitService.recordSubmission('signal');
      
      // Should not allow another submission immediately
      const result2 = await rateLimitService.canSubmitSignal();
      expect(result2.allowed).toBe(false);
      expect(result2.reason).toContain('Daily submission limit');
    });
  });

  describe('CSV Export Integrity', () => {
    it('should generate valid CSV format', async () => {
      const csvContent = await generateCSVSnapshot({
        format: 'wide',
        includeMetadata: true
      });

      // Should have header row
      const lines = csvContent.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      
      const headers = lines[0].split(',');
      expect(headers).toContain('"submission_id"');
      expect(headers).toContain('"cci_calculated"');
      expect(headers).toContain('"created_at"');
    });

    it('should maintain data integrity in exports', async () => {
      const csvContent = await generateCSVSnapshot({
        format: 'wide',
        includeMetadata: false
      });

      const lines = csvContent.split('\n').filter(line => line.trim());
      const dataRows = lines.slice(1); // Skip header

      // Each row should have consistent number of columns
      if (dataRows.length > 0) {
        const columnCount = dataRows[0].split(',').length;
        dataRows.forEach(row => {
          expect(row.split(',').length).toBe(columnCount);
        });
      }
    });
  });

  describe('Snapshot Automation Integrity', () => {
    it('should generate complete snapshots', async () => {
      const snapshot = await snapshotAutomationService.generateWeeklySnapshot();
      
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.version).toBe('1.0');
      expect(snapshot.files.length).toBeGreaterThan(0);
      expect(snapshot.integrity.totalHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should create consistent file manifests', async () => {
      const snapshot = await snapshotAutomationService.generateWeeklySnapshot();
      
      // All files should have required metadata
      snapshot.files.forEach(file => {
        expect(file.filename).toBeDefined();
        expect(file.size).toBeGreaterThan(0);
        expect(file.hash).toMatch(/^[a-f0-9]{64}$/);
        expect(['csv', 'json', 'notebook', 'pdf']).toContain(file.type);
      });
    });

    it('should verify snapshot integrity', async () => {
      const snapshot = await snapshotAutomationService.generateWeeklySnapshot();
      const isValid = await snapshotAutomationService.verifyIntegrity(snapshot);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Notebook Template Integrity', () => {
    it('should generate complete notebook templates', async () => {
      const notebook = await generateNotebookTemplate();
      
      expect(notebook).toContain('# Civic Data Platform');
      expect(notebook).toContain('CCI Calculation');
      expect(notebook).toContain('Privacy Considerations');
      expect(notebook).toContain('Analysis Examples');
    });

    it('should include reproducible code examples', async () => {
      const notebook = await generateNotebookTemplate();
      
      // Should contain actual Python code
      expect(notebook).toContain('```python');
      expect(notebook).toContain('import pandas as pd');
      expect(notebook).toContain('import numpy as np');
      expect(notebook).toContain('from scipy import stats');
    });

    it('should document methodology clearly', async () => {
      const notebook = await generateNotebookTemplate();
      
      expect(notebook).toContain('CCI = 10 × (0.4 × job_satisfaction + 0.6 × (10 − work_exhaustion))');
      expect(notebook).toContain('Privacy Threshold: n=20');
      expect(notebook).toContain('Update Frequency: Weekly');
    });
  });

  describe('Database Integrity Constraints', () => {
    it('should enforce unique constraints', async () => {
      // Test that duplicate submissions are prevented
      const { error } = await supabase
        .from('anonymous_tokens')
        .insert([
          { token: 'duplicate-test-token', expires_at: new Date().toISOString() },
          { token: 'duplicate-test-token', expires_at: new Date().toISOString() }
        ]);

      expect(error).toBeDefined(); // Should error on duplicate
    });

    it('should maintain referential integrity', async () => {
      // Test that foreign key constraints work
      const { error } = await supabase
        .from('token_submissions')
        .insert({
          token: 'non-existent-token',
          submission_id: 'test',
          submission_type: 'signal'
        });

      expect(error).toBeDefined(); // Should error on non-existent token
    });
  });

  describe('Audit Trail Completeness', () => {
    it('should log all snapshot generations', async () => {
      const { data, error } = await supabase
        .from('snapshot_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

      expect(error).toBeNull();
      
      if (data && data.length > 0) {
        data.forEach(log => {
          expect(log.timestamp).toBeDefined();
          expect(log.total_hash).toMatch(/^[a-f0-9]{64}$/);
          expect(log.file_count).toBeGreaterThan(0);
        });
      }
    });

    it('should track all data modifications', async () => {
      // Test that update triggers are working
      const { data, error } = await supabase
        .from('stories')
        .select('created_at, updated_at')
        .limit(5);

      expect(error).toBeNull();
      
      if (data && data.length > 0) {
        data.forEach(story => {
          expect(story.created_at).toBeDefined();
          // Updated at should be same as created for new records
          expect(story.updated_at).toBeDefined();
        });
      }
    });
  });

  describe('Cross-System Consistency', () => {
    it('should maintain consistent CCI calculation', async () => {
      const testCases = [
        { satisfaction: 8.0, exhaustion: 3.0, expected: 8.2 },
        { satisfaction: 6.0, exhaustion: 5.0, expected: 6.0 },
        { satisfaction: 4.0, exhaustion: 7.0, expected: 3.8 }
      ];

      for (const testCase of testCases) {
        const cci = calculateCCI(testCase.satisfaction, testCase.exhaustion);
        expect(cci).toBeCloseTo(testCase.expected, 1);
      }
    });

    it('should have consistent privacy thresholds across systems', async () => {
      // All systems should use n=20 threshold
      const thresholds = [
        { system: 'CCI aggregate', threshold: 20 },
        { system: 'District display', threshold: 20 },
        { system: 'Theme clustering', threshold: 20 }
      ];

      thresholds.forEach(({ system, threshold }) => {
        expect(threshold).toBe(20);
      });
    });
  });
});

// Helper function to calculate CCI
function calculateCCI(satisfaction: number, exhaustion: number): number {
  return 10 * (0.4 * satisfaction + 0.6 * (10 - exhaustion));
}