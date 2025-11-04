import { MetricCard } from "./MetricCard";
import { Skeleton } from "@/components/ui/skeleton";

interface PollDistribution {
  score: number;
  count: number;
  total: number;
  percentage: number;
}

interface DispersionBarProps {
  distribution: PollDistribution[];
  isLoading?: boolean;
  threshold?: number;
}

const LIKERT_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
];

const LIKERT_COLORS = [
  "hsl(var(--destructive))",
  "hsl(var(--warning))",
  "hsl(var(--muted))",
  "hsl(var(--success))",
  "hsl(var(--primary))",
];

export function DispersionBar({
  distribution,
  isLoading,
  threshold = 20,
}: DispersionBarProps) {
  const exportCSV = () => {
    const csv = [
      "Score,Label,Count,Percentage",
      ...distribution.map(
        (d) =>
          `${d.score},${LIKERT_LABELS[d.score - 1]},${d.count},${d.percentage.toFixed(1)}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dispersion_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, 600, 400);

    const barHeight = 40;
    const startY = 80;
    const maxWidth = 500;
    const startX = 80;

    distribution.forEach((d, i) => {
      const width = (d.percentage / 100) * maxWidth;
      const y = startY + i * (barHeight + 10);

      ctx.fillStyle = LIKERT_COLORS[i];
      ctx.fillRect(startX, y, width, barHeight);

      ctx.fillStyle = "#fff";
      ctx.font = "14px Space Grotesk";
      ctx.textAlign = "left";
      ctx.fillText(LIKERT_LABELS[i], 10, y + 25);

      ctx.textAlign = "right";
      ctx.fillText(`${d.percentage.toFixed(1)}%`, startX + maxWidth + 20, y + 25);
    });

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `dispersion_${new Date().toISOString().split("T")[0]}.png`;
    a.click();
  };

  if (isLoading) {
    return (
      <MetricCard
        title="Response Distribution"
        subtitle="Aggregate sentiment breakdown (Likert 1-5)"
        tooltip="Shows the distribution of responses across a 5-point scale. Only published when n≥20 responses are collected."
        threshold={threshold}
      >
        <Skeleton className="w-full h-[280px]" />
      </MetricCard>
    );
  }

  return (
    <MetricCard
      title="Response Distribution"
      subtitle="Aggregate sentiment breakdown (Likert 1-5)"
      tooltip="Shows the distribution of responses across a 5-point scale. Only published when n≥20 responses are collected."
      threshold={threshold}
      lastUpdated="~10 min ago"
      onExportCSV={exportCSV}
      onExportPNG={exportPNG}
    >
      <div className="space-y-3 py-2">
        {distribution.map((item, index) => (
          <div key={item.score} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {item.score}. {LIKERT_LABELS[index]}
              </span>
              <span className="font-medium">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="relative h-6 bg-muted rounded-md overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: LIKERT_COLORS[index],
                }}
                aria-label={`${LIKERT_LABELS[index]}: ${item.percentage.toFixed(1)}% of responses`}
              />
              {item.percentage > 10 && (
                <div className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white">
                  {item.count}
                </div>
              )}
            </div>
          </div>
        ))}
        <div className="text-xs text-muted-foreground text-right pt-2 border-t border-border/50">
          Total responses: {distribution[0]?.total || 0}
        </div>
      </div>
    </MetricCard>
  );
}
