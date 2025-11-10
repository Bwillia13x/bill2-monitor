#!/usr/bin/env node
// Bundle size analyzer
// Analyzes the production build and reports chunk sizes

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '..', 'dist', 'assets');
const MAX_CHUNK_SIZE_KB = 300; // 300 KB gzip limit

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function analyzeChunks() {
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
    
    if (ext === '.js') type = 'js';
    else if (ext === '.css') type = 'css';

    chunks.push({
      name: file,
      size: stats.size,
      type,
    });
  }

  return chunks.sort((a, b) => b.size - a.size);
}

function printReport(chunks) {
  console.log('\n📦 Bundle Size Report\n');
  console.log('─'.repeat(80));
  console.log('File                                             Size         Type');
  console.log('─'.repeat(80));

  let totalSize = 0;
  let jsSize = 0;
  let cssSize = 0;
  let violations = 0;

  for (const chunk of chunks) {
    totalSize += chunk.size;
    if (chunk.type === 'js') jsSize += chunk.size;
    if (chunk.type === 'css') cssSize += chunk.size;

    const sizeKB = chunk.size / 1024;
    // Only check JS files against the budget (assets like images are excluded)
    const exceeds = chunk.type === 'js' && sizeKB > MAX_CHUNK_SIZE_KB;
    const icon = exceeds ? '❌' : '✅';
    
    if (exceeds) violations++;

    const nameDisplay = chunk.name.length > 44 
      ? '...' + chunk.name.slice(-41) 
      : chunk.name.padEnd(44);
    
    const sizeDisplay = formatBytes(chunk.size).padStart(10);
    const typeDisplay = chunk.type.toUpperCase().padStart(6);
    
    console.log(`${icon} ${nameDisplay} ${sizeDisplay}  ${typeDisplay}`);
  }

  console.log('─'.repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   Total chunks: ${chunks.length}`);
  console.log(`   Total size: ${formatBytes(totalSize)}`);
  console.log(`   JavaScript: ${formatBytes(jsSize)} (${chunks.filter(c => c.type === 'js').length} files)`);
  console.log(`   CSS: ${formatBytes(cssSize)} (${chunks.filter(c => c.type === 'css').length} files)`);
  console.log(`   Other: ${formatBytes(totalSize - jsSize - cssSize)}`);

  console.log(`\n⚠️  JavaScript budget violations: ${violations} JS chunks exceed ${MAX_CHUNK_SIZE_KB}KB`);
  
  if (violations > 0) {
    console.log('\n❌ Bundle size check FAILED');
    console.log(`\nPlease optimize JS chunks larger than ${MAX_CHUNK_SIZE_KB}KB using:`);
    console.log('  - Code splitting with React.lazy()');
    console.log('  - Dynamic imports');
    console.log('  - Tree shaking');
    console.log('  - Rollup manual chunks configuration\n');
    process.exit(1);
  } else {
    console.log('\n✅ All chunks are within budget\n');
  }
}

function detectLazyLoading() {
  const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
  
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

// Main execution
try {
  const chunks = analyzeChunks();
  printReport(chunks);
  detectLazyLoading();
} catch (error) {
  console.error('❌ Error analyzing bundle:', error);
  process.exit(1);
}
