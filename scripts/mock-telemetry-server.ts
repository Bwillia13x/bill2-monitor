// Mock telemetry server for local development
// Runs a simple HTTP server that accepts telemetry and error reports

import http from 'http';

const PORT = 3001;

interface TelemetryEvent {
  session_id: string;
  ts: number;
  metric: string;
  value: number;
  rating: string;
  url: string;
  device: string;
  app_version: string;
}

interface ErrorReport {
  session_id: string;
  ts: number;
  message: string;
  stack_hash: string;
  stack?: string;
  app_version: string;
  url: string;
  device: string;
  context?: Record<string, unknown>;
}

const telemetryEvents: TelemetryEvent[] = [];
const errorReports: ErrorReport[] = [];

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);

      if (!Array.isArray(data)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Body must be an array' }));
        return;
      }

      const url = req.url || '';

      if (url.includes('/telemetry') || url.includes('/vitals')) {
        // Handle Web Vitals
        const validEvents = data.filter(isValidTelemetryEvent);
        telemetryEvents.push(...validEvents);
        
        console.log(`📊 Received ${validEvents.length} telemetry events:`);
        validEvents.forEach(e => {
          const emoji = e.rating === 'good' ? '✅' : e.rating === 'needs-improvement' ? '⚠️' : '❌';
          console.log(`  ${emoji} ${e.metric}: ${e.value.toFixed(2)} (${e.rating})`);
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: validEvents.length }));
      } else if (url.includes('/errors')) {
        // Handle error reports
        const validErrors = data.filter(isValidErrorReport);
        errorReports.push(...validErrors);
        
        console.log(`🚨 Received ${validErrors.length} error reports:`);
        validErrors.forEach(e => {
          console.log(`  - ${e.message} (${e.app_version})`);
          if (e.stack) {
            console.log(`    Stack hash: ${e.stack_hash}`);
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: validErrors.length }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unknown endpoint' }));
      }
    } catch (error) {
      console.error('Error processing request:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
});

function isValidTelemetryEvent(event: unknown): event is TelemetryEvent {
  const e = event as TelemetryEvent;
  return (
    typeof e.session_id === 'string' &&
    typeof e.ts === 'number' &&
    typeof e.metric === 'string' &&
    typeof e.value === 'number' &&
    typeof e.url === 'string' &&
    typeof e.device === 'string' &&
    typeof e.app_version === 'string'
  );
}

function isValidErrorReport(error: unknown): error is ErrorReport {
  const e = error as ErrorReport;
  return (
    typeof e.session_id === 'string' &&
    typeof e.ts === 'number' &&
    typeof e.message === 'string' &&
    typeof e.stack_hash === 'string' &&
    typeof e.app_version === 'string' &&
    typeof e.url === 'string' &&
    typeof e.device === 'string'
  );
}

server.listen(PORT, () => {
  console.log(`\n🖥️  Mock telemetry server running on http://localhost:${PORT}`);
  console.log(`\n📝 Configure your app to use:`);
  console.log(`   VITE_TELEMETRY_ENDPOINT=http://localhost:${PORT}/api/telemetry`);
  console.log(`   VITE_ERROR_ENDPOINT=http://localhost:${PORT}/api/errors`);
  console.log(`\n📊 Stats:`);
  console.log(`   Telemetry events: ${telemetryEvents.length}`);
  console.log(`   Error reports: ${errorReports.length}`);
  console.log(`\nPress Ctrl+C to stop\n`);
});

// Log stats periodically
setInterval(() => {
  if (telemetryEvents.length > 0 || errorReports.length > 0) {
    console.log(`\n📊 Current stats:`);
    console.log(`   Telemetry events: ${telemetryEvents.length}`);
    console.log(`   Error reports: ${errorReports.length}\n`);
  }
}, 60000); // Every minute
