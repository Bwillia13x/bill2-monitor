# Viral Centerpiece Feature Spec

_Last updated: 2025-11-15_

## 1. Vision  
Deliver a pair of companion features—the **Teachers’ Signal Thermometer** hero module and the **Province Contribution Heatmap**—that together make participation feel tangible, celebratory, and habit-forming. The thermometer uses goal-gradient psychology to surface near-term milestones with confetti/share hooks, while the heatmap makes daily activity visible and rewards “keep the chain alive” behavior.

## 2. Data + API Contracts

### Data Sources  
- `stories` / `submissions` table (existing event log with `created_at`, `division`, `role`, `pins`, `tags`, `referrer`, `pledge_flag`).  
- Shared privacy utilities (`n≥20` suppression, division granularity, tag-level filters) must run on any aggregation.

### Aggregates Needed  
| Metric | Purpose | Notes |
| --- | --- | --- |
| `total_stories` | Thermometer progress numerator | ### counts all approved submissions; apply suppression before returning |
| `division_coverage_pct` | Thermometer denominator-based goal (e.g., `% of 8 major divisions with ≥20 stories`) | Derived from divisions crossing privacy threshold |
| `goal_target` | Thermometer goal (e.g., 5,000 stories / 70% coverage) | Stored value so frontend can experiment with different goals |
| `milestones` array (`percentage`, `label`, `hit_at`) | Drives confetti + badge UI at 10/25/50/75/100% | Include `share_text` template per milestone |
| `daily_counts` array of `{ date, count }` (past 365 days) | Heatmap calendar cells | `count` suppressed to `null` when `<20` total for week for privacy |
| `streaks` object (`current_days`, `longest_days`, `last_break`) | Flags flame icon and tooltip text | Computed on backend from daily buckets |

### API / RPC  
- **`rpc.get_teachers_signal_metrics`**  
  - Params: none  
  - Returns: schema described above  
  - Use: hydrates hero + heatmap on initial load; can be cached for 15s and invalidated on new submission  
- **`rpc.stream_teachers_signal_updates`** (optional SSE/WS)  
  - Emits delta message when `total_stories`, `division_coverage_pct`, or `milestone` state changes  
  - Payload example: `{"type":"counter","total_stories":312,"division_coverage_pct":34}`  
  - SST uses `created_at` index to poll PostgreSQL for new rows and push updates safely under privacy rules  
- Both RPCs must enforce `n≥20` suppression and use approval from `policies/metrics.sql` to avoid leaking small geos.

## 3. Thermometer Component Spec (`components/v3/TeachersSignalThermometer.tsx`)

### Props  
- `totalStories: number`  
- `goalTarget: number`  
- `divisionCoveragePct: number`  
- `milestones: Array<{percentage: number; label: string; hit: boolean; shareCopy?: string}>`  
- `onMilestoneShare: (milestoneLabel: string) => void` — triggered for milestone confetti + share modal  
- `statusTags?: string[]` — e.g., “Division coverage: 55% (Calgary Public + Edmonton)”  

### Behavior  
- Animated progress fill with gradient (teal → neon) + shimmer at the leading edge  
- Confetti + `onMilestoneShare` call when milestone transitions from `hit: false` → `true`; show badge alignment  
- Secondary CTA: “Share the teachers’ signal” button referencing current `totalStories` and inviting OG card share  
- Bonus microcopy: “X stories to 50%” and adaptive label for division coverage  
- Use `prefers-reduced-motion` to skip confetti when necessary

## 4. Heatmap Component Spec (`components/v3/ContributionHeatmap.tsx`)

### Props  
- `dailyCounts: Array<{date: string; count: number | null}>` (past year, ISO dates)  
- `streaks: { currentDays: number; longestDays: number }`  
- `onCellHover?: (date: string, count: number | null) => void`

### Behavior  
- Render 7×52 grid (weeks × days) with Tailwind classes for tiered activity (`bg-slate-800`, `bg-emerald-500`, etc.).  
- Highlight today’s cell (`outline` and “Today: XX stories” tooltip).  
- Fire flame badge when `streaks.currentDays ≥ 3` with microcopy (“Province streak: 6 days”).  
- Hover tooltip includes `count` and sanitized example tag from `tags` frequency if available.

## 5. Realtime + Fallback Strategy

- **Primary path:** SSE or websocket from `/api/teachers-signal/stream` that proxies Supabase `rpc.stream_teachers_signal_updates` with rate limit (1 message per 5s).  
- **Fallback:** Poll `rpc.get_teachers_signal_metrics` every 15s for clients that cannot keep SSE open.  
- **Offline:** Cache latest metrics in `localStorage` + display “last updated: HH:MM” when page regains focus.

## 6. Analytics + Experimentation

- Track events: `thermometer_milestone_reached`, `thermometer_cta_click`, `heatmap_hover`, `heatmap_streak_view`.  
- Each milestone has metadata for share copy and OG image trigger (call existing `/api/og?milestone=` endpoint).  
- Feature flag gating so we can A/B test CTA copy (“Share the signal” vs. “Boost the signal”) and confetti intensity before enabling on `/`.

## 7. Next Steps / Coordination

1. **Backend alignment (owner: Supabase team)**  
   - Implement `rpc.get_teachers_signal_metrics` + `rpc.stream_teachers_signal_updates`.  
   - Populate milestone table (10%, 25%, 50%, 75%, 100%) and ensure privacy suppression via `n≥20`.  
   - Add view `metrics.daily_story_counts` for heatmap and `metrics.streak_summary`.
2. **Frontend builds (owner: V3 UI team)**  
   - Create `TeachersSignalThermometer` and `ContributionHeatmap` components inside `src/components/v3/viral`.  
   - Hook to data layer via `src/lib/api/teachersSignal.ts` + React Query (with SSE plugin).  
   - Wire hero into `src/pages/Index.tsx` with share/CTA modal; ensure responsive layout.  
3. **QA & Monitoring**  
   - Smoke test milestone share flow + SSE updates in staging.  
   - Monitor Supabase telemetry for `rpc.get_teachers_signal_metrics` latency and SSE connection drops.  
4. **Follow-up**  
   - After launch, iterate with **Relative Ladder** and **Sentiment Waveform** specs (benchmarked in plan).  
   - Revisit analytics to roll up new metrics for viral KPI dashboard.
