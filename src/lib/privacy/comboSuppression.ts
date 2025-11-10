/**
 * Rare Combination Suppression Rules
 * Automatically aggregates data when small cell sizes detected
 * Prevents re-identification through cross-referencing
 */

import { TenureBucket } from "./tenureBuckets";

export interface SuppressionRule {
  ruleId: string;
  description: string;
  condition: (params: { district: string; tenure: TenureBucket; subject: string; n: number }) => boolean;
  action: 'suppress' | 'aggregate_district_tenure' | 'aggregate_district_only';
  targetN: number;
}

export interface SuppressionResult {
  isSuppressed: boolean;
  aggregationLevel: 'full' | 'district_tenure' | 'district_only' | 'none';
  ruleApplied?: string;
  n: number;
  minRequired: number;
  message?: string;
}

// Minimum cell size for publication (k-anonymity threshold)
const MIN_CELL_SIZE = 20;

/**
 * Suppression Rules (as defined in implementation plan)
 * 
 * Rule 1: NEVER publish any slice where n < 20
 * Rule 2: If (district + tenure + subject) n < 20 → aggregate to (district + tenure)
 * Rule 3: If (district + tenure) n < 20 → aggregate to (district only)
 * Rule 4: If district n < 20 → show "Locked district" UI
 * Rule 5: Optional DP: Add Laplace(ε=1.0) noise to counts (disclose in Methods)
 */
export const SUPPRESSION_RULES: SuppressionRule[] = [
  {
    ruleId: 'rule1',
    description: 'NEVER publish any slice where n < 20',
    condition: ({ n }) => n < MIN_CELL_SIZE,
    action: 'suppress',
    targetN: MIN_CELL_SIZE
  },
  {
    ruleId: 'rule2',
    description: 'If (district + tenure + subject) n < 20 → aggregate to (district + tenure)',
    condition: ({ district, tenure, subject, n }) => 
      !!district && !!tenure && !!subject && n < MIN_CELL_SIZE,
    action: 'aggregate_district_tenure',
    targetN: MIN_CELL_SIZE
  },
  {
    ruleId: 'rule3',
    description: 'If (district + tenure) n < 20 → aggregate to (district only)',
    condition: ({ district, tenure, n }) => 
      !!district && !!tenure && n < MIN_CELL_SIZE,
    action: 'aggregate_district_only',
    targetN: MIN_CELL_SIZE
  },
  {
    ruleId: 'rule4',
    description: 'If district n < 20 → show "Locked district" UI',
    condition: ({ district, n }) => 
      !!district && n < MIN_CELL_SIZE,
    action: 'suppress',
    targetN: MIN_CELL_SIZE
  }
];

/**
 * Apply suppression rules to a data slice
 * Returns suppression status and appropriate aggregation level
 */
export function applySuppressionRules(
  district: string,
  tenure: TenureBucket | null,
  subject: string | null,
  n: number
): SuppressionResult {
  // Rule 1: Always check minimum cell size
  if (n < MIN_CELL_SIZE) {
    // Determine appropriate aggregation level
    let aggregationLevel: SuppressionResult['aggregationLevel'] = 'none';
    let ruleApplied = 'rule1';
    
    if (tenure && subject) {
      // Have all three dimensions, try aggregating up
      aggregationLevel = 'district_tenure';
      ruleApplied = 'rule2';
    } else if (tenure && !subject) {
      // Have district + tenure, try district only
      aggregationLevel = 'district_only';
      ruleApplied = 'rule3';
    } else if (!tenure && !subject) {
      // Only district level, must suppress
      aggregationLevel = 'none';
      ruleApplied = 'rule4';
    }
    
    return {
      isSuppressed: true,
      aggregationLevel,
      ruleApplied,
      n,
      minRequired: MIN_CELL_SIZE,
      message: `Insufficient data (n=${n}, need ≥${MIN_CELL_SIZE})`
    };
  }
  
  // n >= MIN_CELL_SIZE, check if we can publish at requested level
  // For now, if n is sufficient, allow publication at all levels
  // In practice, you'd check each level's specific n
  
  return {
    isSuppressed: false,
    aggregationLevel: 'full',
    n,
    minRequired: MIN_CELL_SIZE,
    message: `Data published (n=${n})`
  };
}

/**
 * Check suppression status for multiple aggregation levels
 * Useful for determining what data can be shown
 */
