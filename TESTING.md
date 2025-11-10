# Testing Guide

## Overview

The Digital Strike test suite is designed to run **completely offline** with zero network dependencies. All external service calls (Supabase, DNS lookups, etc.) are mocked to ensure tests are fast, deterministic, and can run in CI environments without credentials.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests (offline mode, default)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Check bundle sizes
npm run bundle:check

# View bundle report
npm run bundle:report
```

## Bundle Budget Enforcement

### Size Limits

- **JavaScript chunks**: ≤ 300 KB (uncompressed) per chunk
- **Total JavaScript**: No hard limit (code splitting enforced)
- **Vendor chunks**: Exempt from limit (e.g., recharts-vendor)

### Running Bundle Checks

```bash
# Build and analyze bundle
npm run build
npm run bundle:report

# Or run both in one command
npm run bundle:check
```

### CI Bundle Budget

In CI, bundle checks enforce:
- ✅ All application chunks ≤ 300 KB
- ✅ Lazy loading detected in App.tsx
- ✅ Suspense boundaries present
- ❌ Fails if violations found

**Current Status**: Main bundle split using manual chunks:
- `recharts-vendor`: Chart library (lazy loaded)
- `carousel-vendor`: Embla carousel
- `radix-vendor`: Radix UI components
- `react-vendor`: React core libraries
- `data-vendor`: Supabase + React Query

### Web Vitals Testing

Telemetry tests include synthetic Web Vitals simulation:

```bash
# Run telemetry tests
npm test tests/telemetry.test.ts
```

Tests verify:
- ✅ Metrics buffered and flushed correctly
- ✅ URL privacy scrubbing (query/hash removal)
- ✅ Path truncation to 3 segments
- ✅ Retry logic with exponential backoff
- ✅ Circuit breaker on repeated failures
- ✅ Error deduplication within 1-hour windows

**Mock vitals** are generated in tests with:
- Good: LCP < 2.5s, INP < 200ms, CLS < 0.1
- Needs improvement: Above good but below poor
- Poor: LCP ≥ 4s, INP ≥ 500ms, CLS ≥ 0.25

## Environment Variables

Tests use the following environment variables (all set automatically in test mode):

| Variable | Default (Tests) | Description |
|----------|-----------------|-------------|
| `VITE_BACKEND_MODE` | `mock` | Backend mode: `mock` (no network) or `live` (real API calls) |
| `VITE_MERKLE_LOGGING_ENABLED` | `true` | Enable/disable Merkle chain integrity logging |
| `VITE_TELEMETRY_ENDPOINT` | `/api/telemetry` | Telemetry endpoint (mocked in tests) |
| `VITE_ERROR_ENDPOINT` | `/api/errors` | Error reporting endpoint (mocked in tests) |

### Setting Environment Variables

For local development, you can override these in `.env.test`:

```bash
# .env.test
VITE_BACKEND_MODE=mock
VITE_MERKLE_LOGGING_ENABLED=true
```

For production/live integration tests (NOT recommended in CI):

```bash
VITE_BACKEND_MODE=live npm test
```

## Test Organization

```
tests/
├── setup.ts                 # Global test configuration & mocks
├── privacy.test.ts          # PII detection, scrubbing, privacy thresholds (143 tests)
├── integrity.test.ts        # Merkle chain, snapshots, audit trails (102 tests)
├── merkleClient.test.ts     # Merkle client retry logic, feature flags (21 tests)
├── telemetry.test.ts        # Web Vitals & error reporting (11 tests)
└── smoke.test.ts            # Basic sanity checks
```

## Current Test Metrics

- **Total Tests**: 280
- **Passing**: 267 (95.4%)
- **Privacy Tests**: 139/143 passing (97.2%)
- **Telemetry Tests**: 11/11 passing (100%)
- **Integrity Tests**: 91/102 passing (89.2%)
- **Merkle Client**: 21/21 passing (100%)
- **Network Calls**: 0 (fully offline)

## Coverage Targets

- **Overall:** ≥80% statement coverage
- **Critical paths:** ≥90% coverage
  - PII detection (`src/lib/moderation.ts`)
  - Merkle client (`src/lib/merkleClient.ts`)
  - Privacy enforcement (`src/lib/privacy/*`)

View coverage report after running:
```bash
npm run test:coverage
open coverage/index.html
```

## Test Categories

### 1. Privacy & PII Tests (`privacy.test.ts`)

Tests comprehensive PII detection and redaction:

- **Email addresses**: 
  - Standard: `john@example.com` → `[email redacted]`
  - Accented characters: `José.García@example.com` → `[email redacted]`
- **Phone numbers**: 
  - NANP: `(555) 123-4567` → `[phone redacted]`
  - 7-digit: `555-1234` → `[phone redacted]`
  - E.164: `+15551234567` → `[phone redacted]`
  - International: `+44 20 7123 4567` → `[phone redacted]`
  - UK format: `+44 20 7123 4567` → `[phone redacted]`
  - Dialing prefix: `011-44-20-7123-4567` → `[phone redacted]`
- **Addresses**: 
  - Street: `123 Main Street` → `[address redacted]`
  - PO Box: `PO Box 456` → `[address redacted]`
  - Rural: `RR 2, Site 5, Box 10` → `[address redacted]`
- **Canadian postal codes**: `T2P 3H4` → `[postal code redacted]`
- **School names**: 
  - General: `Lincoln Elementary School` → `[school name redacted]`
  - With city: `Calgary Elementary No. 23` → `[school name redacted]`
  - Board of Education: `Calgary Board of Education School No. 45` → `[school name redacted]`
  - Public schools: `Edmonton Public Schools - Strathcona` → `[school name redacted]`
  - Abbreviations: `CBE Elementary No. 12` → `[school name redacted]`
- **ID numbers**: 
  - SSN: `123-45-6789` → `[id redacted]`
  - Canadian SIN: `123 456 789` → `[id redacted]`
  - Employee: `EMP-12345` → `[id redacted]`
  - Student: `Student ID: 1234567890` → `Student ID: [id redacted]`
  - License: `License #: DL-123456789` → `[id redacted]`
  - Healthcare: `1234-5678-9012` → `[id redacted]`
- **Alberta locations**: 
  - With suffix: `Calgary, Alberta` → `[location redacted]`
  - With school context: `Calgary Elementary` → `[location redacted] Elementary`
  - General reference: `Schools in Calgary are...` → `Schools in Calgary are...` (preserved)
  - Neighborhoods: `Beltline neighborhood` → `[location redacted]`
- **Temporal identifiers**:
  - Specific dates: `September 15, 2023` → `[date redacted]`
  - General years: `Teaching in 2024` → `Teaching in 2024` (preserved)

**Key test patterns:**

```typescript
// PII scrubbing
const cleaned = scrubPII('Email john@example.com for info');
expect(cleaned).toContain('[email redacted]');

// Content moderation  
const result = moderateContent('Plan the strike for Friday');
expect(result.blocked).toBe(true);

// Privacy threshold enforcement
expect(aggregateData.n).toBeGreaterThanOrEqual(20);
```

### 2. Integrity Tests (`integrity.test.ts`)

Tests data integrity, Merkle chain, and audit trails:

- **Merkle chain**: Hash integrity, tampering detection
- **Snapshots**: Weekly automation, hash verification
- **CCI calculation**: Consistency across components
  - Formula: `CCI = 10 × (0.4 × satisfaction + 0.6 × (10 − exhaustion))`
  - Scale: 0-100 (not 0-10)
- **Audit logging**: Complete event trails
- **Rate limiting**: Device and ASN-based limits

**Key test patterns:**

```typescript
// CCI calculation
const cci = calculateCCI(7.5, 3.0); // satisfaction, exhaustion
expect(cci).toBeCloseTo(72.0, 1); // 0-100 scale

// Merkle chain integrity
const chain = await buildMerkleChain(events);
expect(chain.isValid).toBe(true);
```

### 3. Merkle Client Tests (`merkleClient.test.ts`)

Tests the Merkle client adapter with retry logic:

- **Feature flags**: Enable/disable logging, mock/live modes
- **Retry logic**: Exponential backoff with jitter
- **Error handling**: Retriable vs terminal errors
- **Performance**: Concurrent submissions, batching

**Key test patterns:**

```typescript
// Mock mode (default)
const result = await logSignalSubmission(
  'signal-123',
  'Calgary',
  '0-5 years',
  7.5,
  3.0,
  { mode: 'mock' }
);
expect(result.success).toBe(true);

// Retry logic
const delay = calculateBackoffDelay(2, 500); // attempt, base delay
expect(delay).toBeGreaterThan(2000); // exponential
```

## Known Patterns & Edge Cases

### Phone Number Detection

✅ **Matches:**
- `555-123-4567` (NANP)
- `(555) 987-6543` (NANP with parens)
- `555.123.4567` (NANP with dots)
- `555-1234` (7-digit local)
- `+1-555-123-4567` (E.164 with dashes)
- `+15551234567` (E.164 compact)
- `1-800-555-1234` (toll-free)
- `+44 20 7123 4567` (UK)
- `011-44-20-7123-4567` (international dialing prefix)

❌ **Does NOT match (by design):**
- `2024-01-15` (ISO date)
- `12:34:56` (time)
- `2023-12-25` (date)

Regex uses negative lookbehind/lookahead to exclude dates:
```regex
(?<!\d{4}-)(?<!\d-)(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b(?!-\d)
```

### School Name Detection

✅ **Matches:**
- `Lincoln Elementary School`
- `Calgary Elementary No. 23` (city + school + number)
- `Calgary Board of Education School No. 45`
- `Edmonton Public Schools - Strathcona`
- `CBE Elementary No. 12` (abbreviation)
- `Red Deer Public Schools facility`

❌ **Does NOT match:**
- `Teaching in elementary education` (general education terms)

### Address Detection

✅ **Matches:**
- `123 Main Street NW`
- `456 Oak Avenue`
- `PO Box 789`
- `RR 2, Site 5, Box 10`
- `Unit 205, 789 Main St`

### Content Moderation

✅ **Blocked (coordinated action):**
- "organize a strike"
- "plan the walkout"
- "plan the walk out for next Friday" (handles spacing variations)
- "everyone walk out tomorrow"

✅ **Allowed (safe context):**
- "strike a balance"
- "walk out to your car"
- "coordinate lesson plans"

## Mocking Strategy

### Supabase Client Mock

All Supabase calls are mocked in `tests/setup.ts`:

```typescript
vi.mock('../src/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: { /* mock auth methods */ },
  },
}));
```

The mock supports full method chaining:
```typescript
supabase
  .from('table')
  .select('*')
  .eq('field', 'value')
  .order('created_at')
  .limit(10)
