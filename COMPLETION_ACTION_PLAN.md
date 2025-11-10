# Completion Action Plan - Digital Strike Platform

**Created:** November 10, 2025  
**Target Completion:** November 25, 2025 (15 days)  
**Status:** 🔴 ACTIVE - Critical Work Required

---

## Executive Summary

This document provides a **practical, actionable plan** to complete the remaining 20-25% of work required to reach true "production ready" status. Based on the Development Plan Report, we identified 4 priority levels of work.

**Current State:** 75-80% complete, build succeeds, V3 excellent  
**Target State:** 100% complete, tests passing, production deployed, automation verified  
**Estimated Effort:** 40-50 work hours (5-7 work days with focused team)

---

## Critical Path: 5 Days to Launch

### Day 1: Fix Test Suite (8 hours)

#### Morning: Expand Privacy Tests (4 hours)

**Goal:** Add missing test cases to reach 1,400+ lines

**File:** `tests/privacy.test.ts`

**Tasks:**
1. Add comprehensive phone number tests
   ```typescript
   // Add these test cases:
   - US phone variations: (123) 456-7890, 123-456-7890, 123.456.7890
   - International: +1-123-456-7890, +44 20 1234 5678
   - Edge cases: phone numbers in sentences
   ```

2. Add school name detection tests
   ```typescript
   // Test patterns:
   - "I teach at William Aberhart High School"
   - "Our school, Ernest Manning, has..."
   - "Western Canada High School students..."
   ```

3. Add ID number detection
   ```typescript
   // Patterns to detect:
   - Social Security: 123-45-6789
   - Alberta Health: 1234-5678-9012
   - Employee IDs: EMP-12345, STF123456
   - Credit cards: 4532-1234-5678-9010
   ```

4. Add address detection
   ```typescript
   // Patterns:
   - "123 Main St, Calgary AB T2P 1A1"
   - "1234 Jasper Ave, Edmonton"
   - Full addresses with postal codes
   ```

**Expected Output:**
- Privacy test file: 822 → 1,400+ lines
- Pass rate: 54% → 95%+

#### Afternoon: Expand Integrity Tests (4 hours)

**Goal:** Add missing test cases to reach 1,400+ lines

**File:** `tests/integrity.test.ts`

**Tasks:**
1. Add Merkle chain integration tests (mock)
   ```typescript
   describe('Merkle Chain Integration', () => {
     it('should log submission events')
     it('should log validation events')  
     it('should log aggregate updates')
     it('should verify chain integrity')
     it('should detect tampering')
   })
   ```

2. Add snapshot automation tests (mock Supabase)
   ```typescript
   describe('Snapshot Generation', () => {
     it('should generate CSV with correct format')
     it('should calculate SHA-256 hash')
     it('should create metadata JSON')
     it('should update latest symlink')
     it('should log to snapshot_log table')
   })
   ```

3. Add cross-system consistency tests
   ```typescript
   describe('System Consistency', () => {
     it('should calculate CCI identically across components')
     it('should enforce n=20 threshold uniformly')
     it('should use same privacy threshold everywhere')
   })
   ```

**Expected Output:**
- Integrity test file: 434 → 1,400+ lines
- All tests passing with mocked dependencies

---

### Day 2: Backend Integration (8 hours)

#### Morning: Merkle Chain Integration (4 hours)

**Goal:** Connect Merkle chain to actual submission flow

**Files to Modify:**
- `src/pages/Index.tsx` or submission handler
- `src/lib/integrity/merkleChainDB.ts` (already exists)

**Implementation:**

1. Import Merkle chain in submission handler
   ```typescript
   import { MerkleChainDB } from '@/lib/integrity/merkleChainDB';
   ```

2. Add event logging after successful submission
   ```typescript
   const handleSubmit = async (data: SubmissionData) => {
     // Existing submission logic...
     
     // NEW: Log to Merkle chain
     try {
       const merkleChain = new MerkleChainDB();
       await merkleChain.addEvent({
         type: 'signal_submitted',
         timestamp: new Date().toISOString(),
         data: {
           district: data.district,
           // Don't log PII, just metadata
         }
       });
     } catch (error) {
       console.error('Merkle chain logging failed:', error);
       // Don't block submission if logging fails
     }
   };
   ```

3. Test with 10 submissions
4. Verify chain integrity
5. Test tampering detection

#### Afternoon: Verify Database Functions (4 hours)

**Goal:** Ensure all RPC functions exist and work

**Tasks:**

1. **Check Supabase Project**
   - Log into production Supabase
   - Navigate to Database → Functions
   - Verify these exist:
     - `get_cci_aggregate(district, min_n)`
     - `get_privacy_compliant_stats()`
     - `check_rate_limit(device_hash)`
     - `log_merkle_event(event_type, data)`

