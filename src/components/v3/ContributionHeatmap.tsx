import { useEffect, useRef, useState } from "react";
import { TeacherSignalDailyCount, TeacherSignalStreak } from "@/hooks/useTeacherSignalMetrics";
import { trackEvent } from "@/lib/telemetry";
import { HeatmapTooltip } from "@/components/v3/HeatmapTooltip";

interface ContributionHeatmapProps {
  dailyCounts: TeacherSignalDailyCount[];
  streak?: TeacherSignalStreak;
  loading?: boolean;
  onCellHover?: (date: string, count: number | null) => void;
}

const LEVEL_CLASSES = [
  "bg-slate-800 border border-white/10",
  "bg-emerald-800 border border-emerald-600/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
  "bg-emerald-600 border border-emerald-400/40",
  "bg-cyan-500/90 border border-cyan-400",
  "bg-emerald-400/80 border border-emerald-300",
];

const LEGEND_LABELS = ["0 stories", "Few stories", "Some stories", "Many stories", "Momentum"];

const formatLabel = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: 0 });

export function ContributionHeatmap({
  dailyCounts,
  streak = { currentDays: 0, longestDays: 0, lastBreak: null },
  loading = false,
  onCellHover,
}: ContributionHeatmapProps) {
  const today = new Date().toISOString().split("T")[0];

  // Phase 2: Track heatmap engagement
  const [hoverCount, setHoverCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const mountTime = useRef(Date.now());
  const hasTrackedView = useRef(false);

  // Track heatmap view on mount (once per session)
  useEffect(() => {
    if (!loading && !hasTrackedView.current) {
      hasTrackedView.current = true;
      const userId = localStorage.getItem('ds_funnel_user_id') || 'anonymous';

      trackEvent('heatmap_view', {
        userId,
        totalDays: dailyCounts.length,
        currentStreak: streak.currentDays,
      });
    }
  }, [loading, dailyCounts.length, streak.currentDays]);

  // Track time on heatmap when component unmounts
  useEffect(() => {
    const startTime = mountTime.current;

    return () => {
      if (hasTrackedView.current) {
        const duration = Date.now() - startTime;
        const userId = localStorage.getItem('ds_funnel_user_id') || 'anonymous';

        trackEvent('heatmap_engagement', {
          userId,
          duration,
          hoverCount,
          clickCount,
          engagementScore: hoverCount + clickCount * 2,
        });
      }
    };
  }, [hoverCount, clickCount]);

  const handleCellHover = (date: string, count: number | null) => {
    setHoverCount(prev => prev + 1);

    if (onCellHover) {
      onCellHover(date, count);
    }

    // Track hover event with debouncing (only every 5th hover to reduce noise)
    if (hoverCount % 5 === 0) {
      const userId = localStorage.getItem('ds_funnel_user_id') || 'anonymous';
      trackEvent('heatmap_hover', {
        userId,
        date,
        count,
        totalHovers: hoverCount + 1,
      });
    }
  };

  const handleCellClick = (date: string, count: number | null) => {
    setClickCount(prev => prev + 1);
    const userId = localStorage.getItem('ds_funnel_user_id') || 'anonymous';

    trackEvent('heatmap_click', {
      userId,
      date,
      count,
      totalClicks: clickCount + 1,
    });
  };

  // Track streak view on mount
  useEffect(() => {
    if (!loading && streak.currentDays > 0) {
      trackEvent('heatmap_streak_view', {
        current_days: streak.currentDays,
        longest_days: streak.longestDays,
        has_active_streak: streak.currentDays > 0,
      });
    }
  }, [loading, streak.currentDays, streak.longestDays]);

  const getLevelClass = (count: number | null) => {
    if (count === null) {
      return "bg-slate-900/60 border border-white/10";
    }

    if (count === 0) {
      return LEVEL_CLASSES[0];
    }

    if (count <= 2) {
      return LEVEL_CLASSES[1];
    }
    if (count <= 5) {
      return LEVEL_CLASSES[2];
    }
    if (count <= 10) {
      return LEVEL_CLASSES[3];
    }
    return LEVEL_CLASSES[4];
  };

  const renderLabel = (count: number | null) => {
    if (count === null) {
      return "Week suppressed (<20 submissions)";
    }
    return `${formatLabel(count)} story${count === 1 ? "" : "ies"}`;
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 space-y-4 animate-pulse">
        <div className="h-4 w-1/3 bg-slate-800 rounded-full" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-800 rounded-2xl" />
        </div>
        <div className="grid grid-rows-7 grid-flow-col gap-1">
          {Array.from({ length: 21 }).map((_, index) => (
            <div key={index} className="h-5 w-5 bg-slate-800 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (dailyCounts.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-center text-sm text-muted-foreground">
        Not enough data yet to render the contribution heatmap.
      </div>
    );
  }

  const legendColors = LEVEL_CLASSES;

  return (
    <section className="rounded-3xl border border-primary/20 bg-slate-950/60 p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary/70">Contribution Heatmap</p>
            <p className="text-sm text-muted-foreground">Daily stories over the past year</p>
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-1">
            <p>Streak: <span className="font-semibold text-foreground">{streak.currentDays} days</span></p>
            <p>Longest: <span className="font-semibold text-foreground">{streak.longestDays} days</span></p>
            {streak.lastBreak && (
              <p>
                Last break: <span className="font-semibold text-foreground">{new Date(streak.lastBreak).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="grid grid-rows-7 grid-flow-col gap-1">
            {dailyCounts.map((day) => {
              const isToday = day.date === today;
              return (
                <HeatmapTooltip
                  key={day.date}
                  date={day.date}
                  count={day.count}
                >
                  <button
                    type="button"
                    onMouseEnter={() => handleCellHover(day.date, day.count)}
                    onFocus={() => handleCellHover(day.date, day.count)}
                    onClick={() => handleCellClick(day.date, day.count)}
                    className={`h-6 w-6 rounded-sm transition duration-200 ${getLevelClass(day.count)} ${isToday ? "ring-2 ring-emerald-400" : ""} cursor-pointer`}
                    aria-label={`${day.date}: ${renderLabel(day.count)}`}
                  />
                </HeatmapTooltip>
              );
            })}
          </div>
          <div className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            <span>Less</span>
            <div className="flex flex-col gap-1">
              {legendColors.map((color, idx) => (
                <span key={idx} className="flex items-center gap-2">
                  <span className={`inline-block h-3 w-3 rounded-sm border border-white/30 ${color}`} />
                  {LEGEND_LABELS[idx]}
                </span>
              ))}
            </div>
            <span className="text-left">More</span>
          </div>
        </div>
      </div>
    </section>
  );
}
