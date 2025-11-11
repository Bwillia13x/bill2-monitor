# Privacy Policy & Telemetry Controls

## Overview

Digital Strike takes user privacy seriously. This document outlines our privacy practices, data collection policies, and how users can control their data.

## Quick Reference

**Want to disable all telemetry?** Set `TELEMETRY_ENABLED=false` in your `.env` file.

**Want to reduce telemetry?** Set `TELEMETRY_SAMPLE_RATE=0.1` (10%) in your `.env` file.

**Respect Do Not Track?** Set `TELEMETRY_RESPECT_DNT=true` (default).

## Telemetry Privacy Guardrails

### Environment Variables

All telemetry can be controlled via environment variables in `.env`:

```bash
# Enable/disable telemetry collection (set to false to completely disable)
TELEMETRY_ENABLED=false

# Sampling rate for telemetry (0.0 to 1.0)
# 0.0 = no sampling, 1.0 = 100% sampling
TELEMETRY_SAMPLE_RATE=0.0

# Respect Do Not Track (DNT) browser setting
# When true, telemetry is disabled if user has DNT enabled
TELEMETRY_RESPECT_DNT=true

# Salt for hashing anonymous client IDs
# Change this to a random string to anonymize user tracking
ANON_ID_SALT="change_me_to_random_string_in_production"
```

### Global Toggle

**`TELEMETRY_ENABLED`** (default: `true`)

- When set to `false`, **no telemetry is collected** regardless of other settings
- This is the master switch for all telemetry functionality
- Recommended for development and local testing

### Sampling Control

**`TELEMETRY_SAMPLE_RATE`** (default: `1.0`)

- Controls what percentage of users send telemetry
- Value must be between `0.0` and `1.0`
- Examples:
  - `0.0` = No users send telemetry
  - `0.1` = 10% of users send telemetry
  - `1.0` = 100% of users send telemetry
- Sampling is consistent per session (user is either sampled or not for entire session)
- Use this to reduce server load while still collecting representative data

### Do Not Track (DNT) Support

**`TELEMETRY_RESPECT_DNT`** (default: `true`)

- When enabled, respects the browser's Do Not Track (DNT) setting
- If user has DNT enabled (`navigator.doNotTrack === '1'` or `'yes'`), no telemetry is collected
- Honors user privacy preferences at the browser level
- Set to `false` only if you have explicit user consent that overrides DNT

### Anonymous ID Hashing

**`ANON_ID_SALT`** (default: `"default-salt-change-in-production"`)

- Used to hash session IDs and any stable client identifiers
- **Must be changed to a random string in production**
- Ensures that even if data is leaked, user IDs cannot be reverse-engineered
- Rotate periodically for additional security
- Never commit production salts to version control

## Data Collection Practices

### What We Collect

When telemetry is enabled:

1. **Web Vitals Metrics** (Performance Data)
   - LCP (Largest Contentful Paint)
   - FCP (First Contentful Paint)
   - CLS (Cumulative Layout Shift)
   - INP (Interaction to Next Paint)
   - TTFB (Time to First Byte)

2. **Error Reports**
   - Error messages
   - Stack traces (sanitized, paths removed)
   - Application version
   - Device type (desktop/tablet/mobile)

### What We DO NOT Collect

- ❌ Names, emails, or other Personally Identifiable Information (PII)
- ❌ Precise IP addresses (we may use aggregated geolocation for analytics)
- ❌ Query parameters from URLs (automatically scrubbed)
- ❌ URL fragments/hashes (automatically scrubbed)
- ❌ Cookie values
- ❌ Local storage data
- ❌ Form inputs or user-entered data

### Automatic Privacy Protections

All telemetry data is automatically:

1. **URL Scrubbing**: Query parameters and hashes removed
   - `https://example.com/page?secret=123#hash` → `https://example.com/page`

2. **Path Truncation**: Long paths truncated to 3 segments
   - `/very/long/path/to/resource` → `/very/long/path/...`

3. **Session ID Hashing**: Session IDs hashed with salt
   - Original: `uuid-12345-67890`
   - Hashed: `a7b3c9d2e8f1` (irreversible without salt)

4. **Stack Trace Sanitization**: File paths removed, only function names kept
   - Full path: `https://example.com/assets/app.js:42:10`
   - Sanitized: `app.js:42:10`

5. **Context Filtering**: Removes potential PII from error context
   - Keys containing: `email`, `phone`, `name`, `address`, `token`, `password` are excluded

## Telemetry Flow

### Collection

