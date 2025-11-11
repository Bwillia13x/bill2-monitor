# Phase 3 Analytics Deployment Guide

**Date**: November 11, 2025  
**Project**: Digital Strike - Bill 2 Monitor  
**Phase**: Analytics Integration & Intelligence

---

## 🎯 Overview

This guide walks through deploying the Phase 3 analytics infrastructure to production. The deployment includes:

- Database migration (4 tables + 3 RPC functions)
- TypeScript type regeneration
- Code cleanup (removing temporary type assertions)
- Supabase realtime configuration
- Testing and validation

---

## ⚠️ Prerequisites

Before beginning deployment:

- [ ] Admin access to Supabase dashboard (`@digitalstrike.ca` email)
- [ ] Database backup completed
- [ ] All tests passing locally (295 tests)
- [ ] Code reviewed and approved
- [ ] Staging environment tested (if available)

---

## 📋 Deployment Steps

### Step 1: Apply Database Migration

**Option A: Via Supabase Dashboard (Recommended)**

1. Navigate to: <https://supabase.com/dashboard/project/hshddfrqpyjenatftqpv>
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy contents of `supabase/migrations/20251111_analytics_tables.sql`
5. Paste into editor and click **Run**
6. Verify output shows successful table/function creation

**Option B: Via Supabase CLI (Requires Auth)**

```bash
# Authenticate
supabase login

# Link project
supabase link --project-ref hshddfrqpyjenatftqpv

# Push migration
supabase db push
```

**Verify Migration Success:**

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'telemetry_events',
    'feature_flags', 
    'experiment_exposures',
    'funnel_events'
  );
-- Should return 4 rows

-- Check RPC functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_ab_test_conversion_rates',
    'get_funnel_dropoff',
    'get_heatmap_engagement_cohorts'
  );
-- Should return 3 rows

-- Check seed data
SELECT flag_key, flag_name, enabled 
FROM feature_flags;
-- Should return 3 A/B test configurations
```

---

### Step 2: Enable Realtime Subscriptions

**Via Supabase Dashboard:**

1. Go to **Database** → **Replication**
2. Enable realtime for these tables:
   - ✅ `telemetry_events`
   - ✅ `feature_flags`
   - ✅ `experiment_exposures`
   - ✅ `funnel_events`

**Verify Realtime Configuration:**

1. Go to **Database** → **Tables**
2. For each table above, check "Realtime" column shows "Enabled"

---

### Step 3: Configure Row Level Security (RLS)

The migration includes RLS policies, but verify they're active:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'telemetry_events',
    'feature_flags',
    'experiment_exposures', 
    'funnel_events'
  );
-- All should show rowsecurity = true

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'telemetry_events',
    'feature_flags',
    'experiment_exposures',
    'funnel_events'
  );
-- Should show policies for each table
```

**Expected Policies:**

- `telemetry_events`: INSERT for authenticated + anon, SELECT for admins only
- `feature_flags`: SELECT for all, INSERT/UPDATE/DELETE for admins only
- `experiment_exposures`: INSERT for authenticated + anon, SELECT for admins
- `funnel_events`: INSERT for authenticated + anon, SELECT for admins

---

### Step 4: Regenerate TypeScript Types

**Option A: Using Supabase CLI**

```bash
# Generate types from remote database
supabase gen types typescript --linked > src/types/database.ts
```

**Option B: Using npx (if CLI not authenticated)**

```bash
# Using project ref and anon key
npx supabase gen types typescript \
  --project-id hshddfrqpyjenatftqpv \
  --schema public > src/types/database.ts
```

**Option C: Manual Download from Dashboard**

1. Go to **Settings** → **API**
2. Scroll to **Project API keys**
3. Click **Generate Types**
4. Copy TypeScript definitions
5. Save to `src/types/database.ts`

**Verify Type Generation:**

```bash
# Check file was created/updated
ls -lh src/types/database.ts

# Verify it contains new tables
grep -E "(telemetry_events|feature_flags|experiment_exposures|funnel_events)" src/types/database.ts
```

---

### Step 5: Update Type Imports

Replace the temporary `as any` assertions with proper types.

**Files to Update (18 instances):**

1. **src/components/admin/FeatureFlagDashboard.tsx** (3 instances)
2. **src/components/admin/AnalyticsInsightsPanel.tsx** (7 instances)
3. **src/components/admin/AnalyticsDebugPanel.tsx** (6 instances)
4. **src/components/admin/RealTimeAnalyticsDashboard.tsx** (12 instances)

**Example Replacement:**

```typescript
// Before
const { data } = await supabase
  .from('telemetry_events' as any)
  .select('*');

// After (once types are regenerated)
const { data } = await supabase
  .from('telemetry_events')
  .select('*');
```

**Automated Find & Replace:**

```bash
# Find all instances
grep -r "as any" src/components/admin/

# After manual verification, run tests
npm test
```

---

### Step 6: Test Analytics Functionality

**Manual Testing Checklist:**

1. **Feature Flags:**
   - [ ] Navigate to `/admin/feature-flags`
   - [ ] Verify authentication (redirect if not admin)
   - [ ] See 3 seed A/B tests loaded
   - [ ] Toggle flag enabled/disabled
   - [ ] See conversion rates displayed

2. **Real-Time Dashboard:**
   - [ ] Dashboard shows "Live" badge (green with pulse)
   - [ ] Open dev tools → Network → WS tab
   - [ ] See WebSocket connection to Supabase
   - [ ] Create a test event (click "Test Event" button)
   - [ ] See event count increment

