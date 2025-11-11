import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TeacherSignalMetrics, TeacherSignalMilestone } from "@/hooks/useTeacherSignalMetrics";
import { trackEvent } from "@/lib/telemetry";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

interface TeachersSignalThermometerProps {
  metrics: TeacherSignalMetrics | null;
  loading?: boolean;
  onSubmitClick: () => void;
  onShareClick: () => void;
  onMilestoneShare?: (milestone: TeacherSignalMilestone) => void;
}

const FALLBACK_METRICS: TeacherSignalMetrics = {
  total_stories: 1284,
  division_coverage_pct: 52.3,
  goal_target: 5000,
  coverage_goal_pct: 70,
  progress_pct: 25.6,
  milestones: [
    { percentage: 10, label: "10% goal", hit: true, shareCopy: "Teachers' Signal hit 10% of goal" },
    { percentage: 25, label: "25% goal", hit: true, shareCopy: "Teachers' Signal hit 25% of goal" },
    { percentage: 50, label: "Halfway", hit: false, shareCopy: "" },
    { percentage: 75, label: "75% goal", hit: false, shareCopy: "" },
    { percentage: 100, label: "Goal reached", hit: false, shareCopy: "" },
  ],
  daily_counts: [],
  streak_summary: { currentDays: 4, longestDays: 12, lastBreak: "2025-11-12" },
  last_updated: new Date().toISOString(),
};

const CONFETTI_COLORS = ["#34d399", "#22d3ee", "#a855f7", "#fcd34d"];

const createConfetti = () => {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const container = document.createElement("div");
  container.className = "teachers-signal-confetti";

  const count = 32;
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement("div");
    piece.className = "teachers-signal-confetti-piece";
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.backgroundColor = color;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(piece);
  }

  document.body.appendChild(container);
  setTimeout(() => {
    container.remove();
  }, 4000);
};

export function TeachersSignalThermometer({
  metrics,
  loading = false,
  onSubmitClick,
  onShareClick,
  onMilestoneShare,
}: TeachersSignalThermometerProps) {
  const milestoneTracker = useRef<Set<number>>(new Set());
  const displayMetrics = metrics ?? FALLBACK_METRICS;
  const progressWidth = Math.min(displayMetrics.progress_pct, 100);

  // A/B test: CTA copy variant
  const ctaCopyVariant = useFeatureFlag('cta_copy_variant');

  // A/B test: Confetti intensity
  const confettiIntensity = useFeatureFlag('confetti_intensity');

  const percentageLabel = useMemo(
    () => `${displayMetrics.progress_pct.toFixed(1)}%`,
    [displayMetrics]
  );

  // CTA copy variants for A/B testing
  const submitButtonCopy = useMemo(() => {
    switch (ctaCopyVariant) {
      case 'urgent':
        return 'Add Your Voice Now';
      case 'community':
        return 'Join Fellow Teachers';
      case 'original':
      default:
        return 'Add Anonymous Signal';
    }
  }, [ctaCopyVariant]);

  const shareButtonCopy = useMemo(() => {
    switch (ctaCopyVariant) {
      case 'urgent':
        return 'Spread The Urgency';
      case 'community':
        return 'Share With Community';
      case 'original':
      default:
        return "Share the Teachers' Signal";
    }
  }, [ctaCopyVariant]);


  useEffect(() => {
    if (!metrics) return;
    metrics.milestones.forEach((milestone) => {
      if (milestone.hit && !milestoneTracker.current.has(milestone.percentage)) {
        milestoneTracker.current.add(milestone.percentage);
        createConfetti();
        onMilestoneShare?.(milestone);

        // Track milestone reached event
        trackEvent('thermometer_milestone_reached', {
          milestone_percentage: milestone.percentage,
          total_stories: metrics.total_stories,
          division_coverage_pct: metrics.division_coverage_pct,
          label: milestone.label,
        });
      }
    });
  }, [metrics, onMilestoneShare]);

  if (loading && !metrics) {
    return (
      <div className="rounded-3xl border border-primary/30 bg-slate-900/70 p-6 space-y-4 animate-pulse">
        <div className="h-4 w-3/4 bg-slate-800 rounded-full" />
        <div className="h-12 w-full bg-slate-800 rounded-full" />
        <div className="h-4 w-1/2 bg-slate-800 rounded-full" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-10 bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-3">
          <div className="h-12 flex-1 bg-slate-800 rounded-xl" />
          <div className="h-12 flex-1 bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Teachers' Signal Thermometer"
      className="rounded-3xl border border-primary/40 bg-gradient-to-br from-slate-900/80 to-slate-900/30 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
    >
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Teachers’ Signal</p>
          <h2 className="text-3xl sm:text-4xl font-semibold mt-2">
            {displayMetrics.total_stories.toLocaleString()} Educators Logged
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Division coverage {displayMetrics.division_coverage_pct.toFixed(1)}% / goal{" "}
            {displayMetrics.coverage_goal_pct}%
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-300">Progress toward {displayMetrics.goal_target.toLocaleString()} stories</span>
            <span className="text-lg font-semibold text-emerald-300">{percentageLabel}</span>
          </div>
          <div className="h-3 rounded-full border border-white/10 bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Division coverage</p>
            <p className="text-2xl font-bold">{displayMetrics.division_coverage_pct.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Goal {displayMetrics.coverage_goal_pct}%</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Stories remaining</p>
            <p className="text-2xl font-bold">
              {Math.max(displayMetrics.goal_target - displayMetrics.total_stories, 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">to goal</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {displayMetrics.milestones.map((milestone) => (
            <div
              key={milestone.percentage}
              className={`rounded-full border px-3 py-1 text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${milestone.hit
                  ? "border-emerald-500/80 bg-emerald-500/20 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/60"
                }`}
            >
              <span>{milestone.label}</span>
              <span className="text-[0.65rem]">{milestone.percentage}%</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              trackEvent('thermometer_cta_click', {
                action: 'submit',
                total_stories: displayMetrics.total_stories,
                progress_pct: displayMetrics.progress_pct,
                ab_test_variant: ctaCopyVariant,
              });
              onSubmitClick();
            }}
            size="lg"
            className="flex-1 min-w-[180px]"
          >
            {submitButtonCopy}
          </Button>
          <Button
            onClick={() => {
              trackEvent('thermometer_cta_click', {
                action: 'share',
                total_stories: displayMetrics.total_stories,
                progress_pct: displayMetrics.progress_pct,
                ab_test_variant: ctaCopyVariant,
              });
              onShareClick();
            }}
            size="lg"
            variant="outline"
            className="flex-1 min-w-[180px] border-white/20 text-white"
          >
            {shareButtonCopy}
          </Button>
        </div>
      </div>
    </section>
  );
}