2. **Test RPC Functions** (if missing, create them)
   
   Create `get_cci_aggregate` if needed:
   ```sql
   CREATE OR REPLACE FUNCTION get_cci_aggregate(
     p_district TEXT DEFAULT NULL,
     p_min_n INTEGER DEFAULT 20
   )
   RETURNS TABLE (
     district TEXT,
     n_signals INTEGER,
     avg_cci NUMERIC,
     ci_lower NUMERIC,
     ci_upper NUMERIC
   ) AS $$
   BEGIN
     RETURN QUERY
     SELECT 
       s.district,
       COUNT(*)::INTEGER as n_signals,
       ROUND(AVG(10 * (0.4 * s.job_satisfaction + 0.6 * (10 - s.work_exhaustion))), 1) as avg_cci,
       ROUND(AVG(10 * (0.4 * s.job_satisfaction + 0.6 * (10 - s.work_exhaustion))) - 1.96 * STDDEV(10 * (0.4 * s.job_satisfaction + 0.6 * (10 - s.work_exhaustion))) / SQRT(COUNT(*)), 1) as ci_lower,
       ROUND(AVG(10 * (0.4 * s.job_satisfaction + 0.6 * (10 - s.work_exhaustion))) + 1.96 * STDDEV(10 * (0.4 * s.job_satisfaction + 0.6 * (10 - s.work_exhaustion))) / SQRT(COUNT(*)), 1) as ci_upper
     FROM cci_submissions s
     WHERE (p_district IS NULL OR s.district = p_district)
       AND s.created_at >= NOW() - INTERVAL '30 days'
     GROUP BY s.district
     HAVING COUNT(*) >= p_min_n;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

3. **Verify RLS Policies**
   - Check all tables have RLS enabled
   - Test anonymous user permissions
   - Test rate limiting queries

4. **Test n≥20 Suppression**
   - Create test data with n=15, n=20, n=25
   - Verify n=15 returns NULL
   - Verify n≥20 returns data

---

### Day 3: Production Deployment Setup (8 hours)

#### Morning: Infrastructure (4 hours)

**Goal:** Create production environment

**Tasks:**

1. **Supabase Production Project**
   - Create new project: "bill2-monitor-prod"
   - Note URL, API keys
   - Configure database (PostgreSQL 15)
   - Enable extensions: pgcrypto, uuid-ossp

2. **Apply Migrations**
   ```bash
   # All 17 migration files
   cd supabase/migrations
   # Apply in order via Supabase dashboard SQL editor
   ```

3. **Storage Buckets**
   - Create bucket: `story-videos` (100MB limit, private)
   - Create bucket: `snapshots` (50MB limit, public)

4. **Environment Variables**
   - Update `.env.production`:
     ```
     VITE_SUPABASE_URL=https://xxx.supabase.co
     VITE_SUPABASE_PROJECT_ID=xxx
     VITE_SUPABASE_PUBLISHABLE_KEY=xxx
     ```

#### Afternoon: Deployment (4 hours)

**Goal:** Deploy frontend to production

**Tasks:**

1. **Build Production Bundle**
   ```bash
   npm run build
   # Verify dist/ folder created
   # Check bundle size
   ```

2. **Deploy to Vercel/Netlify**
   - Connect GitHub repo
   - Configure build command: `npm run build`
   - Configure output directory: `dist`
   - Add environment variables
   - Deploy

3. **Configure Custom Domain** (if available)
   - Add domain to Vercel/Netlify
   - Update DNS records
   - Enable SSL

4. **Verify Deployment**
   - Visit production URL
   - Test homepage loads
   - Submit test signal
   - Check database for submission

---

### Day 4: Automation & Testing (8 hours)

#### Morning: Enable Automation (4 hours)

**Goal:** Verify all scheduled jobs work

**Tasks:**

1. **GitHub Secrets Configuration**
   - Go to repo Settings → Secrets
   - Add production secrets:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_SUPABASE_SERVICE_ROLE_KEY`
     - `VITE_SIGNING_KEY_SEED`

2. **Test Nightly Signing**
   ```bash
   # Run manually first
   npm run automation:nightly-signing
   # Should sign yesterday's data
   # Check logs for success
   ```

3. **Test Weekly Snapshot**
   ```bash
   npm run automation:weekly-snapshot
   # Should generate CSV, JSON, notebook
   # Verify SHA-256 hash
   # Check files created
   ```

4. **Test Retention Cleanup**
   ```bash
   npm run automation:retention-cleanup
   # Should purge old stories
   # Verify aggregated themes preserved
   ```