```
User Action → Web Vitals/Error → Privacy Checks → Buffer → Flush → Backend
                                       ↓
                         Check: TELEMETRY_ENABLED
                         Check: TELEMETRY_SAMPLE_RATE
                         Check: TELEMETRY_RESPECT_DNT
                         Check: Circuit Breaker
                                       ↓
                              Scrub & Hash Data
```

### Privacy Check Order

1. **`TELEMETRY_ENABLED`**: Is telemetry globally enabled?
2. **`TELEMETRY_RESPECT_DNT`**: Is DNT enabled and should we respect it?
3. **`TELEMETRY_SAMPLE_RATE`**: Is this session sampled for collection?
4. **Circuit Breaker**: Is the backend responsive?

If any check fails, **no data is collected**.

### Buffering & Batching

- Metrics are buffered locally (max 50 events)
- Flushed every 30 seconds or when buffer is full
- Automatic flush on page hide/visibility change
- Uses `sendBeacon()` for reliability during page unload

### Retry & Circuit Breaking

- Failed requests are retried up to 3 times with exponential backoff
- Circuit breaker opens after 5 consecutive failures
- Prevents excessive retries that could impact user experience
- Circuit resets after 60 seconds

## Server Endpoints

### Default Endpoints

- **Web Vitals**: `/api/telemetry` (POST)
- **Errors**: `/api/errors` (POST)

### Endpoint Configuration

Override endpoints via environment variables:

```bash
VITE_TELEMETRY_ENDPOINT="/api/custom-telemetry"
VITE_ERROR_ENDPOINT="/api/custom-errors"
```

### Expected Server Behavior

- Return `204 No Content` for successful ingestion
- Return `4xx`/`5xx` for errors (will trigger retries)
- Should be fast (<100ms) to avoid blocking client
- Should be disabled in `test` and `development` environments by default

## User Rights & Data Retention

### Right to Opt-Out

Users can opt out of telemetry by:

1. **Browser DNT**: Enable Do Not Track in browser settings (if `TELEMETRY_RESPECT_DNT=true`)
2. **Client-side**: Application can provide UI to disable telemetry
3. **Server-side**: Contact us to request data deletion

### Data Retention

- **Web Vitals**: Aggregated and anonymized, retained for analytics
- **Error Reports**: Retained for debugging, typically 90 days
- **Session IDs**: Hashed, not linkable to individual users

### Data Deletion

To request deletion of your data:
1. Contact: [Add contact email]
2. Provide: Session ID or approximate time range
3. We will delete all matching telemetry within 30 days

## Compliance

### GDPR (General Data Protection Regulation)

- ✅ Data minimization: Only collect what's needed
- ✅ Purpose limitation: Only for performance and error monitoring
- ✅ Privacy by design: Default settings respect user privacy
- ✅ Right to access: Users can request their data
- ✅ Right to deletion: Users can request deletion
- ✅ Right to object: Users can opt-out via DNT or `TELEMETRY_ENABLED=false`

### CCPA (California Consumer Privacy Act)

- ✅ Transparency: This document describes all data collection
- ✅ Right to know: Users can request what data we have
- ✅ Right to delete: Users can request deletion
- ✅ Right to opt-out: Multiple opt-out mechanisms provided

### Canadian Privacy Laws (PIPEDA)

- ✅ Consent: Implicit consent via privacy policy and opt-out options
- ✅ Accountability: Clear documentation of data practices
- ✅ Safeguards: Hashing, scrubbing, circuit breaking
- ✅ Openness: Public documentation of privacy practices

## Testing Privacy Controls

### Unit Tests

```bash
# Run telemetry privacy tests
npm test tests/telemetry-privacy.test.ts
```

Tests verify:
- ✅ `TELEMETRY_ENABLED=false` prevents all collection
- ✅ `TELEMETRY_SAMPLE_RATE=0.0` prevents all collection
- ✅ DNT header is respected when `TELEMETRY_RESPECT_DNT=true`
- ✅ Session IDs are hashed with `ANON_ID_SALT`
- ✅ Hashes are consistent and irreversible

### Verify Configuration

```bash
# Check current telemetry config
node -e "const t = require('./src/lib/telemetry'); console.log(t.getTelemetryConfig())"
```

Expected output:
```json
{
  "enabled": false,
  "sampleRate": 0.0,
  "respectDNT": true,
  "hasCustomSalt": false
}
```

## Contact

For privacy concerns or data requests:
- **Email**: [Add contact email]
- **Issue Tracker**: [Add GitHub issues URL]

Last updated: 2025-01-10
