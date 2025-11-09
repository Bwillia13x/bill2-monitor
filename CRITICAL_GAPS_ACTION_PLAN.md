# Critical Gaps Action Plan

## 🚨 IMMEDIATE ATTENTION REQUIRED

Based on analysis of `docs/civic-data-platform-plan.md` vs actual implementation, the following critical gaps must be addressed before production launch.

## Priority 1: Test Suite Completion (CRITICAL)

**Issue:** Test suites are 71% incomplete (862 lines vs 2,931 claimed)

### Privacy Tests (`tests/privacy.test.ts`)
**Current:** 428 lines  
**Target:** 1,437 lines  
**Missing:** 1,009 lines

**Required Additions:**
- [ ] Complete PII pattern testing (50+ test cases)
- [ ] Device fingerprinting privacy verification
- [ ] Database RLS policy enforcement tests
- [ ] Anonymous token privacy verification
- [ ] Geographic privacy verification (±2km fuzzing accuracy)
- [ ] Rate limiting privacy (no PII storage verification)
- [ ] Data retention compliance tests
- [ ] k-anonymity threshold enforcement tests

### Integrity Tests (`tests/integrity.test.ts`)
**Current:** 434 lines  
**Target:** 1,494 lines  
**Missing:** 1,060 lines

**Required Additions:**
- [ ] Merkle chain integration tests with real events
- [ ] Snapshot automation end-to-end verification
- [ ] SHA-256 integrity verification tests
- [ ] Cross-system consistency tests (CCI calc, thresholds)
- [ ] Database constraint validation tests
- [ ] Audit trail completeness verification
- [ ] Rate limiting fairness tests
- [ ] Theme clustering stability tests

**Estimated Effort:** 2-3 days  
**Owner:** Backend/Testing Team

## Priority 2: Server-Side Infrastructure (CRITICAL)

**Issue:** Missing critical backend enforcement mechanisms

### 2.1 Supabase RPC Functions
- [ ] Create `get_cci_aggregate(district, tenure, role)` with n≥20 suppression
- [ ] Create `get_privacy_compliant_stats()` for dashboard
- [ ] Create `check_rate_limit(device_hash, asn)` for backend enforcement
- [ ] Create `log_merkle_event(event_type, data)` for integrity chain

### 2.2 Database Tables
- [ ] Create `rate_limits` table (device_hash, asn, last_submission, count)
- [ ] Create `merkle_chain` table (event_id, hash, previous_hash, timestamp)
- [ ] Create `snapshot_log` table (filename, sha256_hash, created_at)
- [ ] Create `audit_log` table (table_name, operation, user_id, timestamp)

### 2.3 Row Level Security (RLS) Policies
- [ ] Enable RLS on all tables
- [ ] Create policies for anonymous submissions
- [ ] Create policies for authenticated users
- [ ] Create policies for admin/moderator access

**Estimated Effort:** 1-2 days  
**Owner:** Database/Backend Team

## Priority 3: Automation & Scheduling (CRITICAL)

**Issue:** Automation code exists but is not scheduled or integrated

### 3.1 Nightly Signing Job
- [ ] Create cron job: Daily 2:00 AM MST
- [ ] Sign previous day's Merkle chain root
- [ ] Store signature in `merkle_chain` table
- [ ] Generate audit report

### 3.2 Weekly Snapshot Automation
- [ ] Create cron job: Mondays 2:00 AM MST
- [ ] Generate CSV snapshot with all aggregations
- [ ] Generate JSON metadata
- [ ] Calculate SHA-256 hash
- [ ] Upload to storage bucket
- [ ] Update `snapshots/latest/` symlink
- [ ] Log to `snapshot_log` table

### 3.3 Data Retention Cleanup
- [ ] Create cron job: Daily 3:00 AM MST
- [ ] Purge stories older than 90 days
- [ ] Purge videos older than 180 days
- [ ] Purge raw signals older than 365 days
- [ ] Maintain aggregated theme data
- [ ] Log all purges to audit log

### 3.4 Copy Audit Integration
- [ ] Add to CI/CD pipeline
- [ ] Run on every commit
- [ ] Block commits with high-severity issues
- [ ] Generate weekly report

**Estimated Effort:** 1 day  
**Owner:** DevOps/Platform Team

## Priority 4: Production Deployment (CRITICAL)

**Issue:** No production environment exists

