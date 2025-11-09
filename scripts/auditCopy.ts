#!/usr/bin/env node

/**
 * Copy Audit Script
 * Identifies and flags mobilization/advocacy language in platform content
 * Ensures neutral, methodology-focused messaging
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { auditCopyForMobilization, batchAuditCopy } from '../src/lib/pressKit';
import { resolve } from 'path';

interface AuditOptions {
  path: string;
  pattern: string;
  fix: boolean;
  output: string;
  verbose: boolean;
}

interface AuditResult {
  file: string;
  hasIssues: boolean;
  issues: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    text: string;
    line?: number;
    suggestion: string;
  }>;
  cleanedContent?: string;
  error?: string;
}

// Default configuration
const DEFAULT_OPTIONS: AuditOptions = {
  path: './src',
  pattern: '**/*.{ts,tsx,md,json}',
  fix: false,
  output: './audit-results.json',
  verbose: false
};

// Files to exclude from audit
const EXCLUDE_PATTERNS = [
  'node_modules/**',
  'dist/**',
  'build/**',
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/generated/**',
  '**/*.d.ts',
  'supabase/**',
  '.git/**'
];

// Content types that should be audited
const AUDITABLE_FILES = [
  '**/*.tsx', // React components with UI text
  '**/*.ts',  // TypeScript files with constants/messages
  '**/*.md',  // Markdown documentation
  '**/*.json' // JSON configuration files
];

// Severity-based exit codes
const EXIT_CODES = {
  SUCCESS: 0,
  ISSUES_FOUND: 1,
  ERROR: 2
};

/**
 * Main audit function
 */
async function runAudit(options: Partial<AuditOptions> = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  console.log('🔍 Starting copy audit for mobilization language...\n');
  
  if (opts.verbose) {
    console.log('Options:', JSON.stringify(opts, null, 2));
    console.log();
  }

  try {
    // Find all files to audit
    const files = await findFilesToAudit(opts);
    console.log(`📁 Found ${files.length} files to audit\n`);

    // Audit each file
    const results: AuditResult[] = [];
    let totalIssues = 0;
    let highSeverityIssues = 0;

    for (const file of files) {
      if (opts.verbose) {
        console.log(`Auditing: ${file}`);
      }

      const result = await auditFile(file, opts);
      results.push(result);

      if (result.hasIssues) {
        totalIssues += result.issues.length;
        highSeverityIssues += result.issues.filter(i => i.severity === 'high').length;
        
        if (opts.verbose) {
          console.log(`  ❌ Found ${result.issues.length} issues`);
          result.issues.forEach(issue => {
            console.log(`    - [${issue.severity}] ${issue.type}: ${issue.text}`);
            console.log(`      Suggestion: ${issue.suggestion}`);
          });
        }
      } else if (opts.verbose) {
        console.log(`  ✅ No issues found`);
      }
    }

    // Generate report
    const report = generateReport(results, { totalFiles: files.length, totalIssues, highSeverityIssues });
    
    // Save results
    if (opts.output) {
      writeFileSync(opts.output, JSON.stringify(report, null, 2), 'utf-8');
      console.log(`\n💾 Audit results saved to: ${opts.output}`);
    }

    // Print summary
    printSummary(report);

    // Apply fixes if requested
    if (opts.fix) {
      console.log('\n🛠️  Applying fixes...\n');
      const fixedCount = await applyFixes(results);
      console.log(`✅ Applied fixes to ${fixedCount} files`);
    }

    // Exit with appropriate code
    if (highSeverityIssues > 0) {
      console.log('\n❌ High severity issues found. Please review and fix.');
      process.exit(EXIT_CODES.ISSUES_FOUND);
    } else if (totalIssues > 0) {
      console.log('\n⚠️  Issues found. Review recommended.');
      process.exit(EXIT_CODES.ISSUES_FOUND);
    } else {
      console.log('\n✅ No mobilization language detected. All clear!');
      process.exit(EXIT_CODES.SUCCESS);
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(EXIT_CODES.ERROR);
  }
}

/**
 * Find all files to audit
 */
async function findFilesToAudit(options: AuditOptions): Promise<string[]> {
  const patterns = AUDITABLE_FILES.map(pattern => 
    resolve(options.path, pattern)
  );

  const excludePatterns = EXCLUDE_PATTERNS.map(pattern =>
    `!${resolve(options.path, pattern)}`
  );

  const allFiles: string[] = [];
  
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      ignore: excludePatterns,
      absolute: false
    });
    allFiles.push(...files);
  }

  // Remove duplicates
  return [...new Set(allFiles)];
}

/**
 * Audit a single file
 */
async function auditFile(filePath: string, options: AuditOptions): Promise<AuditResult> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const result = auditCopyForMobilization(content);

    // Enhance with line numbers if possible
    const enhancedIssues = result.issues.map(issue => ({
      ...issue,
      line: findLineNumber(content, issue.text)
    }));

    return {
      file: filePath,
      hasIssues: result.hasIssues,
      issues: enhancedIssues,
      cleanedContent: result.cleanedText
    };

  } catch (error) {
    return {
      file: filePath,
      hasIssues: false,
      issues: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Find line number for a given text
 */
function findLineNumber(content: string, searchText: string): number | undefined {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchText)) {
      return i + 1;
    }
  }
  return undefined;
}

