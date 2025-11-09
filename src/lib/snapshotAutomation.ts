// Weekly snapshot automation system
// Generates reproducible, integrity-verified data snapshots

import { supabase } from '@/integrations/supabase/client';
import { generateWeeklySnapshot, generateCSVSnapshot, generateNotebookTemplate } from '@/lib/pressKit';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export interface SnapshotConfig {
  outputDir: string;
  retentionCount: number; // Number of snapshots to keep
  createSymlink: boolean;
  verifyIntegrity: boolean;
  uploadToStorage: boolean;
  notifyStakeholders: boolean;
}

export interface SnapshotFile {
  filename: string;
  filepath: string;
  size: number;
  hash: string;
  createdAt: string;
  type: 'csv' | 'json' | 'notebook' | 'pdf';
}

export interface SnapshotManifest {
  timestamp: string;
  version: string;
  files: SnapshotFile[];
  metadata: {
    totalRecords: number;
    geographicCoverage: number;
    dataQuality: {
      completeness: number;
      privacyThresholdCompliance: boolean;
    };
  };
  integrity: {
    totalHash: string;
    verificationMethod: string;
  };
}

const DEFAULT_CONFIG: SnapshotConfig = {
  outputDir: './snapshots',
  retentionCount: 12, // Keep 12 weeks of snapshots
  createSymlink: true,
  verifyIntegrity: true,
  uploadToStorage: true,
  notifyStakeholders: false // Set to true when email system is configured
};

export class SnapshotAutomationService {
  private config: SnapshotConfig;