5. **Verify GitHub Actions**
   - Manually trigger workflow
   - Check Actions tab for results
   - Review logs for errors

#### Afternoon: Load Testing (4 hours)

**Goal:** Verify system handles traffic

**Tasks:**

1. **Install Load Testing Tool**
   ```bash
   npm install -g artillery
   # or use k6, locust, etc.
   ```

2. **Create Test Scenario**
   ```yaml
   # load-test.yml
   config:
     target: 'https://your-production-url.com'
     phases:
       - duration: 60
         arrivalRate: 10  # 10 users/sec
       - duration: 120
         arrivalRate: 50  # 50 users/sec
   scenarios:
     - name: 'Submit Signal'
       flow:
         - get:
             url: '/'
         - post:
             url: '/api/submit'
             json:
               job_satisfaction: 3
               work_exhaustion: 8
               district: 'Calgary 1'
   ```

3. **Run Load Test**
   ```bash
   artillery run load-test.yml
   ```

4. **Analyze Results**
   - Check response times
   - Verify error rate <1%
   - Check database performance
   - Monitor rate limiting

---

### Day 5: QA & Launch Prep (8 hours)

#### Morning: Manual QA (4 hours)

**Goal:** Test all user flows

**Checklist:**

**Homepage**
- [ ] Page loads in <3 seconds
- [ ] Big number displays correctly
- [ ] Two CTAs visible and working
- [ ] Countdown accurate
- [ ] Methodology modal opens

**Submission Flow**
- [ ] Click "Add Anonymous Signal"
- [ ] Slider works (0-100)
- [ ] Optional fields (role, district)
- [ ] Submit button works
- [ ] Confetti animation plays
- [ ] Progress card shows district status
- [ ] Share modal auto-opens

**Share Flow**
- [ ] "Share With 3 Colleagues" modal
- [ ] Native share works (mobile)
- [ ] Copy link works
- [ ] Social media buttons work
- [ ] Prefilled message correct

**District Progress**
- [ ] Unlocked districts show count
- [ ] Near-threshold shows "X/20"
- [ ] Locked districts show lock icon
- [ ] Progress bars animate

**Press Kit**
- [ ] Press PNG generates
- [ ] Download works
- [ ] Image quality good (1200×630)
- [ ] Content accurate

**Other Pages**
- [ ] /methods-v1.0 loads
- [ ] /advisory-board loads
- [ ] /press loads
- [ ] /v2 loads (legacy)

**Cross-Browser**
- [ ] Chrome (desktop & mobile)
- [ ] Firefox
- [ ] Safari (desktop & mobile)
- [ ] Edge

**Accessibility**
- [ ] Keyboard navigation works
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Screen reader friendly (test with NVDA/VoiceOver)
- [ ] ARIA labels present
- [ ] Contrast ratios ≥4.5:1

#### Afternoon: Final Verification (4 hours)

**Goal:** Confirm all systems ready

**Tasks:**

1. **Performance Check**
   - Run Lighthouse audit
   - Target: LCP <2.5s, CLS <0.1, FID <100ms
   - Check Web Vitals in production

2. **Security Scan**
   - Test for SQL injection
   - Verify CORS configuration
   - Check API rate limiting
   - Test PII detection accuracy

3. **Monitoring Setup**
   - Configure UptimeRobot (free tier)
   - Set up Sentry error tracking
   - Add Google Analytics (privacy-preserving)
   - Create status page

4. **Documentation Review**
   - Update README with production URL
   - Document known issues
   - Create runbook for common issues
   - Update DEVELOPMENT_PLAN_REPORT.md with completion status

---

## Post-Launch: Week 2 (Monitoring)

### Day 6-7: Soft Launch

