# A/B Testing Infrastructure - Quick Reference

## Overview

The A/B testing system uses deterministic hash-based bucketing to assign users to experiment variants consistently across sessions. All variant assignments and exposures are logged via telemetry for lift analysis.

## Architecture

### Core Hook: `useFeatureFlag`

Located in: `src/hooks/useFeatureFlag.ts`

**Key Features:**

- Deterministic bucketing (same user → same variant)
- Session-based user identification
- Automatic telemetry logging
- Environment variable gating

**Usage:**

```tsx
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function MyComponent() {
  const ctaVariant = useFeatureFlag('cta_copy_variant');
  // ctaVariant will be 'original' | 'urgent' | 'community'
  
  return <button>{ctaVariant === 'urgent' ? 'Act Now' : 'Submit'}</button>;
}
```

## Implemented Flags

### 1. CTA Copy Variant (`cta_copy_variant`)

**Variants:**

- `original`: "Add Anonymous Signal" / "Share the Teachers' Signal"
- `urgent`: "Add Your Voice Now" / "Spread The Urgency"
- `community`: "Join Fellow Teachers" / "Share With Community"

**Environment Variable:** `VITE_AB_TEST_CTA_COPY=true`

**Implementation:** `TeachersSignalThermometer.tsx`

**Telemetry Events:**

- `ab_test_exposure`: Fired when variant assigned
- `thermometer_cta_click`: Includes `ab_test_variant` property

### 2. Confetti Intensity (`confetti_intensity`)

**Variants:**

- `standard`: 32 confetti pieces
- `extra`: 64 confetti pieces (2x)
- `minimal`: 16 confetti pieces (0.5x)

**Environment Variable:** `VITE_AB_TEST_CONFETTI=true`

**Status:** Infrastructure ready, not yet implemented in component

### 3. Future Flags (Not Enabled)

- `heatmap_color_scheme`: emerald | purple | amber
- `milestone_animation`: default | subtle | dramatic

## Bucketing Algorithm

1. **User Identification:**
   - Uses `crypto.randomUUID()` stored in `sessionStorage` as `ab_test_user_id`
   - Persists across page refreshes within same session
   - New UUID for each new session

2. **Hash-Based Bucketing:**

   ```
   bucketKey = `${flagName}:${userId}`
   percentile = SHA-256(bucketKey) → number between 0-1
   variant = variants[floor(percentile / (1 / variants.length))]
   ```

3. **Distribution:**
   - For 3 variants: 0-33% → variant 0, 33-66% → variant 1, 66-100% → variant 2
   - Ensures even distribution across large sample sizes

## Telemetry Integration

### Exposure Event

```json
{
  "event_name": "ab_test_exposure",
  "properties": {
    "flag_name": "cta_copy_variant",
    "variant": "urgent",
    "user_id_hash": "a3f5b2c1"
  }
}
```

### Outcome Event (Example: CTA Click)

```json
{
  "event_name": "thermometer_cta_click",
  "properties": {
    "action": "submit",
    "total_stories": 1284,
    "progress_pct": 25.6,
    "ab_test_variant": "urgent"
  }
}
```

## Enabling Experiments

### Local Development

```bash
# .env.local
VITE_AB_TEST_CTA_COPY=true
VITE_AB_TEST_CONFETTI=true
```

### Production Deployment

1. Set environment variables in hosting platform (e.g., Lovable.dev, Vercel)
2. Rebuild application to pick up new environment variables
3. Monitor telemetry for `ab_test_exposure` events

## Analysis Guidelines

### Sample Queries (Conceptual)

**Conversion Rate by Variant:**

```sql
SELECT
  ab_test_variant,
  COUNT(DISTINCT user_id_hash) AS exposed_users,
  COUNT(*) FILTER (WHERE action = 'submit') AS conversions,
  (COUNT(*) FILTER (WHERE action = 'submit')::float / COUNT(DISTINCT user_id_hash)) * 100 AS conversion_rate_pct
FROM telemetry_events
WHERE event_name = 'thermometer_cta_click'
  AND ts >= '2025-01-01'
GROUP BY ab_test_variant;
```

**Statistical Significance:**

- Use Chi-squared test for proportion differences
- Minimum sample size: 100 conversions per variant for 80% power
- Confidence level: 95% (α = 0.05)

## Best Practices

### 1. Always Log Variant in Outcome Events

```tsx
trackEvent('my_outcome_event', {
  // ... other properties
  ab_test_variant: myVariant,
});
```

### 2. Run for Sufficient Duration

- Minimum: 1 week (capture weekly patterns)
- Recommended: 2-4 weeks (seasonal effects)
- Stop early only if variant causes critical issues

### 3. Single Metric Focus

- Primary metric: CTA click-through rate
- Secondary metrics: Share rate, milestone reach
- Avoid p-hacking (testing multiple metrics post-hoc)

### 4. Document Hypotheses

Before launching experiment:

- Hypothesis: "Urgent CTA copy will increase CTR by 15%+"
- Rationale: Creates scarcity/urgency bias
- Success criteria: >10% lift with p<0.05

## Future Enhancements

1. **Server-Side Flag Management:**
   - Move from env vars to Supabase table
   - Enable real-time flag toggling without redeploy

2. **Advanced Targeting:**
   - Segment by geography (division coverage)
   - Time-based experiments (weekday vs weekend)

3. **Multivariate Testing:**
   - Test combinations (CTA copy × confetti intensity)
   - Factorial design analysis

4. **Rollout Controls:**
   - Gradual rollout (10% → 50% → 100%)
   - Automatic rollback on metric degradation

## Troubleshooting

### Variant Not Changing

- Check environment variable is set correctly
- Clear `sessionStorage` to get new user ID
- Verify `FLAG_CONFIGS[flagName].enabled === true`

### Events Not Logging

- Check `TELEMETRY_ENABLED` in telemetry config
- Verify user hasn't enabled DNT (Do Not Track)
- Check browser console for telemetry errors

### Uneven Distribution

- Expected with small sample sizes (<100)
- Hash function guarantees 33/33/33% split at scale
- Monitor `ab_test_exposure` event counts

## Integration Checklist

To add a new A/B test:

1. [ ] Define variants in `FeatureFlags` interface
2. [ ] Add flag config to `FLAG_CONFIGS` with environment variable
3. [ ] Use `useFeatureFlag('my_flag')` in component
4. [ ] Add `ab_test_variant` to all outcome event tracking
5. [ ] Update this documentation with flag details
6. [ ] Set environment variable in deployment
7. [ ] Monitor telemetry for 24 hours to verify events
8. [ ] Run experiment for 2-4 weeks
9. [ ] Analyze results and choose winner
10. [ ] Remove flag, deploy winning variant as default

## Related Files

- `src/hooks/useFeatureFlag.ts` - Core hook implementation
- `src/lib/telemetry.ts` - Telemetry infrastructure
- `src/components/v3/TeachersSignalThermometer.tsx` - Example integration
- `.env` - Environment variable configuration

---

Last Updated: 2025-01-20
