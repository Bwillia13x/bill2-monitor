import { MetricCard } from "./MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";

interface SafeguardMeterProps {
  suppressed: number;
  visible: number;
  share_suppressed: number;
  threshold: number;
  isLoading?: boolean;
}

export function SafeguardMeter({
  suppressed,
  visible,
  share_suppressed,
  threshold,
  isLoading,
}: SafeguardMeterProps) {
  const exportCSV = () => {
    const csv = [
      "Metric,Value",
      `Suppressed Slices,${suppressed}`,
      `Visible Slices,${visible}`,
      `Share Suppressed,${share_suppressed}`,
      `Threshold,${threshold}`,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safeguard_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, 400, 400);

    // Draw donut chart
    const centerX = 200;
    const centerY = 200;
    const radius = 120;
    const innerRadius = 80;

    const percentage = share_suppressed * 100;
    const suppressedAngle = (2 * Math.PI * share_suppressed);

    // Suppressed (red)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + suppressedAngle);
    ctx.arc(centerX, centerY, innerRadius, -Math.PI / 2 + suppressedAngle, -Math.PI / 2, true);
    ctx.closePath();
    ctx.fillStyle = "#ef4444";
    ctx.fill();

    // Visible (green)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2 + suppressedAngle, -Math.PI / 2 + 2 * Math.PI);
    ctx.arc(centerX, centerY, innerRadius, -Math.PI / 2 + 2 * Math.PI, -Math.PI / 2 + suppressedAngle, true);
    ctx.closePath();
    ctx.fillStyle = "#10b981";
    ctx.fill();

    // Center text
    ctx.fillStyle = "#fff";
    ctx.font = "bold 48px Space Grotesk";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(percentage)}%`, centerX, centerY);

    ctx.font = "16px Space Grotesk";
    ctx.fillStyle = "#888";
    ctx.fillText("suppressed", centerX, centerY + 30);

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `safeguard_${new Date().toISOString().split("T")[0]}.png`;
    a.click();
  };

  if (isLoading) {
    return (
      <MetricCard
        title="Privacy Safeguard"
        subtitle="% of potential slices withheld via n-gating"
        tooltip="Shows what percentage of district-level data slices are suppressed to protect individual privacy. Higher percentages indicate stronger privacy protection."
        threshold={threshold}
      >
        <Skeleton className="w-full h-[250px]" />
      </MetricCard>
    );
  }

  const total = suppressed + visible;
  const percentage = Math.round(share_suppressed * 100);

  return (
    <MetricCard
      title="Privacy Safeguard"
      subtitle="% of potential slices withheld via n-gating"
      tooltip="Shows what percentage of district-level data slices are suppressed to protect individual privacy. Higher percentages indicate stronger privacy protection."
      threshold={threshold}
      lastUpdated="~10 min ago"
      onExportCSV={exportCSV}
      onExportPNG={exportPNG}
    >
      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative w-[200px] h-[200px]">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full -rotate-90"
            aria-label={`Privacy safeguard showing ${percentage}% of data slices suppressed for privacy`}
            role="img"
          >
            {/* Background ring */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="20"
            />
            {/* Suppressed (red) */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="hsl(var(--destructive))"
              strokeWidth="20"
              strokeDasharray={`${2 * Math.PI * 80 * share_suppressed} ${2 * Math.PI * 80}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Shield className="h-8 w-8 text-primary mb-2" />
            <div className="text-3xl font-bold">{percentage}%</div>
            <div className="text-xs text-muted-foreground mt-1">suppressed</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6 w-full text-center text-sm">
          <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
            <div className="text-xs text-muted-foreground">Suppressed</div>
            <div className="text-lg font-semibold text-destructive">{suppressed}</div>
          </div>
          <div className="p-2 rounded bg-success/10 border border-success/20">
            <div className="text-xs text-muted-foreground">Visible</div>
            <div className="text-lg font-semibold text-success">{visible}</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4 max-w-[300px]">
          No district-level data shown below n≥{threshold} participants
        </p>
      </div>
    </MetricCard>
  );
}