export function checkAllAggregationLevels(
  district: string,
  counts: {
    districtOnly: number;
    districtTenure: number;
    districtTenureSubject: number;
  }
): {
  districtOnly: SuppressionResult;
  districtTenure: SuppressionResult;
  districtTenureSubject: SuppressionResult;
} {
  return {
    districtOnly: applySuppressionRules(
      district, 
      null, 
      null, 
      counts.districtOnly
    ),
    districtTenure: applySuppressionRules(
      district, 
      '0-5 years', // Dummy value, actual tenure doesn't matter for check
      null,
      counts.districtTenure
    ),
    districtTenureSubject: applySuppressionRules(
      district,
      '0-5 years',
      'subject',
      counts.districtTenureSubject
    )
  };
}

/**
 * Generate suppression summary for UI
 * Explains why data is suppressed in user-friendly terms
 */
export function generateSuppressionExplanation(result: SuppressionResult): string {
  if (!result.isSuppressed) {
    return `Data is published with n=${result.n} responses.`;
  }
  
  const remaining = result.minRequired - result.n;
  
  switch (result.aggregationLevel) {
    case 'district_tenure':
      return `Showing district + tenure aggregate. Need ${remaining} more responses for subject-level detail.`;
    
    case 'district_only':
      return `Showing district aggregate only. Need ${remaining} more responses for tenure-level detail.`;
    
    case 'none':
      return `District is locked. Need ${remaining} more responses to unlock district-level data.`;
    
    default:
      return `Data suppressed for privacy (n=${result.n}, need ≥${result.minRequired}).`;
  }
}

/**
 * Apply differential privacy noise to counts
 * Adds Laplace noise with epsilon = 1.0
 * 
 * @param count - True count
 * @param epsilon - Privacy parameter (default: 1.0)
 * @param sensitivity - Query sensitivity (default: 1 for count queries)
 * @returns Noisy count
 */
export function addDPNoise(
  count: number, 
  epsilon: number = 1.0, 
  sensitivity: number = 1
): number {
  // Laplace noise: Lap(Δf/ε)
  // Where Δf is sensitivity (1 for counting queries)
  const scale = sensitivity / epsilon;
  
  // Generate Laplace noise using inverse CDF method
  const u = Math.random() - 0.5; // Uniform in [-0.5, 0.5]
  const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  
  return Math.max(0, count + noise); // Ensure non-negative
}

/**
 * Validate that DP noise was applied correctly
 * Checks that noisy count is within reasonable bounds
 */
export function validateDPNoise(
  trueCount: number,
  noisyCount: number,
  epsilon: number = 1.0,
  maxDeviation: number = 5
): {
  isValid: boolean;
  deviation: number;
  warning?: string;
} {
  const deviation = Math.abs(noisyCount - trueCount);
  
  // For epsilon=1.0, most noise should be within ±5
  // This is a heuristic check, not a strict validation
  if (deviation > maxDeviation) {
    return {
      isValid: false,
      deviation,
      warning: `Large DP noise detected: ${deviation.toFixed(1)} count difference`
    };
  }
  
  return {
    isValid: true,
    deviation
  };
}

/**
 * Document DP application for transparency
 * Returns explanation of DP method and parameters
 */
export function getDPExplanation(): string {
  return `
Differential Privacy (ε=1.0) is applied to counts for additional protection:

**Method:** Laplace mechanism
**Privacy parameter (ε):** 1.0
**Sensitivity (Δf):** 1 (for counting queries)
**Noise scale:** Lap(1/ε) = Lap(1.0)

**Properties:**
- Probabilistic privacy guarantee
- Noise magnitude: ~1/ε = 1 count on average
- Composes linearly with multiple queries
- Provides plausible deniability

**Trade-offs:**
- Slight reduction in count accuracy
- Increased privacy protection
- Transparent methodology

This follows differential privacy principles pioneered by
Dwork, McSherry, Nissim, and Smith (2006).
  `.trim();
}

/**
 * Create suppression audit log
 * Records what was suppressed and why for transparency
 */
export function createSuppressionAuditLog(
  district: string,
  tenure: TenureBucket | null,
  subject: string | null,
  n: number,
  result: SuppressionResult
): {
  timestamp: string;
  district: string;
  tenure: string | null;
  subject: string | null;
  n: number;
  suppressed: boolean;
  rule: string;
  aggregationLevel: string;
} {
  return {
    timestamp: new Date().toISOString(),
    district,
    tenure,
    subject,
    n,
    suppressed: result.isSuppressed,
    rule: result.ruleApplied || 'unknown',
    aggregationLevel: result.aggregationLevel
  };
}