/**
 * Generate audit report
 */
function generateReport(results: AuditResult[], stats: {
  totalFiles: number;
  totalIssues: number;
  highSeverityIssues: number;
}) {
  const filesWithIssues = results.filter(r => r.hasIssues);
  const filesWithoutIssues = results.filter(r => !r.hasIssues && !r.error);
  const filesWithErrors = results.filter(r => r.error);

  return {
    summary: {
      ...stats,
      filesAudited: results.length,
      filesWithIssues: filesWithIssues.length,
      filesWithoutIssues: filesWithoutIssues.length,
      filesWithErrors: filesWithErrors.length,
      timestamp: new Date().toISOString()
    },
    results: results.map(r => ({
      file: r.file,
      hasIssues: r.hasIssues,
      issueCount: r.issues?.length || 0,
      issues: r.issues,
      error: r.error
    })),
    recommendations: generateRecommendations(filesWithIssues, stats)
  };
}

/**
 * Generate recommendations based on audit results
 */
function generateRecommendations(filesWithIssues: AuditResult[], stats: {
  totalFiles: number;
  totalIssues: number;
  highSeverityIssues: number;
}) {
  const recommendations: string[] = [];

  if (stats.highSeverityIssues > 0) {
    recommendations.push(
      '🔴 URGENT: Fix high-severity mobilization language immediately'
    );
  }

  if (stats.totalIssues > 10) {
    recommendations.push(
      '🟡 Review content strategy - multiple files contain advocacy language'
    );
  }

  if (filesWithIssues.length > 0) {
    const severities = filesWithIssues.flatMap(f => f.issues?.map(i => i.severity) || []);
    const highSeverityCount = severities.filter(s => s === 'high').length;
    
    if (highSeverityCount > 0) {
      recommendations.push(
        `🔴 Found ${highSeverityCount} high-severity issues requiring immediate attention`
      );
    }
  }

  recommendations.push(
    '✅ Run this audit regularly as part of CI/CD pipeline',
    '✅ Review all changes to user-facing content',
    '✅ Train content creators on neutral language guidelines'
  );

  return recommendations;
}

/**
 * Print summary to console
 */
function printSummary(report: any) {
  const { summary } = report;
  
  console.log('\n📊 AUDIT SUMMARY\n');
  console.log(`Files audited: ${summary.filesAudited}`);
  console.log(`Files with issues: ${summary.filesWithIssues}`);
  console.log(`Files without issues: ${summary.filesWithoutIssues}`);
  console.log(`Files with errors: ${summary.filesWithErrors}`);
  console.log(`Total issues found: ${summary.totalIssues}`);
  console.log(`High severity issues: ${summary.highSeverityIssues}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec: string) => console.log(`  ${rec}`));
  }
}

/**
 * Apply fixes to files
 */
async function applyFixes(results: AuditResult[]): Promise<number> {
  let fixedCount = 0;

  for (const result of results) {
    if (result.hasIssues && result.cleanedContent) {
      try {
        writeFileSync(result.file, result.cleanedContent, 'utf-8');
        fixedCount++;
        console.log(`  ✅ Fixed: ${result.file}`);
      } catch (error) {
        console.error(`  ❌ Failed to fix ${result.file}:`, error);
      }
    }
  }

  return fixedCount;
}

/**
 * CLI argument parser
 */
function parseArgs(): Partial<AuditOptions> {
  const args = process.argv.slice(2);
  const options: Partial<AuditOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--path':
      case '-p':
        options.path = args[++i];
        break;
      case '--pattern':
      case '-g':
        options.pattern = args[++i];
        break;
      case '--fix':
      case '-f':
        options.fix = true;
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        console.warn(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
🔍 Civic Data Platform - Copy Audit Tool

USAGE:
    npm run audit:copy [OPTIONS]

OPTIONS:
    -p, --path <PATH>        Root path to audit (default: ./src)
    -g, --pattern <PATTERN>  File pattern to match (default: **/*.{ts,tsx,md,json})
    -f, --fix               Automatically fix issues
    -o, --output <FILE>      Save results to file (default: ./audit-results.json)
    -v, --verbose           Show detailed progress
    -h, --help              Show this help message

EXAMPLES:
    # Audit all files in src directory
    npm run audit:copy

    # Audit with auto-fix
    npm run audit:copy -- --fix

    # Audit specific directory with verbose output
    npm run audit:copy -- --path ./src/pages --verbose

    # Save results to custom file
    npm run audit:copy -- --output ./results/audit-2024.json

EXIT CODES:
    0 - Success, no issues found
    1 - Issues found (1 = high severity, 1+ = other issues)
    2 - Error during audit

SEVERITY LEVELS:
    🔴 High - Mobilization/advocacy language requiring immediate attention
    🟡 Medium - Potentially problematic language suggesting review
    🟢 Low - Minor issues or borderline language

ISSUE TYPES:
    - call_to_action: Direct calls to join/support movements
    - urgency: Emergency/crisis language
    - advocacy: Demands for specific changes
    - solidarity: Collective action language
    - exclusionary: Divisive or polarizing language
`);
}

/**
 * Main execution
 */
if (require.main === module) {
  const options = parseArgs();
  runAudit(options).catch(console.error);
}

// Export for programmatic use
export { runAudit, auditCopyForMobilization, batchAuditCopy };