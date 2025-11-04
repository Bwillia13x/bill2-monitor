import { MetricCard } from "./MetricCard";
import { Skeleton } from "@/components/ui/skeleton";

interface CoverageDialProps {
  covered: number;
  observed: number;
  ratio: number;
  threshold: number;
  isLoading?: boolean;
}

export function CoverageDial({
  covered,
  observed,
  ratio,
  threshold,
  isLoading,
}: CoverageDialProps) {
  const exportCSV = () => {
    const csv = [
      "Metric,Value",
      `Covered Districts,${covered}`,
      `Observed Districts,${observed}`,
      `Coverage Ratio,${ratio}`,
      `Threshold,${threshold}`,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coverage_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    // For PNG export, we'll need to render to canvas
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, 400, 300);

    // Draw semi-circle gauge
    const centerX = 200;
    const centerY = 200;
    const radius = 100;
    const percentage = ratio * 100;
    const angle = (Math.PI * percentage) / 100;

    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 20;
    ctx.stroke();

    // Progress arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + angle, false);
    ctx.strokeStyle = percentage >= 70 ? "#10b981" : percentage >= 40 ? "#f59e0b" : "#ef4444";
    ctx.lineWidth = 20;
    ctx.stroke();

    // Text
    ctx.fillStyle = "#fff";
    ctx.font = "bold 48px Space Grotesk";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(percentage)}%`, centerX, centerY - 20);

    ctx.font = "16px Space Grotesk";
    ctx.fillStyle = "#888";
    ctx.fillText(`${covered} of ${observed} districts`, centerX, centerY + 20);

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `coverage_${new Date().toISOString().split("T")[0]}.png`;
    a.click();
  };

  if (isLoading) {
    return (
      <MetricCard
        title="Geographic Coverage"
        subtitle="Districts meeting privacy threshold"
        tooltip="Shows the percentage of observed school districts that have enough participants (n≥threshold) to display aggregate data."
        threshold={threshold}
      >
        <Skeleton className="w-full h-[200px]" />
      </MetricCard>
    );
  }

  if (observed < 3) {
    return (
      <MetricCard
        title="Geographic Coverage"
        subtitle="Districts meeting privacy threshold"
        tooltip="Shows the percentage of observed school districts that have enough participants (n≥threshold) to display aggregate data."
        threshold={threshold}
      >
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          Insufficient observed districts to display coverage data
        </div>
      </MetricCard>
    );
  }

  const percentage = Math.round(ratio * 100);
  const angle = (Math.PI * ratio);

  return (
    <MetricCard
      title="Geographic Coverage"
      subtitle="Districts meeting privacy threshold"
      tooltip="Shows the percentage of observed school districts that have enough participants (n≥threshold) to display aggregate data."
      threshold={threshold}
      lastUpdated="~10 min ago"
      onExportCSV={exportCSV}
      onExportPNG={exportPNG}
    >
      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative w-[200px] h-[120px]">
          <svg
            viewBox="0 0 200 120"
            className="w-full h-full"
            aria-label={`Coverage gauge showing ${percentage}% of districts meeting threshold`}
            role="img"
          >
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${angle * 80} ${Math.PI * 80}`}
              className="transition-all duration-1000 ease-out"
              style={{
                animation: "none",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
            <div className="text-4xl font-bold">{percentage}%</div>
            <div className="text-xs text-muted-foreground mt-1">coverage</div>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-4">
          {covered} of {observed} districts meeting n≥{threshold}
        </div>
      </div>
    </MetricCard>
  );
}
