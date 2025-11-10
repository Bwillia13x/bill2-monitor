# Automation Scripts

This directory contains automation scripts for the Bill 2 Monitor platform.

## Scripts

### 1. Nightly Signing (`nightlySigning.ts`)
**Schedule:** Daily at 2:00 AM MST  
**Purpose:** Signs district aggregates with Ed25519 for data integrity

**Runs:**
- Fetches previous day's CCI submissions
- Calculates district-level aggregates
- Signs aggregates with Ed25519 digital signature
- Stores signatures in database

**Command:**
```bash
npm run automation:nightly-signing
```

### 2. Weekly Snapshot (`weeklySnapshot.ts`)
**Schedule:** Every Monday at 2:00 AM MST  
**Purpose:** Generates weekly data snapshots with CSV exports

**Runs:**
- Fetches all CCI data from database
- Generates CSV file with aggregates
- Calculates SHA-256 checksums
- Logs snapshot to database and Merkle chain
- Creates metadata file

**Command:**
```bash
npm run automation:weekly-snapshot
```

### 3. Data Retention Cleanup (`retentionCleanup.ts`)
**Schedule:** Daily at 3:00 AM MST  
**Purpose:** Purges old data according to retention policies

**Runs:**
- Deletes rate limit records older than 30 days
- Deletes ASN submission records older than 7 days
- Deletes audit logs older than 1 year
- Deletes stories older than 90 days
- Deletes video references older than 180 days

**Command:**
```bash
npm run automation:retention-cleanup
```

### 4. Copy Audit (`auditCopy.ts`)
**Schedule:** On every commit (via CI/CD)  
**Purpose:** Scans for mobilization language to ensure platform remains neutral

**Command:**
```bash
npx tsx scripts/auditCopy.ts
```

## Cron Job Setup

### Production Crontab (MST timezone)

```cron
# Nightly signing - 2:00 AM MST daily
0 2 * * * cd /path/to/bill2-monitor && npm run automation:nightly-signing >> /var/log/bill2-monitor/nightly-signing.log 2>&1

# Weekly snapshot - 2:00 AM MST every Monday
0 2 * * 1 cd /path/to/bill2-monitor && npm run automation:weekly-snapshot >> /var/log/bill2-monitor/weekly-snapshot.log 2>&1

# Data retention cleanup - 3:00 AM MST daily
0 3 * * * cd /path/to/bill2-monitor && npm run automation:retention-cleanup >> /var/log/bill2-monitor/retention-cleanup.log 2>&1
```

### Using Node-Cron (Alternative)

For environments where system cron is not available, you can use `node-cron`:

```javascript
import cron from 'node-cron';
import { nightlySigningJob } from './scripts/nightlySigning';
import { weeklySnapshotJob } from './scripts/weeklySnapshot';
import { retentionCleanupJob } from './scripts/retentionCleanup';

// Nightly signing - 2:00 AM MST daily
cron.schedule('0 2 * * *', nightlySigningJob, {
  timezone: "America/Denver"
});

// Weekly snapshot - 2:00 AM MST every Monday
cron.schedule('0 2 * * 1', weeklySnapshotJob, {
  timezone: "America/Denver"
});

// Data retention cleanup - 3:00 AM MST daily
cron.schedule('0 3 * * *', retentionCleanupJob, {
  timezone: "America/Denver"
});
```

## Environment Variables

Ensure these environment variables are set:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SIGNING_KEY_SEED=your_signing_key_seed
```

## Monitoring

### Log Files
All jobs output to stdout/stderr. In production, redirect to log files:

```bash
mkdir -p /var/log/bill2-monitor
```

### Alerting
Set up monitoring alerts for:
- Job failures (non-zero exit codes)
- Job duration exceeding thresholds
- Missing signatures or snapshots
- Database errors

### Verification Commands

Check latest snapshot:
```bash
npm run automation:weekly-snapshot
```

Verify Merkle chain integrity:
```typescript
import { globalMerkleChainDB } from './src/lib/integrity/merkleChainDB';
const result = await globalMerkleChainDB.verifyChain();
console.log('Chain valid:', result.isValid);
```

Check signature count:
```sql
SELECT COUNT(*) FROM digital_signatures 
WHERE signed_at > NOW() - INTERVAL '7 days';
```

## Troubleshooting

### Job Not Running
1. Check crontab syntax: `crontab -l`
2. Verify timezone settings
3. Check log files for errors
4. Ensure Node.js and npm are in PATH

### Database Connection Issues
1. Verify Supabase credentials
2. Check network connectivity
3. Confirm RLS policies allow service role access

### Permission Errors
1. Ensure scripts are executable: `chmod +x scripts/*.ts`
2. Check file ownership
3. Verify log directory permissions

## Development

### Testing Locally

Run jobs manually for testing:
```bash
# Test nightly signing
npm run automation:nightly-signing

# Test weekly snapshot
npm run automation:weekly-snapshot

# Test retention cleanup
npm run automation:retention-cleanup
```

### Debugging

Enable debug logging:
```bash
DEBUG=* npm run automation:nightly-signing
```

### Dry Run Mode

Add a dry-run flag to test without database writes:
```bash
DRY_RUN=true npm run automation:nightly-signing
```

## Security

- **Never commit** signing keys or service role keys to git
- Use environment variables for all secrets
- Rotate keys regularly (quarterly recommended)
- Audit logs are preserved for 1 year
- All operations are logged to Merkle chain

## Maintenance

### Key Rotation
1. Generate new Ed25519 key pair
2. Add new public key to `public_keys` table
3. Update `VITE_SIGNING_KEY_SEED` environment variable
4. Mark old key as inactive after transition period

### Snapshot Retention
Snapshots are kept indefinitely by default. To configure retention:
```sql
-- Keep only last 52 weeks (1 year)
DELETE FROM snapshot_logs 
WHERE timestamp < NOW() - INTERVAL '52 weeks';
```

## Support

For issues or questions:
- Check logs first
- Review database audit_log table
- Verify Merkle chain integrity
- Contact platform maintainer