```

### Crypto Mock

Browser crypto API is mocked for Node.js environment:

```typescript
global.crypto = {
  randomUUID: () => crypto.randomUUID(),
  subtle: {
    digest: async (algorithm, data) => {
      const hash = crypto.createHash('sha256');
      hash.update(Buffer.from(data));
      return hash.digest().buffer;
    },
  },
};
```

## Running Tests Offline

**Tests are offline by default.** No configuration needed.

To verify offline mode:
```bash
# Disconnect from internet, then:
npm test

# Or use network namespace (Linux):
unshare -n npm test
```

All tests should pass without network connectivity.

## CI/CD Integration

### GitHub Actions

The CI workflow (`.github/workflows/ci.yml`) runs tests with:

- **Node versions**: 18, 20 (matrix)
- **Coverage collection**: Vitest with v8 provider
- **Pass rate enforcement**: Must be ≥90%
- **Offline mode**: `VITE_BACKEND_MODE=mock`
- **Artifacts**: Coverage reports, test results, build output

### Pass Rate Check

CI fails if test pass rate drops below 90%:

```bash
# Automated in CI
PASS_RATE=$(calculate_from_test_output)
if [ $PASS_RATE -lt 90 ]; then
  echo "❌ Pass rate $PASS_RATE% < 90%"
  exit 1
