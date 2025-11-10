# Telemetry & Error Reporting

## Overview

Digital Strike collects anonymous performance metrics (Web Vitals) and error reports to improve application reliability and user experience. All telemetry is **privacy-safe** and **opt-outable**.

## What Data We Collect

### Web Vitals Metrics

We collect standard Web Vitals performance metrics to monitor and improve application performance:

| Metric | Description | Target | Purpose |
|--------|-------------|--------|---------|
| **LCP** | Largest Contentful Paint | < 2.5s | Page load performance |
| **INP** | Interaction to Next Paint | < 200ms | Responsiveness |
| **CLS** | Cumulative Layout Shift | < 0.1 | Visual stability |
| **FCP** | First Contentful Paint | < 1.8s | Initial render |
| **TTFB** | Time to First Byte | < 800ms | Server response |

### Error Reports

We collect application errors to identify and fix bugs:

- Error message and type
- Stack trace (sanitized, no file paths)
- Application version
- Device type (mobile/tablet/desktop)
- URL (scrubbed of query params and hash)

## Data Schema

### Telemetry Events Table

```sql
CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  metric TEXT NOT NULL, -- LCP, INP, CLS, FCP, TTFB
  value NUMERIC NOT NULL,
  rating TEXT NOT NULL, -- good, needs-improvement, poor
  url TEXT NOT NULL,
  device TEXT NOT NULL, -- mobile, tablet, desktop
  app_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Error Reports Table

```sql
CREATE TABLE error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  stack_hash TEXT NOT NULL,
  stack TEXT,
  app_version TEXT NOT NULL,
  url TEXT NOT NULL,
  device TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Privacy Safeguards

### URL Scrubbing

All URLs are sanitized before transmission:

- Query parameters removed (`?secret=123` → removed)
- Hash fragments removed (`#section` → removed)
- Paths truncated to 3 segments (`/a/b/c/d/e` → `/a/b/c/...`)

**Example:**
```
Input:  https://example.com/dashboard/user/123/settings?token=abc#section
Output: https://example.com/dashboard/user/123/...
```

### Error Stack Sanitization

Stack traces are cleaned to remove identifying information:

- Full file paths removed
- Only function names and line numbers retained
- Truncated to 1000 characters

**Example:**
```
Input:  at handleClick (https://example.com/assets/index-abc123.js:456:78)
Output: at handleClick (index-abc123.js:456:78)
```

### Context Sanitization

Error context is filtered to remove PII:

- Fields containing `email`, `phone`, `name`, `address`, `token`, `password` are dropped
- Only safe metadata is retained

### No Personal Identifiers

- No user IDs, email addresses, or names collected
- No IP addresses are explicitly collected or stored by the application. While infrastructure logs may contain IP addresses for operational purposes, they are not used for analytics or linked to telemetry data.
- Session IDs are random, temporary, and not linked to user accounts
- Device fingerprints are NOT used for telemetry

## Data Retention

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| Web Vitals | 90 days | Performance trending |
| Error Reports | 90 days | Bug tracking and resolution |

Automated cleanup runs weekly to purge expired data.

## Deduplication

### Error Deduplication

Identical errors are deduplicated to prevent spam:

- Deduplication key: `(message, stack_hash, app_version)`
- Time window: 1 hour
- Prevents the same error from being reported multiple times

**Example:**
```
Error 1: "Cannot read property 'x'" at 10:00 AM → Reported
Error 2: "Cannot read property 'x'" at 10:15 AM → Suppressed (duplicate)
Error 3: "Cannot read property 'x'" at 11:05 AM → Reported (> 1 hour)
```

## Rate Limiting

### Client-Side Limits

To prevent abuse and excessive data transmission:

- **Web Vitals Buffer**: Max 50 events before auto-flush
- **Error Reports**: Deduplicated within 1-hour windows
- **Circuit Breaker**: Stops transmission after 5 consecutive failures

### Retry Logic

Failed transmissions are retried with exponential backoff:

- Initial backoff: 1 second
- Max backoff: 30 seconds
- Max retries: 3 attempts
- Jitter: ±10% randomization

After max retries, events are dropped to prevent infinite accumulation.

## Transmission

### Buffering

Events are buffered in memory and flushed:

- Every 30 seconds (automatic)
- On buffer full (50 events)
- On page hide (`pagehide` event)
- On visibility change (when tab becomes hidden)

### Reliability

- **Primary**: `navigator.sendBeacon()` for page unload reliability
- **Fallback**: `fetch()` with `keepalive: true` for older browsers
- **Circuit Breaker**: Stops after 5 consecutive failures, resets after 60 seconds

## Opt-Out

### Disable All Telemetry

Set environment variable before loading the app:

```bash
VITE_TELEMETRY_DISABLED=true
```

Or in `.env.local`:

```
VITE_TELEMETRY_DISABLED=true
```

### Disable Only Web Vitals

```bash
VITE_WEB_VITALS_DISABLED=true
```

### Disable Only Error Reporting

```bash
VITE_ERROR_REPORTING_DISABLED=true
```

### Browser-Level Opt-Out

Users can also:

- **Block network requests**: Use browser extensions like uBlock Origin to block telemetry endpoints
- **Disable JavaScript**: Telemetry requires JavaScript
- **Clear sessionStorage**: Clears buffered events (temporary)

## Development Mode

In development mode (`NODE_ENV=development`):

- Web Vitals are logged to console with emoji indicators
- Errors are logged to console with full stack traces
- No data is transmitted to production endpoints
- Use mock telemetry server for local testing

### Mock Server

```bash
# Start mock telemetry server
npm run mock:telemetry

# Configure app to use mock server
export VITE_TELEMETRY_ENDPOINT=http://localhost:3001/api/telemetry
export VITE_ERROR_ENDPOINT=http://localhost:3001/api/errors
```

## GDPR / PIPEDA Compliance

Digital Strike's telemetry is designed to comply with GDPR and PIPEDA:

✅ **No PII**: No personal identifiers collected  
✅ **Anonymized**: Session IDs are random and temporary  
✅ **Transparent**: This document describes all data collected  
✅ **Opt-Out**: Users can disable telemetry  
✅ **Retention**: Data automatically deleted after 90 days  
✅ **Security**: Data transmitted over HTTPS  
✅ **Purpose**: Data used only for performance and reliability improvements  

## Endpoint Configuration

### Production

```bash
VITE_TELEMETRY_ENDPOINT=https://your-project.supabase.co/functions/v1/telemetry
VITE_ERROR_ENDPOINT=https://your-project.supabase.co/functions/v1/telemetry/errors
```

### Development

```bash
VITE_TELEMETRY_ENDPOINT=http://localhost:3001/api/telemetry
VITE_ERROR_ENDPOINT=http://localhost:3001/api/errors
```

## Testing

All telemetry code is fully tested with zero network dependencies:

```bash
# Run telemetry tests
npm test tests/telemetry.test.ts

# Test coverage
npm run test:coverage
```

Tests verify:

- ✅ Buffering and flushing
- ✅ URL and error sanitization
- ✅ Retry logic with exponential backoff
- ✅ Circuit breaker functionality
- ✅ Deduplication
- ✅ Privacy scrubbing

## Questions?

For questions about telemetry and privacy:

- Review this documentation
- Check source code: `src/lib/telemetry.ts`
- Open an issue on GitHub
- Contact: [Your contact method]

---

**Last Updated**: November 2025  
**Version**: 1.0
