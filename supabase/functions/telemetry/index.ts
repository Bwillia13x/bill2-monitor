// Telemetry receiver - Supabase Edge Function
// Receives Web Vitals and error reports from clients
// Validates, sanitizes, and stores in Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelemetryEvent {
  session_id: string;
  ts: number;
  metric: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
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

// Validation functions
function isValidTelemetryEvent(event: unknown): event is TelemetryEvent {
  const e = event as TelemetryEvent;
  const METRIC_WHITELIST = ["LCP", "FCP", "INP", "CLS", "TTFB"];
  const now = Date.now();
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  return (
    typeof e.session_id === "string" &&
    e.session_id.length > 0 &&
    e.session_id.length <= 100 &&
    typeof e.ts === "number" &&
    Number.isFinite(e.ts) &&
    Math.abs(e.ts - now) < ONE_YEAR_MS &&
    typeof e.metric === "string" &&
    METRIC_WHITELIST.includes(e.metric) &&
    typeof e.value === "number" &&
    Number.isFinite(e.value) &&
    Math.abs(e.value) < 1e9 &&
    ["good", "needs-improvement", "poor"].includes(e.rating) &&
    typeof e.url === "string" &&
    e.url.length > 0 &&
    e.url.length <= 500 &&
    typeof e.device === "string" &&
    e.device.length > 0 &&
    e.device.length <= 100 &&
    typeof e.app_version === "string" &&
    e.app_version.length > 0 &&
    e.app_version.length <= 50
  );
}

function isValidErrorReport(error: unknown): error is ErrorReport {
  const e = error as ErrorReport;
  const now = Date.now();
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  return (
    typeof e.session_id === "string" &&
    e.session_id.length > 0 &&
    e.session_id.length <= 100 &&
    typeof e.ts === "number" &&
    Number.isFinite(e.ts) &&
    Math.abs(e.ts - now) < ONE_YEAR_MS &&
    typeof e.message === "string" &&
    e.message.length > 0 &&
    e.message.length <= 1000 &&
    typeof e.stack_hash === "string" &&
    e.stack_hash.length > 0 &&
    e.stack_hash.length <= 100 &&
    typeof e.app_version === "string" &&
    e.app_version.length > 0 &&
    e.app_version.length <= 50 &&
    typeof e.url === "string" &&
    e.url.length > 0 &&
    e.url.length <= 500 &&
    typeof e.device === "string" &&
    e.device.length > 0 &&
    e.device.length <= 100 &&
    (e.stack === undefined || (typeof e.stack === "string" && e.stack.length <= 5000))
  );
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const pathname = url.pathname;

    // Parse body
    const body = await req.json();
    
    if (!Array.isArray(body)) {
      return new Response(
        JSON.stringify({ error: "Body must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route to appropriate handler
    if (pathname.includes("/telemetry") || pathname.includes("/vitals")) {
      // Handle Web Vitals
      const validEvents = body.filter(isValidTelemetryEvent);
      
      if (validEvents.length === 0) {
        return new Response(
          JSON.stringify({ error: "No valid telemetry events" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert into telemetry_events table
      const { error } = await supabaseClient
        .from("telemetry_events")
        .insert(validEvents.map(e => ({
          session_id: e.session_id,
          timestamp: new Date(e.ts).toISOString(),
          metric: e.metric,
          value: e.value,
          rating: e.rating,
          url: e.url,
          device: e.device,
          app_version: e.app_version,
        })));

      if (error) {
        console.error("Database error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to store events" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ received: validEvents.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (pathname.includes("/errors")) {
      // Handle error reports
      const validErrors = body.filter(isValidErrorReport);
      
      if (validErrors.length === 0) {
        return new Response(
          JSON.stringify({ error: "No valid error reports" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert into error_reports table
      const { error } = await supabaseClient
        .from("error_reports")
        .insert(validErrors.map(e => ({
          session_id: e.session_id,
          timestamp: new Date(e.ts).toISOString(),
          message: e.message,
          stack_hash: e.stack_hash,
          stack: e.stack,
          app_version: e.app_version,
          url: e.url,
          device: e.device,
          context: e.context,
        })));

      if (error) {
        console.error("Database error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to store errors" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ received: validErrors.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown endpoint" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Request error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