fi
```

## Performance & Bundle Testing

### Bundle Size Checks

Monitor and enforce bundle size budgets:

```bash
# Build and analyze bundle sizes
npm run bundle:check

# Just analyze existing build
npm run bundle:report
```

**Budget**: JavaScript chunks should be < 300 KB (uncompressed)

**What it checks:**
- Individual chunk sizes
- Total bundle size
- Code splitting effectiveness  
- Lazy loading detection

**Example output:**
```
📦 Bundle Size Report
────────────────────────────────────────────────────────────
File                                             Size     Type
────────────────────────────────────────────────────────────
❌ index-D4fdifCP.js                           653.55 KB   JS
❌ Methods-CLyRMTo3.js                         398.43 KB   JS
✅ Voices-CjBoYosh.js                          124.47 KB   JS
...

📊 Summary:
   Total chunks: 40
   JavaScript: 1.44 MB (34 files)
   
⚠️ JavaScript budget violations: 2 JS chunks exceed 300KB

🔍 Code Splitting Check:
   Lazy loading: ✅ Detected
   Suspense: ✅ Detected
```

### Web Vitals Synthetic Testing

Test Web Vitals collection in offline mode:

```bash
# Run telemetry tests
npm test tests/telemetry.test.ts
```

**Tests verify:**
- URL scrubbing (removes query params, hash)
- Path truncation (max 3 segments)
- Error stack sanitization
- Buffering and flush logic
- Retry with exponential backoff
- Circuit breaker functionality
- PII removal from error context

**Example:**
```typescript
// URL scrubbing test
Input:  https://example.com/a/b/c/d?secret=123#section
Output: https://example.com/a/b/c/...
```

## Troubleshooting

### "Network request detected in tests"

**Cause**: Test is making a real network call instead of using mocks.

**Fix**: Check that `VITE_BACKEND_MODE=mock` is set and Supabase mock is loaded.

```bash
# Verify env
echo $VITE_BACKEND_MODE  # should be 'mock'