### 4.1 Infrastructure Setup
- [ ] Create production Supabase project
- [ ] Configure PostgreSQL 15 with extensions
- [ ] Set up storage buckets (story-videos, snapshots)
- [ ] Enable Edge Functions and Realtime
- [ ] Configure daily backups

### 4.2 CDN Configuration
- [ ] Set up Cloudflare account
- [ ] Configure DNS for civicdataplatform.ca
- [ ] Enable static asset caching (1 year)
- [ ] Configure API response caching (5 minutes)
- [ ] Enable image optimization
- [ ] Configure WAF rules

### 4.3 Monitoring & Alerting
- [ ] Set up UptimeRobot (1-minute checks)
- [ ] Configure Sentry error tracking
- [ ] Enable Web Vitals performance monitoring
- [ ] Set up database monitoring
- [ ] Configure alerting (PagerDuty/Opsgenie)

### 4.4 SSL & Security
- [ ] Configure SSL certificates
- [ ] Enable HTTPS enforcement
- [ ] Configure security headers
- [ ] Set up DDoS protection
- [ ] Implement WAF rules

**Estimated Effort:** 1-2 days  
**Owner:** DevOps/Infrastructure Team

## Priority 5: Integration & Verification (HIGH)

**Issue:** Components exist but are not integrated or verified

### 5.1 Merkle Chain Integration
- [ ] Integrate with submission pipeline
- [ ] Log all signal_submitted events
- [ ] Log all signal_validated events
- [ ] Log all aggregate_updated events
- [ ] Verify chain integrity after 100+ events

### 5.2 Rate Limiting Verification
- [ ] Test 24-hour device limit
- [ ] Test ASN throttling (10 devices/hour)
- [ ] Test user account limits
- [ ] Verify enforcement across all endpoints
- [ ] Load test with 1000+ concurrent users

### 5.3 Snapshot Verification
- [ ] Generate test snapshot
- [ ] Verify SHA-256 hash calculation
- [ ] Verify CSV format compliance
- [ ] Verify JSON metadata completeness
- [ ] Test reproducible notebook generation

### 5.4 Geo-fence Validation
- [ ] Test Alberta IP acceptance
- [ ] Test non-Alberta IP warning/rejection
- [ ] Test VPN detection
- [ ] Verify client-side and server-side checks

**Estimated Effort:** 1-2 days  
**Owner:** QA/Testing Team

## Timeline Summary

| Priority | Task | Effort | Owner |
|----------|------|--------|-------|
| P1 | Test suite completion | 2-3 days | Backend/Testing |
| P2 | Server-side infrastructure | 1-2 days | Database/Backend |
| P3 | Automation & scheduling | 1 day | DevOps |
| P4 | Production deployment | 1-2 days | DevOps |
| P5 | Integration & verification | 1-2 days | QA/Testing |
| **Total** | | **6-10 days** | |

**Optimized Timeline (parallel work):** 3-5 days

## Launch Blockers

### Must Have (Non-negotiable)
- [ ] All test suites at claimed line counts
- [ ] Supabase RPC with suppression logic
- [ ] Production environment deployed
- [ ] Merkle chain integrated and tested
- [ ] Rate limiting enforced server-side
- [ ] Snapshot automation scheduled

### Should Have (Strongly Recommended)
- [ ] Complete RLS policies
- [ ] CDN configured and tested
- [ ] Monitoring tools integrated
- [ ] Manual QA completed
- [ ] Load testing performed

### Nice to Have (Can Launch Without)
- [ ] Additional performance optimization
- [ ] Enhanced documentation
- [ ] Advanced analytics

## Verification Checklist

Before claiming "production ready":

- [ ] All cron jobs scheduled and tested
- [ ] All Supabase functions created and verified
- [ ] All RLS policies active
- [ ] All test suites passing
- [ ] Production deployment completed
- [ ] CDN caching verified
- [ ] Monitoring dashboards accessible
- [ ] Manual QA signed off
- [ ] Load test results reviewed
- [ ] Security audit completed
- [ ] Rollback plan tested
- [ ] Team trained on operations

## Communication Plan

**Internal:**
- Share this action plan with all teams
- Daily standups during completion period
- Block launch until all P1 items complete

**External:**
- Delay public launch announcement
- Update stakeholders on revised timeline
- Be transparent about quality focus

**Documentation:**
- Update implementation summaries to reflect reality
- Remove false claims about completion
- Add actual test coverage metrics

---

**Action Plan Created:** 2025-11-08  
**Target Completion:** 3-5 days  
**Launch Approval:** Requires all P1 items complete