**Goals:**
- [ ] Enable production URL (don't announce yet)
- [ ] Invite 10-20 beta testers
- [ ] Monitor error logs hourly
- [ ] Fix critical bugs within 4 hours
- [ ] Verify automation runs successfully

### Day 8-10: Full Launch

**Goals:**
- [ ] Public announcement
- [ ] Press outreach (use press kit)
- [ ] Social media posts
- [ ] Monitor performance continuously
- [ ] Respond to user feedback
- [ ] Generate first weekly snapshot

### Day 11-15: Stabilization

**Goals:**
- [ ] Fix any reported bugs
- [ ] Optimize based on real usage
- [ ] Refine copy based on feedback
- [ ] Review analytics data
- [ ] Plan next iteration

---

## Task Assignment & Ownership

| Task Category | Owner | Hours | Priority |
|--------------|-------|-------|----------|
| Test Suite Expansion | QA/Backend | 8 | P1 |
| Merkle Chain Integration | Backend | 4 | P1 |
| Database Verification | Backend/DBA | 4 | P1 |
| Production Setup | DevOps | 4 | P1 |
| Deployment | DevOps | 4 | P1 |
| Automation | DevOps | 4 | P1 |
| Load Testing | QA | 4 | P2 |
| Manual QA | QA | 4 | P1 |
| Final Verification | All | 4 | P1 |
| **Total** | | **40 hours** | |

---

## Success Metrics

### Code Quality
- [ ] Test coverage: 95%+ of critical paths
- [ ] Test pass rate: >95% (down from 45% fail rate)
- [ ] No TypeScript errors
- [ ] No console errors in production

### Performance
- [ ] LCP: <2.5s (mobile)
- [ ] CLS: <0.1
- [ ] FID: <100ms
- [ ] Bundle size: <500KB initial

### Functionality
- [ ] Merkle chain logging all events
- [ ] Nightly signing completing successfully
- [ ] Weekly snapshots generating
- [ ] Retention cleanup purging correctly
- [ ] Rate limiting enforcing 24-hour limits

### Production
- [ ] Site accessible at production URL
- [ ] SSL certificate valid
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Error tracking working

---

## Contingency Plans

### If Tests Can't Be Fixed in 1 Day
- **Plan B:** Document known test failures
- **Plan C:** Fix critical tests only (PII detection)
- **Impact:** Launch with known issues, fix post-launch

### If Merkle Chain Integration Blocked
- **Plan B:** Launch without Merkle chain, add later
- **Impact:** No tamper detection initially
- **Mitigation:** Enable in Week 2

### If Production Deployment Fails
- **Plan B:** Use staging environment for soft launch
- **Plan C:** Delay launch by 3-5 days
- **Impact:** Miss target date but ensure quality

### If Load Testing Shows Issues
- **Plan B:** Optimize database queries
- **Plan C:** Add caching layer
- **Impact:** May need to scale infrastructure

---

## Communication Plan

### Daily Standups (During 5-Day Sprint)
- **Time:** 9:00 AM daily
- **Duration:** 15 minutes
- **Agenda:** Yesterday, today, blockers

### Status Updates
- **Frequency:** End of each day
- **Format:** Email to stakeholders
- **Content:** Tasks completed, tasks remaining, blockers

### Launch Announcement
- **Date:** After Day 5 QA complete
- **Channels:** Email, social media, press contacts
- **Message:** "Production ready, verified, tested"

---

## Definition of Done

### For Each Task
- [ ] Code written and reviewed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Deployed to production
- [ ] Verified working

### For Launch
- [ ] All P1 tasks complete
- [ ] All tests passing
- [ ] Production deployed and verified
- [ ] Monitoring active
- [ ] Documentation accurate
- [ ] Stakeholders informed

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Tests take longer to fix | Medium | Medium | Start with critical tests first |
| Database migration issues | Low | High | Test on staging first |
| Deployment fails | Low | High | Have rollback plan ready |
| Performance issues | Medium | Medium | Load test before launch |
| Team availability | Medium | High | Cross-train team members |

---

## Next Steps (Start Today)

1. **Immediate (Today)**
   - [ ] Assign tasks to team members
   - [ ] Create GitHub issues for each task
   - [ ] Schedule daily standups
   - [ ] Set up project board

2. **Day 1 (Tomorrow)**
   - [ ] Start test suite expansion
   - [ ] Begin Merkle chain integration
   - [ ] Review database functions

3. **Communication**
   - [ ] Email stakeholders with timeline
   - [ ] Share this action plan
   - [ ] Set expectations for 15-day completion

---

## Appendix: Quick Reference Commands

### Build & Test
```bash
npm install          # Install dependencies
npm run build        # Build production bundle
npm test            # Run test suite
npm run lint        # Run linter
```

### Automation
```bash
npm run automation:nightly-signing    # Sign yesterday's data
npm run automation:weekly-snapshot    # Generate snapshot
npm run automation:retention-cleanup  # Clean old data
```

### Deployment
```bash
npm run build                        # Build for production
vercel --prod                        # Deploy to Vercel
# or
netlify deploy --prod               # Deploy to Netlify
```

### Database
```bash
# Apply migrations via Supabase dashboard
# OR use Supabase CLI:
supabase db push                    # Push migrations
supabase db reset                   # Reset database (dev only!)
```

---

**Plan Status:** ✅ Ready to Execute  
**Next Review:** End of Day 1  
**Target Launch:** November 25, 2025  
**Confidence:** High (realistic timeline, clear tasks, measurable success)
