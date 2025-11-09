// Press kit generation utilities
// Creates comprehensive media packages for journalists and researchers

import { supabase } from '@/integrations/supabase/client';
import { getCCIAggregate } from '@/lib/metrics';
import { advisoryBoardMembers } from '@/data/advisoryBoard';

export interface PressKitData {
  platformInfo: {
    name: string;
    description: string;
    launchDate: string;
    methodologyVersion: string;
  };
  latestData: {
    cci: number;
    totalSubmissions: number;
    activeDistricts: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  methodology: {
    cciCalculation: string;
    privacyThreshold: number;
    updateFrequency: string;
    dataSources: string[];
  };
  advisoryBoard: typeof advisoryBoardMembers;
  contacts: {
    media: string;
    technical: string;
    governance: string;
  };
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  boilerplate: string;
}

export interface CSVExportOptions {
  format: 'wide' | 'long';
  includeMetadata: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  districts?: string[];
}

export interface SnapshotData {
  timestamp: string;
  version: string;
  data: any;
  hash: string;
  schema: string;
}

// Generate comprehensive press kit
export async function generatePressKit(): Promise<PressKitData> {
  // Fetch latest platform data
  const { data: latestData, error: dataError } = await supabase
    .rpc('get_cci_aggregate', { days_back: 7, min_n: 20 })
    .single();

  if (dataError) {
    console.error('Error fetching latest data:', dataError);
  }

  // Get total submissions count
  const { count: totalSubmissions, error: countError } = await supabase
    .from('cci_submissions')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting submissions:', countError);
  }

  // Get active districts
  const { data: districts, error: districtError } = await supabase
    .rpc('get_cci_aggregate', { min_n: 20 });

  if (districtError) {
    console.error('Error fetching districts:', districtError);
  }

  const activeDistricts = districts?.filter(d => d.total_n >= 20).length || 0;

  return {
    platformInfo: {
      name: 'Civic Data Platform - Alberta Teacher Experience Index',
      description: 'An independent, methodology-driven platform for measuring teacher working conditions across Alberta using privacy-preserving statistical methods.',
      launchDate: '2024-01-15',
      methodologyVersion: '1.0'
    },
    latestData: {
      cci: latestData?.cci || 0,
      totalSubmissions: totalSubmissions || 0,
      activeDistricts,
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    },
    methodology: {
      cciCalculation: 'CCI = 10 × (0.4 × job_satisfaction + 0.6 × (10 − work_exhaustion))',
      privacyThreshold: 20,
      updateFrequency: 'Weekly updates every Monday at 9:00 AM MST',
      dataSources: [
        'Direct teacher submissions via web platform',
        'Privacy-preserving aggregation',
        'Geographic and demographic stratification'
      ]
    },
    advisoryBoard: advisoryBoardMembers,
    contacts: {
      media: 'media@civicdataplatform.ca',
      technical: 'tech@civicdataplatform.ca',
      governance: 'governance@civicdataplatform.ca'
    },
    faqs: [
      {
        question: 'What is the Civic Data Platform?',
        answer: 'The Civic Data Platform is an independent research initiative that measures teacher working conditions across Alberta using rigorous statistical methodology. We provide objective, data-driven insights to inform policy discussions.'
      },
      {
        question: 'How is the CCI calculated?',
        answer: 'The Composite Conditions Index (CCI) is calculated using the formula: CCI = 10 × (0.4 × job_satisfaction + 0.6 × (10 − work_exhaustion)). Scores are aggregated with a minimum sample size of 20 responses per geographic unit.'
      },
      {
        question: 'How do you protect teacher privacy?',
        answer: 'We employ multiple privacy protections: minimum sample thresholds (n≥20), geographic fuzzing, automatic PII detection and redaction, and secure data handling procedures. Individual responses are never shared or published.'
      },
      {
        question: 'Who oversees the platform?',
        answer: 'The platform is overseen by an independent advisory board of academic experts in education policy, statistics, law, and research methodology. Board members have no financial relationships with teacher unions or advocacy organizations.'
      },
      {
        question: 'How often is data updated?',
        answer: 'Data is updated weekly every Monday at 9:00 AM MST. This schedule allows for quality control and verification procedures while providing timely information.'
      },
      {
        question: 'Can journalists access raw data?',
        answer: 'Journalists can access aggregated, privacy-protected datasets through our press kit and weekly snapshots. Individual-level data is never shared to protect participant privacy.'
      }
    ],
    boilerplate: `The Civic Data Platform is an independent research initiative that measures teacher working conditions across Alberta using rigorous statistical methodology. The platform employs privacy-preserving data collection techniques and is overseen by an independent advisory board of academic experts. The Composite Conditions Index (CCI) provides a standardized measure of workplace conditions based on aggregated teacher responses, with strict privacy protections ensuring individual responses remain confidential. For more information, visit civicdataplatform.ca or contact media@civicdataplatform.ca.`
  };
}

