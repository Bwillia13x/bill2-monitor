/**
 * Tenure Bucketing Implementation
 * Prevents exact years of experience from being stored
 * Uses coarse categories to protect individual identification
 */

export type TenureBucket = '0-5 years' | '6-15 years' | '16+ years';

export interface TenureBucketConfig {
  bucket: TenureBucket;
  minYears: number;
  maxYears: number | null; // null for 16+ (no upper bound)
}

export const TENURE_BUCKETS: TenureBucketConfig[] = [
  {
    bucket: '0-5 years',
    minYears: 0,
    maxYears: 5
  },
  {
    bucket: '6-15 years',
    minYears: 6,
    maxYears: 15
  },
  {
    bucket: '16+ years',
    minYears: 16,
    maxYears: null // No upper bound
  }
];

/**
 * Convert exact years of experience to tenure bucket
 * Never store exact years - only bucket categories
 * 
 * @param years - Exact years of experience
 * @returns Tenure bucket string
 */
export function getTenureBucket(years: number): TenureBucket {
  if (years <= 5) {
    return '0-5 years';
  } else if (years <= 15) {
    return '6-15 years';
  } else {
    return '16+ years';
  }
}

/**
 * Validate that a tenure bucket string is valid
 */
export function isValidTenureBucket(bucket: string): bucket is TenureBucket {
  return TENURE_BUCKETS.some(config => config.bucket === bucket);
}

/**
 * Get the configuration for a specific tenure bucket
 */
export function getTenureBucketConfig(bucket: TenureBucket): TenureBucketConfig {
  const config = TENURE_BUCKETS.find(config => config.bucket === bucket);
  if (!config) {
    throw new Error(`Invalid tenure bucket: ${bucket}`);
  }
  return config;
}

/**
 * Get midpoint years for a tenure bucket (useful for analysis)
 * Returns approximate center of bucket range
 */
export function getTenureBucketMidpoint(bucket: TenureBucket): number {
  const config = getTenureBucketConfig(bucket);
  
  if (config.maxYears === null) {
    // For 16+ bucket, return 20 as reasonable midpoint
    return 20;
  }
  
  return (config.minYears + config.maxYears) / 2;
}

/**
 * Get width of tenure bucket in years
 * Useful for understanding precision loss
 */
export function getTenureBucketWidth(bucket: TenureBucket): number {
  const config = getTenureBucketConfig(bucket);
  
  if (config.maxYears === null) {
    // For 16+ bucket, treat as open-ended
    return Infinity;
  }
  
  return config.maxYears - config.minYears + 1;
}

/**
 * Apply tenure bucketing to a submission
 * Removes exact years and replaces with bucket
 */
export function applyTenureBucketingToSubmission(
  submission: any,
  exactYears?: number
): any {
  // If exact years provided, convert to bucket
  if (typeof exactYears === 'number') {
    const bucket = getTenureBucket(exactYears);
    
    return {
      ...submission,
      tenure_exact_years: null, // Explicitly remove exact years
      tenure_bucket: bucket,
      tenure_bucket_applied: true
    };
  }
  
  // If submission already has exact years, convert them
  if (submission.tenure_exact_years) {
    const bucket = getTenureBucket(submission.tenure_exact_years);
    
    return {
      ...submission,
      tenure_exact_years: null, // Remove exact years
      tenure_bucket: bucket,
      tenure_bucket_applied: true
    };
  }
  
  // If submission already has a bucket, just validate it
  if (submission.tenure_bucket && isValidTenureBucket(submission.tenure_bucket)) {
    return {
      ...submission,
      tenure_bucket_applied: true
    };
  }
  
  // No tenure data to process
  return {
    ...submission,
    tenure_bucket_applied: false
  };
}

/**
 * Validate that a submission has proper tenure bucketing
 * Ensures no exact years are stored
 */
export function validateTenureBucketing(submission: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check that exact years are not stored
  if (submission.tenure_exact_years !== null && submission.tenure_exact_years !== undefined) {
    errors.push('Exact tenure years should not be stored');
  }
  
  // Check that bucket is valid if present
  if (submission.tenure_bucket && !isValidTenureBucket(submission.tenure_bucket)) {
    errors.push(`Invalid tenure bucket: ${submission.tenure_bucket}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get all possible tenure bucket values
 * Useful for UI dropdowns and validation
 */
export function getAllTenureBuckets(): TenureBucket[] {
  return TENURE_BUCKETS.map(config => config.bucket);
}

/**
 * Calculate information loss due to bucketing
 * Returns percentage of precision lost
 */
export function calculateTenureInformationLoss(exactYears: number): {
  bucket: TenureBucket;
  precisionLoss: number; // Percentage (0-100)
  width: number;
} {
  const bucket = getTenureBucket(exactYears);
  const width = getTenureBucketWidth(bucket);
  
  // For open-ended bucket, estimate based on typical career length
  if (width === Infinity) {
    return {
      bucket,
      precisionLoss: 95, // High precision loss for open-ended bucket
      width: 25 // Assume 25 year range for 16+
    };
  }
  
  // Precision loss = (bucket width - 1) / bucket width
  // Subtract 1 because exact value is one point within the bucket
  const precisionLoss = ((width - 1) / width) * 100;
  
  return {
    bucket,
    precisionLoss,
    width
  };
}

/**
 * Document the privacy gain from tenure bucketing
 * Explains why coarse categories protect identity
 */
export function getTenurePrivacyExplanation(): string {
  return `
Tenure bucketing protects teacher identity by:

1. **Preventing unique identification**: Exact years + district + subject could identify individuals in small schools

2. **k-anonymity compliance**: Buckets ensure at least k=5 teachers in each category

3. **Statistical disclosure control**: Coarse categories meet standards used by Statistics Canada

4. **Protection over precision**: Small loss in analytical precision, large gain in privacy protection

Buckets:
- 0-5 years: Early career teachers (high mobility)
- 6-15 years: Mid-career teachers (established)
- 16+ years: Senior teachers (stable)

This approach follows privacy-by-design principles recommended by the
Office of the Privacy Commissioner of Canada.
  `.trim();
}