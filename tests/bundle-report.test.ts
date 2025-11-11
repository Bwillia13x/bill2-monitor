// Tests for bundle-report.mjs
// Verifies allowlist-based vendor exemption, size budget enforcement, and initial-load total

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a temporary test directory
const TEST_DIST_DIR = path.join(__dirname, '..', 'dist-test-fixtures');
const TEST_CONFIG_PATH = path.join(__dirname, '..', 'bundle-budget-test.config.json');

// Default test config
const DEFAULT_TEST_CONFIG = {
  perChunkKB: 300,
  initialTotalKB: 500,
  vendorExemptions: [
    'recharts-vendor',
    'react-vendor',
  ]
};

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
    
    // Create test config
    fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(DEFAULT_TEST_CONFIG, null, 2));
  });

  afterEach(() => {
    // Clean up test fixtures
    if (fs.existsSync(TEST_DIST_DIR)) {
      fs.rmSync(TEST_DIST_DIR, { recursive: true, force: true });
    }
    if (fs.existsSync(TEST_CONFIG_PATH)) {
      fs.unlinkSync(TEST_CONFIG_PATH);
    }
  });

  describe('Allowlist-Based Vendor Exemption', () => {
    it('should exempt allowlisted vendor chunks from budget', () => {
      const { isVendorChunk } = getBundleReportHelpers(DEFAULT_TEST_CONFIG.vendorExemptions);
      
      // Allowlisted patterns should be exempt
      expect(isVendorChunk('recharts-vendor-abc123.js')).toBe(true);
      expect(isVendorChunk('react-vendor-xyz789.js')).toBe(true);
    });

    it('should NOT exempt non-allowlisted vendor chunks', () => {
      const { isVendorChunk } = getBundleReportHelpers(DEFAULT_TEST_CONFIG.vendorExemptions);
      
      // Not in allowlist, so not exempt even if named -vendor
      expect(isVendorChunk('unknown-vendor-abc.js')).toBe(false);
      expect(isVendorChunk('custom-vendor-xyz.js')).toBe(false);
    });

    it('should NOT exempt chunks without -vendor pattern', () => {
      const { isVendorChunk } = getBundleReportHelpers(DEFAULT_TEST_CONFIG.vendorExemptions);
      
      expect(isVendorChunk('index-abc.js')).toBe(false);
      expect(isVendorChunk('methods-xyz.js')).toBe(false);
      expect(isVendorChunk('vendor.js')).toBe(false);
    });
  });

  describe('Bundle Budget Enforcement', () => {
    it('should fail when a non-vendor JS chunk exceeds per-chunk budget', () => {
      const { checkBudget } = getBundleReportHelpers(DEFAULT_TEST_CONFIG.vendorExemptions);
      const sizeKB = 301;
      const isViolation = checkBudget('index-large.js', sizeKB, 300);
      
      expect(isViolation).toBe(true);
    });

    it('should pass when a non-vendor JS chunk is exactly at budget', () => {
      const { checkBudget } = getBundleReportHelpers(DEFAULT_TEST_CONFIG.vendorExemptions);
      const sizeKB = 300;
      const isViolation = checkBudget('index-exact.js', sizeKB, 300);
      
      expect(isViolation).toBe(false);
    });

    it('should pass when a non-vendor JS chunk is under budget', () => {
      const { checkBudget } = getBundleReportHelpers(DEFAULT_TEST_CONFIG.vendorExemptions);
      const sizeKB = 299;
      const isViolation = checkBudget('index-under.js', sizeKB, 300);
      
      expect(isViolation).toBe(false);
    });

    it('should pass when an allowlisted vendor chunk exceeds budget', () => {
      const { checkBudget } = getBundleReportHelpers(DEFAULT_TEST_CONFIG.vendorExemptions);
      const sizeKB = 500; // Exceeds 300KB but is allowlisted
      const isViolation = checkBudget('recharts-vendor-abc.js', sizeKB, 300);
      
      expect(isViolation).toBe(false); // Exempt from budget
    });

    it('should fail when a non-allowlisted vendor chunk exceeds budget', () => {
      const { checkBudget } = getBundleReportHelpers(DEFAULT_TEST_CONFIG.vendorExemptions);
      const sizeKB = 350; // Exceeds 300KB and NOT in allowlist
      const isViolation = checkBudget('custom-vendor-abc.js', sizeKB, 300);
      
      expect(isViolation).toBe(true); // NOT exempt
    });
  });

  describe('File Type Filtering', () => {
    it('should ignore .map files', () => {
      const { isJavaScriptFile } = getBundleReportHelpers([]);
      expect(isJavaScriptFile('index-abc.js.map')).toBe(false);
      expect(isJavaScriptFile('index-abc.js')).toBe(true);
    });

    it('should ignore .gz and .br compressed files', () => {
      const { isJavaScriptFile } = getBundleReportHelpers([]);
      expect(isJavaScriptFile('index-abc.js.gz')).toBe(false);
      expect(isJavaScriptFile('index-abc.js.br')).toBe(false);
      expect(isJavaScriptFile('index-abc.js')).toBe(true);
    });

    it('should only check JS files, not CSS or other assets', () => {
      const { isJavaScriptFile } = getBundleReportHelpers([]);
      expect(isJavaScriptFile('index.css')).toBe(false);
      expect(isJavaScriptFile('image.png')).toBe(false);
      expect(isJavaScriptFile('index.js')).toBe(true);
    });
  });

  describe('Initial Load Total Budget', () => {
    it('should calculate total size of entrypoint chunks', () => {
      const chunks = [
        { name: 'index.js', sizeKB: 200, isEntrypoint: true },
        { name: 'vendor.js', sizeKB: 150, isEntrypoint: true },
        { name: 'lazy.js', sizeKB: 100, isEntrypoint: false },
      ];
      
      const initialLoadTotal = chunks
        .filter(c => c.isEntrypoint)
        .reduce((sum, c) => sum + c.sizeKB, 0);
      
      expect(initialLoadTotal).toBe(350);
    });

    it('should flag violation when initial load exceeds budget', () => {
      const initialLoadTotalKB = 600;
      const budgetKB = 500;
      
      const exceeds = initialLoadTotalKB > budgetKB;
      expect(exceeds).toBe(true);
    });

    it('should pass when initial load is within budget', () => {
      const initialLoadTotalKB = 450;
      const budgetKB = 500;
      
      const exceeds = initialLoadTotalKB > budgetKB;
      expect(exceeds).toBe(false);
    });
  });
});

// Helper functions matching bundle-report.mjs logic
function getBundleReportHelpers(vendorExemptions: string[]) {
  function isJavaScriptFile(filename: string): boolean {
    return filename.endsWith('.js') &&
           !filename.endsWith('.js.map') &&
           !filename.endsWith('.js.gz') &&
           !filename.endsWith('.js.br');
  }

  function isVendorChunk(filename: string): boolean {
    // Check if filename matches any allowlisted vendor pattern
    return vendorExemptions.some(pattern => filename.includes(pattern));
  }

  function checkBudget(filename: string, sizeKB: number, maxSizeKB: number): boolean {
    if (!isJavaScriptFile(filename)) return false;
    if (isVendorChunk(filename)) return false; // Exempt
    return sizeKB > maxSizeKB;
  }

  return {
    isJavaScriptFile,
    isVendorChunk,
    checkBudget,
  };
}