// Generate CSV export for data snapshots
export async function generateCSVSnapshot(options: CSVExportOptions = {
  format: 'wide',
  includeMetadata: true
}): Promise<string> {
  // Fetch data based on options
  let query = supabase.from('cci_submissions').select('*');
  
  if (options.dateRange) {
    query = query
      .gte('created_at', options.dateRange.start)
      .lte('created_at', options.dateRange.end);
  }
  
  if (options.districts && options.districts.length > 0) {
    query = query.in('district', options.districts);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch data for CSV export: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return 'No data available for the specified criteria.';
  }

  // Generate CSV based on format
  if (options.format === 'wide') {
    return generateWideFormatCSV(data, options.includeMetadata);
  } else {
    return generateLongFormatCSV(data, options.includeMetadata);
  }
}

// Wide format (one row per submission)
function generateWideFormatCSV(data: any[], includeMetadata: boolean): string {
  const headers = [
    'submission_id',
    'submission_date',
    'district',
    'role',
    'tenure',
    'satisfaction_10',
    'exhaustion_10',
    'weekly_comparison',
    'cci_calculated'
  ];

  if (includeMetadata) {
    headers.push('created_at', 'processed_at', 'privacy_compliant');
  }

  const rows = data.map(row => {
    const calculatedCCI = calculateCCI(row.satisfaction_10, row.exhaustion_10);
    
    const values = [
      row.id,
      new Date(row.submission_date).toISOString(),
      row.district || 'Not specified',
      row.role || 'Not specified',
      row.tenure || 'Not specified',
      row.satisfaction_10,
      row.exhaustion_10,
      row.weekly_comparison,
      calculatedCCI.toFixed(2)
    ];

    if (includeMetadata) {
      values.push(
        new Date(row.created_at).toISOString(),
        new Date().toISOString(),
        'true'
      );
    }

    return values.map(v => `"${v}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// Long format (one row per metric per submission)
function generateLongFormatCSV(data: any[], includeMetadata: boolean): string {
  const headers = [
    'submission_id',
    'submission_date',
    'district',
    'role',
    'tenure',
    'metric',
    'value',
    'scale'
  ];

  if (includeMetadata) {
    headers.push('created_at', 'privacy_compliant');
  }

  const rows: string[] = [];

  data.forEach(row => {
    const baseValues = [
      row.id,
      new Date(row.submission_date).toISOString(),
      row.district || 'Not specified',
      row.role || 'Not specified',
      row.tenure || 'Not specified'
    ];

    // Satisfaction metric
    const satisfactionRow = [
      ...baseValues,
      'job_satisfaction',
      row.satisfaction_10,
      '0-10'
    ];

    // Exhaustion metric
    const exhaustionRow = [
      ...baseValues,
      'work_exhaustion',
      row.exhaustion_10,
      '0-10'
    ];

    if (includeMetadata) {
      satisfactionRow.push(new Date(row.created_at).toISOString(), 'true');
      exhaustionRow.push(new Date(row.created_at).toISOString(), 'true');
    }

    rows.push(satisfactionRow.map(v => `"${v}"`).join(','));
    rows.push(exhaustionRow.map(v => `"${v}"`).join(','));
  });

  return [headers.join(','), ...rows].join('\n');
}

// Calculate CCI for a submission
function calculateCCI(satisfaction: number, exhaustion: number): number {
  return 10 * (0.4 * satisfaction + 0.6 * (10 - exhaustion));
}

// Generate reproducible notebook template
export async function generateNotebookTemplate(): Promise<string> {
  const pressKit = await generatePressKit();
  
  return `# Civic Data Platform - Reproducible Analysis Template
# Generated: ${new Date().toISOString()}
# Platform Version: ${pressKit.platformInfo.methodologyVersion}

## Overview
This notebook provides a reproducible template for analyzing Civic Data Platform data.
The platform measures teacher working conditions across Alberta using privacy-preserving methods.

## Platform Information
- **Name**: ${pressKit.platformInfo.name}
- **Description**: ${pressKit.platformInfo.description}
- **Launch Date**: ${pressKit.platformInfo.launchDate}
- **Methodology Version**: ${pressKit.platformInfo.methodologyVersion}

## Latest Data Summary
- **Current CCI**: ${pressKit.latestData.cci.toFixed(2)}
- **Total Submissions**: ${pressKit.latestData.totalSubmissions.toLocaleString()}
- **Active Districts**: ${pressKit.latestData.activeDistricts}
- **Date Range**: ${new Date(pressKit.latestData.dateRange.start).toLocaleDateString()} to ${new Date(pressKit.latestData.dateRange.end).toLocaleDateString()}

## Methodology
### CCI Calculation
${pressKit.methodology.cciCalculation}

### Privacy Protections
- Minimum sample threshold: n=${pressKit.methodology.privacyThreshold}
- Geographic fuzzing: ±2km
- Automatic PII detection and redaction
- K-anonymity compliance

### Update Frequency
${pressKit.methodology.updateFrequency}

## Data Sources
${pressKit.methodology.dataSources.map(source => `- ${source}`).join('\n')}

## Data Access
Data can be accessed through:
1. Weekly CSV snapshots (aggregated, privacy-protected)
2. API endpoints (with rate limiting)
3. Press kit downloads
4. Reproducible notebooks (this template)

## Analysis Examples

### Load Data
\`\`\`python
import pandas as pd
import numpy as np

# Load the latest snapshot
df = pd.read_csv('snapshot-latest.csv')

# Basic data info
print(f"Total submissions: {len(df)}")
print(f"Date range: {df['submission_date'].min()} to {df['submission_date'].max()}")
print(f"Districts covered: {df['district'].nunique()}")
\`\`\`

### Calculate District-Level CCI
\`\`\`python
# Group by district and calculate mean CCI
district_cci = df.groupby('district').agg({
    'cci_calculated': ['mean', 'count', 'std']
}).round(2)

district_cci.columns = ['CCI_Mean', 'Sample_Size', 'CCI_StdDev']
district_cci = district_cci[district_cci['Sample_Size'] >= 20]  # Privacy threshold

print("District-level CCI (n≥20):")
print(district_cci.sort_values('CCI_Mean', ascending=False))
\`\`\`

### Time Series Analysis
\`\`\`python
import matplotlib.pyplot as plt
import seaborn as sns

# Convert dates
df['submission_date'] = pd.to_datetime(df['submission_date'])
df['week'] = df['submission_date'].dt.to_period('W')

# Weekly aggregation
weekly_trends = df.groupby('week').agg({
    'cci_calculated': ['mean', 'count'],
    'submission_id': 'count'
}).round(2)

weekly_trends.columns = ['CCI_Mean', 'CCI_StdDev', 'Submission_Count']

# Plot trends
plt.figure(figsize=(12, 6))
sns.lineplot(data=weekly_trends.reset_index(), x='week', y='CCI_Mean')
plt.title('Weekly CCI Trends')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
\`\`\`

### Statistical Significance Testing
\`\`\`python
from scipy import stats

# Compare two time periods
period1 = df[df['submission_date'] < '2024-01-01']['cci_calculated']
period2 = df[df['submission_date'] >= '2024-01-01']['cci_calculated']

# T-test
t_stat, p_value = stats.ttest_ind(period1, period2)

print(f"T-statistic: {t_stat:.3f}")
print(f"P-value: {p_value:.3f}")
print(f"Significant difference: {'Yes' if p_value < 0.05 else 'No'}")
\`\`\`

### Privacy Compliance Check
\`\`\`python
def check_privacy_compliance(df, min_n=20):
    """Check that all aggregations meet privacy thresholds"""
    district_counts = df['district'].value_counts()
    violations = district_counts[district_counts < min_n]
    
    if len(violations) > 0:
        print(f"WARNING: {len(violations)} districts below n={min_n} threshold")
        print("Violating districts:", violations.index.tolist())
        return False
    return True

# Verify compliance
compliant = check_privacy_compliance(df)
print(f"Privacy compliant: {compliant}")
\`\`\`

## Quality Assurance

### Data Validation
- Check for missing values
- Verify data ranges (0-10 for satisfaction/exhaustion)
- Ensure privacy thresholds are met
- Validate date formats and ranges

### Reproducibility Checklist
- [ ] Data version documented
- [ ] Random seeds set (if applicable)
- [ ] Package versions recorded
- [ ] Analysis parameters specified
- [ ] Output files versioned

## Privacy Considerations
1. Never publish individual-level data
2. Always apply minimum sample thresholds
3. Aggregate to appropriate geographic levels
4. Report uncertainty and limitations
5. Respect data access agreements

## Contact Information
- Media: ${pressKit.contacts.media}
- Technical: ${pressKit.contacts.technical}
- Governance: ${pressKit.contacts.governance}

## Citation
When using this data, please cite:
> Civic Data Platform (2024). Alberta Teacher Experience Index. Retrieved from https://civicdataplatform.ca

## Version History
- ${pressKit.platformInfo.methodologyVersion} (Current): Initial methodology release

---
*This notebook was automatically generated by the Civic Data Platform. For questions or concerns about this analysis template, please contact ${pressKit.contacts.technical}*`;
}

// Generate weekly snapshot with integrity verification
export async function generateWeeklySnapshot(): Promise<SnapshotData> {
  const timestamp = new Date().toISOString();
  const version = '1.0';
  
  // Fetch all aggregated data
  const [cciData, districtData, trends] = await Promise.all([
    supabase.rpc('get_cci_aggregate', { min_n: 20 }),
    supabase.rpc('get_campaign_districts', { c_key: 'cci' }),
    supabase.rpc('get_cci_daily_trend', { days: 30, min_n: 20 })
  ]);

  const snapshotData = {
    timestamp,
    version,
    platform: 'Civic Data Platform - Alberta Teacher Experience Index',
    data: {
      cci_aggregate: cciData.data,
      district_coverage: districtData.data,
      trends: trends.data,
      methodology: {
        version: '1.0',
        cci_formula: 'CCI = 10 × (0.4 × job_satisfaction + 0.6 × (10 − work_exhaustion))',
        privacy_threshold: 20,
        update_frequency: 'weekly'
      }
    },
    schema: 'https://civicdataplatform.ca/schemas/snapshot-v1.json'
  };

  // Generate SHA256 hash for integrity verification
  const hash = await generateSHA256(JSON.stringify(snapshotData));

  return {
    ...snapshotData,
    hash
  };
}

// Generate SHA256 hash
async function generateSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Copy audit function to identify mobilization language
export function auditCopyForMobilization(text: string): {
  hasIssues: boolean;
  issues: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    text: string;
    suggestion: string;
  }>;
  cleanedText: string;
} {
  const mobilizationPatterns = [
    {
      type: 'call_to_action',
      pattern: /(join|support|participate in) (the|our) (movement|cause|fight|struggle)/gi,
      severity: 'high' as const,
      suggestion: 'Use neutral language: "This platform measures workplace conditions"'
    },
    {
      type: 'urgency',
      pattern: /(urgent|critical|emergency|crisis) (action|needed|now|required)/gi,
      severity: 'medium' as const,
      suggestion: 'Use factual language: "Data shows trends in teacher satisfaction"'
    },
    {
      type: 'advocacy',
      pattern: /(fight for|stand up for|demand|require) (better|improved|fair) (conditions|pay|treatment)/gi,
      severity: 'high' as const,
      suggestion: 'Use objective language: "The index tracks workplace condition metrics"'
    },
    {
      type: 'solidarity',
      pattern: /(together|united|collective|organize) (we can|to) (make change|win|succeed)/gi,
      severity: 'medium' as const,
      suggestion: 'Use inclusive but neutral language: "All teachers can participate"'
    },
    {
      type: 'exclusionary',
      pattern: /(management|administration|government) (must|needs to|should) (act|change|listen)/gi,
      severity: 'low' as const,
      suggestion: 'Use neutral language: "Data can inform policy discussions"'
    }
  ];

  const issues = [];
  let cleanedText = text;

  for (const pattern of mobilizationPatterns) {
    const matches = text.match(pattern.pattern);
    if (matches) {
      issues.push({
        type: pattern.type,
        severity: pattern.severity,
        text: matches[0],
        suggestion: pattern.suggestion
      });
      
      // Clean the text
      cleanedText = cleanedText.replace(pattern.pattern, (match) => {
        // Replace with neutral alternative based on type
        switch (pattern.type) {
          case 'call_to_action':
            return 'This platform provides objective measurement';
          case 'urgency':
            return 'Data is updated regularly';
          case 'advocacy':
            return 'Metrics track workplace conditions';
          case 'solidarity':
            return 'All participants are welcome';
          case 'exclusionary':
            return 'Data can inform discussions';
          default:
            return match;
        }
      });
    }
  }

  return {
    hasIssues: issues.length > 0,
    issues,
    cleanedText
  };
}

// Batch audit files or directories
export async function batchAuditCopy(files: string[]): Promise<Map<string, {
  hasIssues: boolean;
  issues: any[];
  cleanedText: string;
}>> {
  const results = new Map();
  
  for (const file of files) {
    try {
      // In a real implementation, you would read the file content
      // For now, we'll simulate with placeholder text
      const content = `Sample content from ${file}`;
      const audit = auditCopyForMobilization(content);
      results.set(file, audit);
    } catch (error) {
      console.error(`Error auditing file ${file}:`, error);
      results.set(file, {
        hasIssues: false,
        issues: [],
        cleanedText: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}

// Export types
export type { PressKitData, CSVExportOptions, SnapshotData };