# Check setup.ts is loaded
grep "Mock Supabase" tests/setup.ts
```

### "Module not found" errors

**Cause**: Path aliases not resolved.

**Fix**: Ensure `vitest.config.ts` has correct path alias:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

### "Expected X, got Y" in PII tests

**Cause**: Regex pattern changed or new edge case.

**Fix**: Check the specific pattern in `src/lib/moderation.ts`:

```typescript
// Example: phone number not matching
const phoneRegex = /(?<!\d{4}-)(?<!\d-)\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b(?!-\d)/g;
```

### Low coverage on new code

**Cause**: New code added without tests.

**Fix**: Add test cases covering new code paths:

```typescript
// src/lib/newFeature.ts
export function newFunction(input: string): string {
  return input.toUpperCase();
}

// tests/newFeature.test.ts
describe('newFunction', () => {
  it('should uppercase input', () => {
    expect(newFunction('hello')).toBe('HELLO');
  });
});
```

## Performance Benchmarks

Target performance for full test suite:

- **Duration**: < 5 seconds
- **Memory**: < 500 MB
- **Tests**: 250+ tests
- **Coverage**: ≥80%

Current metrics (as of last run):
- **Duration**: ~1.7 seconds
- **Tests**: 263 total
- **Pass rate**: 88.2% (232 passed, 31 failed)
- **Coverage**: Collected via v8

## Contributing

When adding new tests:

1. **Follow existing patterns**: Match style in `privacy.test.ts`, `integrity.test.ts`
2. **Use descriptive names**: `should detect and redact PO Box addresses`
3. **Test edge cases**: Empty strings, special characters, boundary conditions
4. **Avoid network calls**: Use mocks, never hit real APIs
5. **Document complex patterns**: Explain regex, algorithms in comments

### Test Structure

```typescript
describe('Feature Name', () => {
  describe('Sub-feature', () => {
    it('should do specific thing', () => {
      // Arrange
      const input = 'test data';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [CI/CD Workflow](.github/workflows/ci.yml)
- [Coverage Report](coverage/index.html) (after running `npm run test:coverage`)

## Support

For questions or issues with tests:

1. Check this guide first
2. Review existing test files for examples
3. Check CI logs for failure details
4. Open an issue with test output and steps to reproduce