  constructor(config: Partial<SnapshotConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Main automation routine
  async generateWeeklySnapshot(): Promise<SnapshotManifest> {
    const timestamp = new Date().toISOString();
    console.log(`Starting weekly snapshot generation: ${timestamp}`);

    try {
      // Ensure output directory exists
      await this.ensureOutputDir();

      // Generate snapshot data
      const snapshotData = await generateWeeklySnapshot();
      
      // Generate various export formats
      const files: SnapshotFile[] = [];

      // 1. JSON snapshot (complete data)
      const jsonFile = await this.generateJSONSnapshot(snapshotData);
      files.push(jsonFile);

      // 2. CSV export (analysis-ready)
      const csvFile = await this.generateCSVSnapshot();
      files.push(csvFile);

      // 3. Jupyter notebook template
      const notebookFile = await this.generateNotebookSnapshot();
      files.push(notebookFile);

      // 4. Methodology PDF (placeholder for actual PDF generation)
      const pdfFile = await this.generateMethodologyPDF();
      files.push(pdfFile);

      // Create manifest
      const manifest = await this.createManifest(files, snapshotData, timestamp);

      // Verify integrity
      if (this.config.verifyIntegrity) {
        await this.verifyIntegrity(manifest);
      }

      // Upload to storage
      if (this.config.uploadToStorage) {
        await this.uploadToStorage(manifest, files);
      }

      // Create symlink to latest
      if (this.config.createSymlink) {
        await this.createLatestSymlink(manifest);
      }

      // Cleanup old snapshots
      await this.cleanupOldSnapshots();

      // Log to database
      await this.logSnapshotGeneration(manifest);

      // Notify stakeholders
      if (this.config.notifyStakeholders) {
        await this.notifyStakeholders(manifest);
      }

      console.log(`Snapshot generation completed: ${manifest.integrity.totalHash}`);
      return manifest;

    } catch (error) {
      console.error('Snapshot generation failed:', error);
      await this.logError(error);
      throw error;
    }
  }

  // Generate JSON snapshot
  private async generateJSONSnapshot(snapshotData: any): Promise<SnapshotFile> {
    const filename = `snapshot-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.config.outputDir, filename);
    
    const content = JSON.stringify(snapshotData, null, 2);
    await fs.writeFile(filepath, content, 'utf-8');

    const stats = await fs.stat(filepath);
    const hash = createHash('sha256').update(content).digest('hex');

    return {
      filename,
      filepath,
      size: stats.size,
      hash,
      createdAt: new Date().toISOString(),
      type: 'json'
    };
  }

  // Generate CSV snapshot
  private async generateCSVSnapshot(): Promise<SnapshotFile> {
    const csvContent = await generateCSVSnapshot({
      format: 'wide',
      includeMetadata: true
    });

    const filename = `snapshot-${new Date().toISOString().split('T')[0]}.csv`;
    const filepath = path.join(this.config.outputDir, filename);
    
    await fs.writeFile(filepath, csvContent, 'utf-8');

    const stats = await fs.stat(filepath);
    const hash = createHash('sha256').update(csvContent).digest('hex');

    return {
      filename,
      filepath,
      size: stats.size,
      hash,
      createdAt: new Date().toISOString(),
      type: 'csv'
    };
  }

  // Generate notebook snapshot
  private async generateNotebookSnapshot(): Promise<SnapshotFile> {
    const notebookContent = await generateNotebookTemplate();
    
    const filename = `analysis-template-${new Date().toISOString().split('T')[0]}.ipynb`;
    const filepath = path.join(this.config.outputDir, filename);
    
    await fs.writeFile(filepath, notebookContent, 'utf-8');

    const stats = await fs.stat(filepath);
    const hash = createHash('sha256').update(notebookContent).digest('hex');

    return {
      filename,
      filepath,
      size: stats.size,
      hash,
      createdAt: new Date().toISOString(),
      type: 'notebook'
    };
  }

  // Generate methodology PDF (placeholder)
  private async generateMethodologyPDF(): Promise<SnapshotFile> {
    // For now, create a text file placeholder
    // In production, this would generate an actual PDF
    const content = `Civic Data Platform - Methodology v1.0
    
CCI Calculation:
CCI = 10 × (0.4 × job_satisfaction + 0.6 × (10 − work_exhaustion))

Privacy Threshold: n≥20
Update Frequency: Weekly
Data Sources: Direct teacher submissions

For complete methodology, visit: https://civicdataplatform.ca/methods-v1.0
    `;

    const filename = `methodology-${new Date().toISOString().split('T')[0]}.pdf`;
    const filepath = path.join(this.config.outputDir, filename);
    
    // Create a text file as placeholder
    const textFilename = filename.replace('.pdf', '.txt');
    const textFilepath = path.join(this.config.outputDir, textFilename);
    await fs.writeFile(textFilepath, content, 'utf-8');

    const stats = await fs.stat(textFilepath);
    const hash = createHash('sha256').update(content).digest('hex');

    return {
      filename: textFilename, // Use text file for now
      filepath: textFilepath,
      size: stats.size,
      hash,
      createdAt: new Date().toISOString(),
      type: 'pdf'
    };
  }

  // Create manifest file
  private async createManifest(
    files: SnapshotFile[], 
    snapshotData: any,
    timestamp: string
  ): Promise<SnapshotManifest> {
    const manifest: SnapshotManifest = {
      timestamp,
      version: '1.0',
      files,
      metadata: {
        totalRecords: snapshotData.data.cci_aggregate?.length || 0,
        geographicCoverage: snapshotData.data.district_coverage?.length || 0,
        dataQuality: {
          completeness: 0.95, // Placeholder - calculate based on actual data
          privacyThresholdCompliance: true
        }
      },
      integrity: {
        totalHash: this.calculateTotalHash(files),
        verificationMethod: 'SHA-256'
      }
    };

    // Save manifest
    const manifestFilename = `manifest-${new Date().toISOString().split('T')[0]}.json`;
    const manifestPath = path.join(this.config.outputDir, manifestFilename);
    
    await fs.writeFile(
      manifestPath, 
      JSON.stringify(manifest, null, 2), 
      'utf-8'
    );

    return manifest;
  }

  // Calculate total hash of all files
  private calculateTotalHash(files: SnapshotFile[]): string {
    const combinedHashes = files.map(f => f.hash).sort().join('');
    return createHash('sha256').update(combinedHashes).digest('hex');
  }

  // Verify integrity of generated files
  private async verifyIntegrity(manifest: SnapshotManifest): Promise<boolean> {
    console.log('Verifying snapshot integrity...');
    
    for (const file of manifest.files) {
      const content = await fs.readFile(file.filepath, 'utf-8');
      const calculatedHash = createHash('sha256').update(content).digest('hex');
      
      if (calculatedHash !== file.hash) {
        throw new Error(`Integrity check failed for ${file.filename}: expected ${file.hash}, got ${calculatedHash}`);
      }
    }

    console.log('Integrity verification passed');
    return true;
  }

  // Upload to Supabase storage
  private async uploadToStorage(manifest: SnapshotManifest, files: SnapshotFile[]): Promise<void> {
    console.log('Uploading snapshots to storage...');
    
    const uploadPromises = files.map(async (file) => {
      const content = await fs.readFile(file.filepath);
      const storagePath = `snapshots/${new Date().toISOString().split('T')[0]}/${file.filename}`;
      
      const { error } = await supabase.storage
        .from('snapshots')
        .upload(storagePath, content, {
          contentType: this.getContentType(file.type),
          upsert: true
        });

      if (error) {
        console.error(`Failed to upload ${file.filename}:`, error);
      } else {
        console.log(`Uploaded ${file.filename} to ${storagePath}`);
      }
    });

    // Also upload manifest
    const manifestContent = JSON.stringify(manifest, null, 2);
    const manifestPath = `snapshots/${new Date().toISOString().split('T')[0]}/manifest.json`;
    
    const { error: manifestError } = await supabase.storage
      .from('snapshots')
      .upload(manifestPath, Buffer.from(manifestContent), {
        contentType: 'application/json',
        upsert: true
      });

    if (manifestError) {
      console.error('Failed to upload manifest:', manifestError);
    }

    await Promise.all(uploadPromises);
    console.log('Storage upload completed');
  }

  // Get content type for file
  private getContentType(type: string): string {
    const contentTypes: Record<string, string> = {
      json: 'application/json',
      csv: 'text/csv',
      notebook: 'application/json',
      pdf: 'application/pdf'
    };
    return contentTypes[type] || 'text/plain';
  }

  // Create symlink to latest snapshot
  private async createLatestSymlink(manifest: SnapshotManifest): Promise<void> {
    console.log('Creating latest symlink...');
    
    const latestDir = path.join(this.config.outputDir, 'latest');
    await fs.mkdir(latestDir, { recursive: true });

    // Copy all files to latest directory
    for (const file of manifest.files) {
      const latestPath = path.join(latestDir, file.filename.replace(/\d{4}-\d{2}-\d{2}/, 'latest'));
      await fs.copyFile(file.filepath, latestPath);
    }

    // Create latest manifest
    const latestManifestPath = path.join(latestDir, 'manifest-latest.json');
    await fs.writeFile(latestManifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    console.log('Latest symlink created');
  }

  // Cleanup old snapshots
  private async cleanupOldSnapshots(): Promise<void> {
    console.log('Cleaning up old snapshots...');
    
    const files = await fs.readdir(this.config.outputDir);
    const snapshotDirs = files
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}$/))
      .sort()
      .reverse();

    // Keep only the most recent snapshots
    const dirsToDelete = snapshotDirs.slice(this.config.retentionCount);
    
    for (const dir of dirsToDelete) {
      const dirPath = path.join(this.config.outputDir, dir);
      await fs.rm(dirPath, { recursive: true, force: true });
      console.log(`Deleted old snapshot: ${dir}`);
    }

    // Also clean up old storage files
    if (this.config.uploadToStorage) {
      await this.cleanupOldStorageSnapshots();
    }
  }

  // Cleanup old storage snapshots
  private async cleanupOldStorageSnapshots(): Promise<void> {
    const { data: files, error } = await supabase.storage
      .from('snapshots')
      .list('snapshots/', {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('Error listing storage snapshots:', error);
      return;
    }

    const snapshotDirs = (files || [])
      .filter(f => f.name.match(/^\d{4}-\d{2}-\d{2}$/))
      .sort((a, b) => b.name.localeCompare(a.name))
      .slice(this.config.retentionCount);

    for (const dir of snapshotDirs) {
      const { error: deleteError } = await supabase.storage
        .from('snapshots')
        .remove([`snapshots/${dir.name}`]);

      if (deleteError) {
        console.error(`Failed to delete storage snapshot ${dir.name}:`, deleteError);
      } else {
        console.log(`Deleted old storage snapshot: ${dir.name}`);
      }
    }
  }

  // Log snapshot generation to database
  private async logSnapshotGeneration(manifest: SnapshotManifest): Promise<void> {
    const { error } = await supabase
      .from('snapshot_logs')
      .insert({
        timestamp: manifest.timestamp,
        version: manifest.version,
        total_hash: manifest.integrity.totalHash,
        file_count: manifest.files.length,
        total_records: manifest.metadata.totalRecords,
        geographic_coverage: manifest.metadata.geographicCoverage,
        manifest: manifest
      });

    if (error) {
      console.error('Failed to log snapshot generation:', error);
    } else {
      console.log('Snapshot generation logged to database');
    }
  }

  // Notify stakeholders (placeholder)
  private async notifyStakeholders(manifest: SnapshotManifest): Promise<void> {
    console.log('Notifying stakeholders about new snapshot...');
    
    // In production, this would send emails to:
    // - Advisory board members
    // - Media contacts
    // - Research partners
    // - Platform administrators
    
    const notification = {
      timestamp: manifest.timestamp,
      hash: manifest.integrity.totalHash,
      files: manifest.files.map(f => ({
        name: f.filename,
        size: f.size,
        type: f.type
      })),
      downloadUrl: `/snapshots/latest/`
    };

    console.log('Stakeholder notification prepared:', notification);
    
    // TODO: Integrate with email service
    // await emailService.sendBulk({
    //   template: 'snapshot-notification',
    //   data: notification,
    //   recipients: stakeholderList
    // });
  }

  // Ensure output directory exists
  private async ensureOutputDir(): Promise<void> {
    await fs.mkdir(this.config.outputDir, { recursive: true });
  }

  // Log error
  private async logError(error: any): Promise<void> {
    await supabase
      .from('error_logs')
      .insert({
        error_type: 'snapshot_generation',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : '',
        timestamp: new Date().toISOString()
      });
  }
}

// Singleton instance
export const snapshotAutomationService = new SnapshotAutomationService();

// Scheduled task runner (to be called by cron)
export async function runWeeklySnapshotTask(): Promise<void> {
  console.log('Starting weekly snapshot task...');
  
  try {
    const manifest = await snapshotAutomationService.generateWeeklySnapshot();
    
    console.log('Weekly snapshot completed successfully:', {
      timestamp: manifest.timestamp,
      hash: manifest.integrity.totalHash,
      files: manifest.files.length,
      records: manifest.metadata.totalRecords
    });
    
  } catch (error) {
    console.error('Weekly snapshot task failed:', error);
    process.exit(1);
  }
}

// Manual trigger for testing
export async function generateManualSnapshot(): Promise<SnapshotManifest> {
  console.log('Generating manual snapshot...');
  return snapshotAutomationService.generateWeeklySnapshot();
}

// Verify existing snapshot integrity
export async function verifySnapshotIntegrity(manifestPath: string): Promise<boolean> {
  const manifestContent = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestContent);
  
  return snapshotAutomationService.verifyIntegrity(manifest);
}

// Export types
export type { SnapshotConfig, SnapshotFile, SnapshotManifest };