3. **Analytics Insights:**
   - [ ] Insights panel loads without errors
   - [ ] Generate sample data if empty
   - [ ] See insights categorized by type
   - [ ] Verify recommendations are actionable

4. **Debug Panel:**
   - [ ] Click "Start Recording" on Live Events tab
   - [ ] Trigger events (navigate, submit signal)
   - [ ] See events appear in real-time
   - [ ] Switch to Database Events tab
   - [ ] Click "Refresh" and see persisted events
   - [ ] Check Funnel Events for sign creation steps
   - [ ] Check A/B Exposures for experiment assignments

**Automated Testing:**

```bash
# Run full test suite
npm test

# Expected: 295 tests passing, 0 failures
```

---

### Step 7: Validate Data Flow

**Test End-to-End Event Flow:**

```sql
-- 1. Trigger an event in the app (e.g., submit signal)

-- 2. Check telemetry_events table
SELECT event_name, session_id, created_at 
FROM telemetry_events 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. If using sign creation, check funnel_events
SELECT funnel_name, step_name, step_order, created_at 
FROM funnel_events 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. If A/B test active, check exposures
SELECT flag_key, variant, session_id, created_at 
FROM experiment_exposures 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Test RPC functions
SELECT * FROM get_ab_test_conversion_rates(
  'enhanced_signal_form', 
  'signal_submitted'
);

SELECT * FROM get_funnel_dropoff('sign_creation');

SELECT * FROM get_heatmap_engagement_cohorts();
```

---

### Step 8: Monitor and Validate

**Performance Monitoring:**

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'telemetry_events',
    'feature_flags',
    'experiment_exposures',
    'funnel_events'
  )
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check row counts
SELECT 
  'telemetry_events' AS table_name, 
  COUNT(*) AS row_count 
FROM telemetry_events
UNION ALL
SELECT 'feature_flags', COUNT(*) FROM feature_flags
UNION ALL
SELECT 'experiment_exposures', COUNT(*) FROM experiment_exposures
UNION ALL
SELECT 'funnel_events', COUNT(*) FROM funnel_events;
```

**Realtime Connection Health:**

1. Open browser dev tools → Console
2. Look for: `[RealTime] Connected to telemetry events`
3. Should see 3 subscription success messages
4. Monitor for connection drops or errors

---

## 🔧 Troubleshooting

### Issue: RPC Functions Not Found

**Symptoms:**

```
Argument of type '"get_ab_test_conversion_rates"' is not assignable to parameter...
```

**Solution:**

```bash
# Regenerate types
supabase gen types typescript --linked > src/types/database.ts

# Restart dev server
npm run dev
```

### Issue: Realtime Not Working

**Symptoms:**

- Dashboard shows "Connecting..." forever
- No WebSocket connection in Network tab

**Solution:**

1. Check Supabase Dashboard → Database → Replication
2. Ensure realtime enabled for all 4 tables
3. Check browser console for errors
4. Verify anon key has correct permissions

### Issue: RLS Blocking Inserts

**Symptoms:**

```
new row violates row-level security policy
```

**Solution:**

```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'telemetry_events';

-- Temporarily disable RLS for testing (CAUTION)
ALTER TABLE telemetry_events DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing policy
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
```

### Issue: Type Errors After Migration

**Symptoms:**

```
Property 'flag_key' does not exist on type...
```

**Solution:**

1. Delete `src/types/database.ts`
2. Regenerate types
3. Clear TypeScript cache: `rm -rf node_modules/.vite`
4. Restart dev server

---

## 🎉 Post-Deployment Validation

### Success Criteria

- [ ] All 4 tables created and accessible
- [ ] 3 RPC functions working
- [ ] 3 seed A/B tests present
- [ ] Realtime subscriptions active (3 channels)
- [ ] Admin dashboard loads without errors
- [ ] Real-time metrics updating
- [ ] Insights generating correctly
- [ ] Debug panel capturing events
- [ ] 295 tests passing
- [ ] No TypeScript errors
- [ ] No console errors in production

### Performance Benchmarks

- [ ] Admin dashboard loads < 2 seconds
- [ ] Realtime events arrive < 500ms after trigger
- [ ] Insights generation < 3 seconds
- [ ] RPC queries return < 1 second
- [ ] No memory leaks in realtime subscriptions

---

## 📊 Monitoring & Maintenance

### Daily Checks

- Monitor table growth rates
- Check for failed realtime connections
- Review error logs in Supabase dashboard
- Validate A/B test sample sizes

### Weekly Maintenance

- Archive old telemetry events (>30 days)
- Review and update A/B test configurations
- Analyze insights trends
- Optimize slow queries

### Monthly Tasks

- Database vacuum and analyze
- Review RLS policies
- Update statistical significance thresholds
- Performance tuning

---

## 🔐 Security Notes

- Admin routes protected by email domain check (`@digitalstrike.ca`)
- RLS policies prevent unauthorized data access
- Realtime subscriptions respect RLS
- Anon users can INSERT but not SELECT analytics data
- Admin-only SELECT ensures privacy compliance

---

## 📚 Additional Resources

- **Database Schema**: `supabase/migrations/20251111_analytics_tables.sql`
- **Type Definitions**: `src/types/analytics.ts`
- **Implementation Summary**: `PHASE3_ANALYTICS_COMPLETE.md`
- **Supabase Docs**: <https://supabase.com/docs>
- **Realtime Guide**: <https://supabase.com/docs/guides/realtime>

---

**Deployment Prepared By**: AI Assistant  
**Last Updated**: November 11, 2025  
**Status**: Ready for Production Deployment
