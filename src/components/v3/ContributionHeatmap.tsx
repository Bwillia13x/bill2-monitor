import { TeacherSignalDailyCount, TeacherSignalStreak } from "@/hooks/useTeacherSignalMetrics";

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
                <button
                  type="button"
                  key={day.date}
                  onMouseEnter={() => onCellHover?.(day.date, day.count)}
                  onFocus={() => onCellHover?.(day.date, day.count)}
                  className={`h-6 w-6 rounded-sm transition duration-200 ${getLevelClass(day.count)} ${isToday ? "ring-2 ring-emerald-400" : ""}`}
                  aria-label={`${day.date}: ${renderLabel(day.count)}`}
                />
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
