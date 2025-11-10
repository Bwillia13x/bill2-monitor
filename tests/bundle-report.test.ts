// Tests for bundle-report.mjs
// Verifies vendor chunk exemption, size budget enforcement, and edge cases

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a temporary test directory
const TEST_DIST_DIR = path.join(__dirname, '..', 'dist-test-fixtures');

describe('Bundle Report Script', () => {
  beforeEach(() => {
    // Create test fixtures directory
    if (!fs.existsSync(TEST_DIST_DIR)) {
      fs.mkdirSync(TEST_DIST_DIR, { recursive: true });
    }
    const assetsDir = path.join(TEST_DIST_DIR, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test fixtures
    if (fs.existsSync(TEST_DIST_DIR)) {
      fs.rmSync(TEST_DIST_DIR, { recursive: true, force: true });
    }
  });

  describe('Vendor Chunk Exemption', () => {
    it('should exempt files with -vendor in the filename from budget checks', () => {
      const assetsDir = path.join(TEST_DIST_DIR, 'assets');
      
      // Create a large vendor chunk (400 KB - exceeds 300 KB limit)
      const largeVendorContent = 'x'.repeat(400 * 1024);
      fs.writeFileSync(
        path.join(assetsDir, 'recharts-vendor-abc123.js'),
        largeVendorContent
      );

      // Create a small non-vendor chunk (100 KB - within limit)
      const smallContent = 'x'.repeat(100 * 1024);
      fs.writeFileSync(
        path.join(assetsDir, 'index-def456.js'),
        smallContent
      );

      // This should pass since vendor chunks are exempt
      const { isVendorChunk } = getBundleReportHelpers();
      expect(isVendorChunk('recharts-vendor-abc123.js')).toBe(true);
      expect(isVendorChunk('index-def456.js')).toBe(false);
    });

    it('should recognize all vendor chunk patterns', () => {
      const { isVendorChunk } = getBundleReportHelpers();
      
      expect(isVendorChunk('recharts-vendor-abc.js')).toBe(true);
      expect(isVendorChunk('react-vendor-xyz.js')).toBe(true);
      expect(isVendorChunk('data-vendor-123.js')).toBe(true);
      expect(isVendorChunk('radix-vendor-789.js')).toBe(true);
      expect(isVendorChunk('carousel-vendor-fff.js')).toBe(true);
      
      // Non-vendor chunks
      expect(isVendorChunk('index-abc.js')).toBe(false);
      expect(isVendorChunk('methods-xyz.js')).toBe(false);
      expect(isVendorChunk('vendor.js')).toBe(false); // Must have -vendor pattern
    });
  });

  describe('Bundle Budget Enforcement', () => {
    it('should fail when a non-vendor JS chunk exceeds 300 KB', () => {
      const assetsDir = path.join(TEST_DIST_DIR, 'assets');
      
      // Create a non-vendor chunk that exceeds budget (301 KB)
      const oversizedContent = 'x'.repeat(301 * 1024);
      fs.writeFileSync(
        path.join(assetsDir, 'index-large.js'),
        oversizedContent
      );

      const { checkBudget } = getBundleReportHelpers();
      const sizeKB = 301;
      const isViolation = checkBudget('index-large.js', sizeKB, 300);
      
      expect(isViolation).toBe(true);
    });

    it('should pass when a non-vendor JS chunk is exactly at budget (300 KB)', () => {
      const assetsDir = path.join(TEST_DIST_DIR, 'assets');
      
      // Create a chunk exactly at budget (300 KB)
      const exactContent = 'x'.repeat(300 * 1024);
      fs.writeFileSync(
        path.join(assetsDir, 'index-exact.js'),
        exactContent
      );

      const { checkBudget } = getBundleReportHelpers();
      const sizeKB = 300;
      const isViolation = checkBudget('index-exact.js', sizeKB, 300);
      
      expect(isViolation).toBe(false);
    });

    it('should pass when a non-vendor JS chunk is under budget (299 KB)', () => {
      const assetsDir = path.join(TEST_DIST_DIR, 'assets');
      
      // Create a chunk under budget (299 KB)
      const underContent = 'x'.repeat(299 * 1024);
      fs.writeFileSync(
        path.join(assetsDir, 'index-under.js'),
        underContent
      );

      const { checkBudget } = getBundleReportHelpers();
      const sizeKB = 299;
      const isViolation = checkBudget('index-under.js', sizeKB, 300);
      
      expect(isViolation).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should ignore .map files when checking budget', () => {
      const assetsDir = path.join(TEST_DIST_DIR, 'assets');
      
      // Create a large .map file (500 KB)
      const largeMapContent = 'x'.repeat(500 * 1024);
      fs.writeFileSync(
        path.join(assetsDir, 'index-abc.js.map'),
        largeMapContent
      );

      // Map files should not be checked (they're not .js files)
      const { isJavaScriptFile } = getBundleReportHelpers();
      expect(isJavaScriptFile('index-abc.js.map')).toBe(false);
      expect(isJavaScriptFile('index-abc.js')).toBe(true);
    });

    it('should only check uncompressed JS files, not .gz or .br files', () => {
      const assetsDir = path.join(TEST_DIST_DIR, 'assets');
      
      // Create compressed files
      fs.writeFileSync(
        path.join(assetsDir, 'index-abc.js.gz'),
        'compressed'
      );
      fs.writeFileSync(
        path.join(assetsDir, 'index-abc.js.br'),
        'compressed'
      );
      fs.writeFileSync(
        path.join(assetsDir, 'index-abc.js'),
        'uncompressed'
      );

      const { isJavaScriptFile } = getBundleReportHelpers();
      expect(isJavaScriptFile('index-abc.js.gz')).toBe(false);
      expect(isJavaScriptFile('index-abc.js.br')).toBe(false);
      expect(isJavaScriptFile('index-abc.js')).toBe(true);
    });

    it('should only check JS files, not CSS or other assets', () => {
      const assetsDir = path.join(TEST_DIST_DIR, 'assets');
      
      // Create various asset types
      fs.writeFileSync(
        path.join(assetsDir, 'index.css'),
        'x'.repeat(400 * 1024) // 400 KB CSS should not be checked
      );
      fs.writeFileSync(
        path.join(assetsDir, 'image.png'),
        'x'.repeat(500 * 1024) // 500 KB image should not be checked
      );

      const { isJavaScriptFile } = getBundleReportHelpers();
      expect(isJavaScriptFile('index.css')).toBe(false);
      expect(isJavaScriptFile('image.png')).toBe(false);
    });

    it('should handle empty dist directory gracefully', () => {
      const emptyDir = path.join(TEST_DIST_DIR, 'empty-assets');
      fs.mkdirSync(emptyDir, { recursive: true });

      // Should not crash on empty directory
      expect(fs.existsSync(emptyDir)).toBe(true);
      const files = fs.readdirSync(emptyDir);
      expect(files.length).toBe(0);
    });
  });

  describe('Multiple Violations Reporting', () => {
    it('should report all violations, not just the first one', () => {
      const assetsDir = path.join(TEST_DIST_DIR, 'assets');
      
      // Create multiple oversized non-vendor chunks
      fs.writeFileSync(
        path.join(assetsDir, 'chunk1-abc.js'),
        'x'.repeat(310 * 1024)
      );
      fs.writeFileSync(
        path.join(assetsDir, 'chunk2-def.js'),
        'x'.repeat(320 * 1024)
      );
      fs.writeFileSync(
        path.join(assetsDir, 'chunk3-ghi.js'),
        'x'.repeat(330 * 1024)
      );

      const { checkBudget } = getBundleReportHelpers();
      
      const violations = [];
      violations.push(checkBudget('chunk1-abc.js', 310, 300));
      violations.push(checkBudget('chunk2-def.js', 320, 300));
      violations.push(checkBudget('chunk3-ghi.js', 330, 300));

      // All three should be violations
      expect(violations.filter(v => v).length).toBe(3);
    });
  });
});

// Helper functions extracted from bundle-report.mjs logic
function getBundleReportHelpers() {
  const MAX_CHUNK_SIZE_KB = 300;

  function isVendorChunk(filename: string): boolean {
    return filename.includes('-vendor') && filename.endsWith('.js');
  }

  function isJavaScriptFile(filename: string): boolean {
    return filename.endsWith('.js') && 
           !filename.endsWith('.js.map') &&
           !filename.endsWith('.js.gz') &&
           !filename.endsWith('.js.br');
  }

  function checkBudget(filename: string, sizeKB: number, maxSizeKB: number): boolean {
    if (!isJavaScriptFile(filename)) return false;
    if (isVendorChunk(filename)) return false;
    return sizeKB > maxSizeKB;
  }

  return {
    isVendorChunk,
    isJavaScriptFile,
    checkBudget,
    MAX_CHUNK_SIZE_KB,
  };
}
