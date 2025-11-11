import { useMemo } from 'react';
import { trackEvent } from '@/lib/telemetry';

/**
 * Feature flag configuration for A/B testing
 * Each flag defines a set of possible variant values that users can be bucketed into
 */
interface FeatureFlags {
    cta_copy_variant: 'original' | 'urgent' | 'community';
    confetti_intensity: 'standard' | 'extra' | 'minimal';
    heatmap_color_scheme: 'emerald' | 'purple' | 'amber';
    milestone_animation: 'default' | 'subtle' | 'dramatic';
}

type FeatureFlagName = keyof FeatureFlags;

/**
 * Hash a string to a number between 0 and 1 using SHA-256
 * @param input - String to hash (typically userId + flagName)
 * @returns Promise resolving to percentile value (0-1)
 */
async function hashToPercentile(input: string): Promise<number> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // Use first 4 bytes to create a number between 0 and 1
    const value = hashArray.slice(0, 4).reduce((acc, byte, idx) => {
        return acc + byte * Math.pow(256, idx);
    }, 0);

    return value / (Math.pow(256, 4) - 1);
}

/**
 * Assign a variant based on percentile value
 * Ensures even distribution across all variants
 * @param percentile - Value between 0 and 1 from hash function
 * @param variants - Array of possible variant values
 * @returns Assigned variant
 */
function assignVariant<T extends string>(
    percentile: number,
    variants: readonly T[]
): T {
    const bucketSize = 1 / variants.length;
    const bucketIndex = Math.floor(percentile / bucketSize);
    return variants[Math.min(bucketIndex, variants.length - 1)];
}

/**
 * Configuration for each feature flag
 * Defines available variants, default value, and whether the flag is enabled
 */
const FLAG_CONFIGS: {
    [K in FeatureFlagName]: {
        variants: readonly FeatureFlags[K][];
        defaultVariant: FeatureFlags[K];
        enabled: boolean;
    };
} = {
    cta_copy_variant: {
        variants: ['original', 'urgent', 'community'] as const,
        defaultVariant: 'original',
        enabled: import.meta.env.VITE_AB_TEST_CTA_COPY === 'true',
    },
    confetti_intensity: {
        variants: ['standard', 'extra', 'minimal'] as const,
        defaultVariant: 'standard',
        enabled: import.meta.env.VITE_AB_TEST_CONFETTI === 'true',
    },
    heatmap_color_scheme: {
        variants: ['emerald', 'purple', 'amber'] as const,
        defaultVariant: 'emerald',
        enabled: false, // Not yet enabled
    },
    milestone_animation: {
        variants: ['default', 'subtle', 'dramatic'] as const,
        defaultVariant: 'default',
        enabled: false, // Not yet enabled
    },
};

/**
 * Get or create a stable user identifier for bucketing
 * Uses sessionStorage to persist identity across page reloads within a session
 * @returns Stable UUID for this user's session
 */
function getUserIdentifier(): string {
    // Check for stored identifier
    let identifier = sessionStorage.getItem('ab_test_user_id');

    if (!identifier) {
        // Generate a random identifier for this session
        identifier = crypto.randomUUID();
        sessionStorage.setItem('ab_test_user_id', identifier);
    }

    return identifier;
}

/**
 * Hook to get feature flag variant assignment
 * 
 * Uses deterministic hash-based bucketing to ensure consistent variant assignment
 * for the same user across sessions. Logs experiment exposure events to telemetry.
 * 
 * @param flagName - Name of the feature flag
 * @returns The assigned variant value
 * 
 * @example
 * const ctaCopy = useFeatureFlag('cta_copy_variant');
 * // ctaCopy will be 'original' | 'urgent' | 'community'
 */
export function useFeatureFlag<K extends FeatureFlagName>(
    flagName: K
): FeatureFlags[K] {
    const variant = useMemo(() => {
        const config = FLAG_CONFIGS[flagName];

        // If flag is not enabled, return default
        if (!config.enabled) {
            return config.defaultVariant;
        }

        // Get user identifier for bucketing
        const userId = getUserIdentifier();
        const bucketKey = `${flagName}:${userId}`;

        // Asynchronously compute variant (will use default on first render)
        let assignedVariant = config.defaultVariant;

        hashToPercentile(bucketKey).then((percentile) => {
            assignedVariant = assignVariant(percentile, config.variants);

            // Log experiment exposure
            trackEvent('ab_test_exposure', {
                flag_name: flagName,
                variant: assignedVariant,
                user_id_hash: userId.substring(0, 8), // First 8 chars for tracking
            });
        });

        return assignedVariant;
    }, [flagName]);

    return variant;
}

/**
 * Non-React utility for getting feature flag variants
 * Use this in contexts where React hooks cannot be used (e.g., utility functions)
 * Does NOT automatically log exposure events
 * 
 * @param flagName - Name of the feature flag to retrieve
 * @returns Promise resolving to assigned variant
 */
export async function getFeatureFlagVariant<K extends FeatureFlagName>(
    flagName: K
): Promise<FeatureFlags[K]> {
    const config = FLAG_CONFIGS[flagName];

    if (!config.enabled) {
        return config.defaultVariant;
    }

    const userId = getUserIdentifier();
    const bucketKey = `${flagName}:${userId}`;
    const percentile = await hashToPercentile(bucketKey);
    const variant = assignVariant(percentile, config.variants);

    // Log experiment exposure
    trackEvent('ab_test_exposure', {
        flag_name: flagName,
        variant,
        user_id_hash: userId.substring(0, 8),
    });

    return variant;
}
