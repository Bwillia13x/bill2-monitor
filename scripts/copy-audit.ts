#!/usr/bin/env node

/**
 * Copy Audit Script
 * Identifies and reports advocacy/mobilization language in the codebase
 * 
 * Usage: npx tsx scripts/copy-audit.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// Patterns to detect advocacy/mobilization language
const ADVOCACY_PATTERNS = [
  { pattern: /digital strike/gi, replacement: 'Alberta Teacher Conditions Index', type: 'branding' },
  { pattern: /Digital Strike/g, replacement: 'Alberta Teacher Conditions Index', type: 'branding' },
  { pattern: /standing up/gi, replacement: 'participating', type: 'mobilization' },
  { pattern: /join us/gi, replacement: 'participate', type: 'mobilization' },
  { pattern: /join the movement/gi, replacement: 'participate in the research', type: 'mobilization' },
  { pattern: /fight for/gi, replacement: 'research on', type: 'mobilization' },
  { pattern: /take action/gi, replacement: 'participate', type: 'mobilization' },
  { pattern: /advocacy/gi, replacement: 'research', type: 'mobilization' },
  { pattern: /mobilization/gi, replacement: 'participation', type: 'mobilization' },
  { pattern: /protest/gi, replacement: 'research participation', type: 'mobilization' },
];

interface AuditResult {
  file: string;
  matches: Array<{
    line: number;
    content: string;
    pattern: string;
    type: string;
    suggestion: string;
  }>;
}

function scanFile(filePath: string): AuditResult | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const matches = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { pattern, replacement, type } of ADVOCACY_PATTERNS) {
        if (pattern.test(line)) {
          matches.push({
            line: i + 1,
            content: line.trim(),
            pattern: pattern.source,
            type,
            suggestion: line.replace(pattern, replacement)
          });
        }
      }
    }

    if (matches.length > 0) {
      return { file: filePath, matches };
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }

  return null;
}

function scanDirectory(dirPath: string, results: AuditResult[] = []): AuditResult[] {
  try {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        scanDirectory(fullPath, results);
      } else if (stat.isFile()) {
        const ext = extname(entry);
        if (['.ts', '.tsx', '.js', '.jsx', '.md'].includes(ext)) {
          const result = scanFile(fullPath);
          if (result) {
            results.push(result);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
  
  return results;
}

function generateReport(results: AuditResult[]): string {
  let report = '# Copy Audit Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  if (results.length === 0) {
    report += '✅ No advocacy language detected!\n';
    return report;
  }
  
  const byType = {
    branding: results.filter(r => r.matches.some(m => m.type === 'branding')),
    mobilization: results.filter(r => r.matches.some(m => m.type === 'mobilization')),
  };
  
  report += `## Summary\n\n`;
  report += `- Total files with issues: ${results.length}\n`;
  report += `- Branding issues: ${byType.branding.length}\n`;
  report += `- Mobilization language: ${byType.mobilization.length}\n\n`;
  
  report += `## Files Requiring Updates\n\n`;
  
  for (const result of results) {
    report += `### ${result.file}\n\n`;
    
    for (const match of result.matches) {
      report += `- **Line ${match.line}** (${match.type})\n`;
      report += `  - Current: \`${match.content}\`\n`;
      report += `  - Suggested: \`${match.suggestion}\`\n\n`;
    }
  }
  
  report += `## Next Steps\n\n`;
  report += `1. Review each file above\n`;
  report += `2. Apply suggested neutral language\n`;
  report += `3. Verify changes maintain intended meaning\n`;
  report += `4. Re-run audit to confirm compliance\n`;
  
  return report;
}

// Main execution
if (require.main === module) {
  console.log('Running copy audit...\n');
  
  const results = scanDirectory('src');
  const report = generateReport(results);
  
  console.log(report);
  
  // Exit with error code if issues found
  process.exit(results.length > 0 ? 1 : 0);
}

export { scanFile, scanDirectory, generateReport, ADVOCACY_PATTERNS };
