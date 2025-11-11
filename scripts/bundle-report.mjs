#!/usr/bin/env node
// Bundle size analyzer with configurable budgets and initial-load enforcement
// Reads bundle-budget.config.json for per-chunk and initial-total limits
// Uses Vite manifest.json to determine entrypoint chunks for initial load

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist', 'assets');
const MANIFEST_PATH = path.join(ROOT_DIR, 'dist', '.vite', 'manifest.json');
const CONFIG_PATH = path.join(ROOT_DIR, 'bundle-budget.config.json');
const REPORT_OUTPUT = path.join(ROOT_DIR, 'bundle-report.json');

// Load configuration
function loadConfig() {
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Failed to load bundle-budget.config.json:', error.message);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function isJavaScriptFile(filename) {
  return filename.endsWith('.js') &&
         !filename.endsWith('.js.map') &&
         !filename.endsWith('.js.gz') &&
         !filename.endsWith('.js.br');
}

function isVendorChunk(filename, vendorExemptions) {
  // Check if filename matches any allowlisted vendor pattern
  return vendorExemptions.some(pattern => filename.includes(pattern));
}

function analyzeChunks(config) {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Build directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  const files = fs.readdirSync(DIST_DIR);
  const chunks = [];

  for (const file of files) {
    const filePath = path.join(DIST_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (!stats.isFile()) continue;

    const ext = path.extname(file);
    let type = 'other';
    
    if (isJavaScriptFile(file)) type = 'js';
    else if (ext === '.css') type = 'css';

    const isVendor = type === 'js' && isVendorChunk(file, config.vendorExemptions);

    chunks.push({
      name: file,
      size: stats.size,
      sizeKB: stats.size / 1024,
      type,
      isVendor,
      isEntrypoint: false, // Will be updated later
    });
  }

  return chunks.sort((a, b) => b.size - a.size);
}

function loadManifest() {
  try {
    const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    return JSON.parse(manifestContent);
  } catch (error) {
    console.warn('⚠️  Could not load manifest.json, skipping initial-load check');
    return null;
  }
}

function findEntrypoints(manifest) {
  if (!manifest) return new Set();
  
  const entrypoints = new Set();
  
  // Find main entrypoint (typically index.html)
  for (const [key, value] of Object.entries(manifest)) {
    if (value.isEntry) {
      // Add the main JS file
      if (value.file) {
        entrypoints.add(path.basename(value.file));
      }
      // Add imported CSS files
      if (value.css) {
        value.css.forEach(css => entrypoints.add(path.basename(css)));
      }
      // Add dynamically imported chunks referenced by entry
      if (value.imports) {
        value.imports.forEach(imp => {
          const imported = manifest[imp];
          if (imported && imported.file) {
            entrypoints.add(path.basename(imported.file));
          }
        });
      }
    }
  }
  
  return entrypoints;
}

function checkBudgets(chunks, config, entrypoints) {
  const violations = [];
  const initialLoadChunks = [];
  let initialLoadTotal = 0;

  for (const chunk of chunks) {
    // Mark entrypoints
    if (entrypoints.has(chunk.name)) {
      chunk.isEntrypoint = true;
      if (chunk.type === 'js') {
        initialLoadChunks.push(chunk);
        initialLoadTotal += chunk.size;
      }
    }

    // Check per-chunk budget (only for non-vendor JS chunks)
    if (chunk.type === 'js' && !chunk.isVendor && chunk.sizeKB > config.perChunkKB) {
      violations.push({
        type: 'per-chunk',
        file: chunk.name,
        size: chunk.size,
        sizeKB: chunk.sizeKB,
        limit: config.perChunkKB,
      });
    }
  }

  // Check initial-load total budget
  const initialLoadTotalKB = initialLoadTotal / 1024;
  if (initialLoadTotalKB > config.initialTotalKB) {
    violations.push({
      type: 'initial-total',
      totalSize: initialLoadTotal,
      totalKB: initialLoadTotalKB,
      limit: config.initialTotalKB,
      chunks: initialLoadChunks.map(c => ({ name: c.name, sizeKB: c.sizeKB })),
    });
  }

  return {
    violations,
    initialLoadChunks,
    initialLoadTotal,
    initialLoadTotalKB,
  };
}

function printReport(chunks, budgetCheck, config) {
  console.log('\n📦 Bundle Size Report\n');
  console.log('─'.repeat(80));
  console.log('File                                             Size      Budget  Type');
  console.log('─'.repeat(80));

  let totalSize = 0;
  let jsSize = 0;
  let cssSize = 0;

  for (const chunk of chunks) {
    totalSize += chunk.size;
    if (chunk.type === 'js') jsSize += chunk.size;
    if (chunk.type === 'css') cssSize += chunk.size;

    // Determine if chunk violates budget
    const violates = budgetCheck.violations.some(
      v => v.type === 'per-chunk' && v.file === chunk.name
    );
    
    let icon = '✅';
    if (violates) icon = '❌';
    if (chunk.isEntrypoint) icon += ' 🔑'; // Mark entrypoints

    const nameDisplay = chunk.name.length > 44 
      ? '...' + chunk.name.slice(-41) 
      : chunk.name.padEnd(44);
    
    const sizeDisplay = formatBytes(chunk.size).padStart(10);
    
    let budgetDisplay = '      -';
    if (chunk.type === 'js') {
      if (chunk.isVendor) {
        budgetDisplay = ' exempt';
      } else {
        budgetDisplay = `  ${config.perChunkKB}KB`;
      }
    }
    
    const typeDisplay = chunk.type.toUpperCase().padStart(6);
    
    console.log(`${icon} ${nameDisplay} ${sizeDisplay} ${budgetDisplay}  ${typeDisplay}`);
  }

  console.log('─'.repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   Total chunks: ${chunks.length}`);
  console.log(`   Total size: ${formatBytes(totalSize)}`);
  console.log(`   JavaScript: ${formatBytes(jsSize)} (${chunks.filter(c => c.type === 'js').length} files)`);
  console.log(`   CSS: ${formatBytes(cssSize)} (${chunks.filter(c => c.type === 'css').length} files)`);
  console.log(`   Other: ${formatBytes(totalSize - jsSize - cssSize)}`);

  console.log(`\n📦 Initial Load:`);
  console.log(`   Total: ${formatBytes(budgetCheck.initialLoadTotal)} (${budgetCheck.initialLoadChunks.length} JS files)`);
  console.log(`   Budget: ${config.initialTotalKB} KB`);
  
  const initialLoadViolation = budgetCheck.violations.find(v => v.type === 'initial-total');
  if (initialLoadViolation) {
    console.log(`   ❌ EXCEEDS by ${(budgetCheck.initialLoadTotalKB - config.initialTotalKB).toFixed(2)} KB`);
  } else {
    console.log(`   ✅ Within budget (${(config.initialTotalKB - budgetCheck.initialLoadTotalKB).toFixed(2)} KB remaining)`);
  }

  // Per-chunk violations
  const perChunkViolations = budgetCheck.violations.filter(v => v.type === 'per-chunk');
  if (perChunkViolations.length > 0) {
    console.log(`\n⚠️  Per-chunk violations (${perChunkViolations.length}):`);
    perChunkViolations.forEach(v => {
      console.log(`   ❌ ${v.file}: ${v.sizeKB.toFixed(2)} KB (exceeds ${v.limit} KB by ${(v.sizeKB - v.limit).toFixed(2)} KB)`);
    });
  }

  // Total violations summary
  if (budgetCheck.violations.length > 0) {
    console.log(`\n❌ Bundle budget check FAILED (${budgetCheck.violations.length} violations)`);
    console.log('\nRecommendations:');
    console.log('  - Use React.lazy() for code splitting');
    console.log('  - Move large dependencies to vendor chunks (add to vendorExemptions in bundle-budget.config.json)');
    console.log('  - Enable tree shaking for unused exports');
    console.log('  - Consider lazy loading non-critical features\n');
    process.exit(1);
  } else {
    console.log('\n✅ All chunks are within budget\n');
  }
}

function detectLazyLoading() {
  const appPath = path.join(ROOT_DIR, 'src', 'App.tsx');
  
  if (!fs.existsSync(appPath)) {
    console.warn('⚠️  Could not verify lazy loading (App.tsx not found)');
    return;
  }

  const appContent = fs.readFileSync(appPath, 'utf-8');
  const hasLazy = appContent.includes('React.lazy') || appContent.includes('lazy(');
  const hasSuspense = appContent.includes('Suspense');

  console.log(`\n🔍 Code Splitting Check:`);
  console.log(`   Lazy loading: ${hasLazy ? '✅ Detected' : '❌ Not found'}`);
  console.log(`   Suspense: ${hasSuspense ? '✅ Detected' : '❌ Not found'}`);
  
  if (!hasLazy || !hasSuspense) {
    console.warn('   ⚠️  Consider using React.lazy() and Suspense for code splitting\n');
  }
}

function writeMachineReadableReport(chunks, budgetCheck, config) {
  const report = {
    timestamp: new Date().toISOString(),
    config: {
      perChunkKB: config.perChunkKB,
      initialTotalKB: config.initialTotalKB,
      vendorExemptions: config.vendorExemptions,
    },
    summary: {
      totalChunks: chunks.length,
      totalSize: chunks.reduce((sum, c) => sum + c.size, 0),
      jsSize: chunks.filter(c => c.type === 'js').reduce((sum, c) => sum + c.size, 0),
      cssSize: chunks.filter(c => c.type === 'css').reduce((sum, c) => sum + c.size, 0),
    },
    initialLoad: {
      total: budgetCheck.initialLoadTotal,
      totalKB: budgetCheck.initialLoadTotalKB,
      chunks: budgetCheck.initialLoadChunks.map(c => ({
        name: c.name,
        size: c.size,
        sizeKB: c.sizeKB,
      })),
    },
    violations: budgetCheck.violations,
    allChunks: chunks.map(c => ({
      name: c.name,
      size: c.size,
      sizeKB: c.sizeKB,
      type: c.type,
      isVendor: c.isVendor,
      isEntrypoint: c.isEntrypoint,
    })),
  };

  try {
    fs.writeFileSync(REPORT_OUTPUT, JSON.stringify(report, null, 2));
    console.log(`\n📄 Machine-readable report written to: ${REPORT_OUTPUT}\n`);
  } catch (error) {
    console.warn('⚠️  Failed to write bundle-report.json:', error.message);
  }
}

// Main execution
try {
  const config = loadConfig();
  const chunks = analyzeChunks(config);
  const manifest = loadManifest();
  const entrypoints = findEntrypoints(manifest);
  const budgetCheck = checkBudgets(chunks, config, entrypoints);
  
  printReport(chunks, budgetCheck, config);
  detectLazyLoading();
  writeMachineReadableReport(chunks, budgetCheck, config);
} catch (error) {
  console.error('❌ Error analyzing bundle:', error);
  process.exit(1);
}
