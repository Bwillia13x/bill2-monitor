import { useRef, useEffect, useState } from "react";
import { MetricCard } from "./MetricCard";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyCount {
  day: string;
  count: number;
}

interface VelocitySparklineProps {
  series: DailyCount[];
  last7Avg: number;
  prev7Avg: number;
  delta: number;
  isLoading?: boolean;
  threshold?: number;
}

export function VelocitySparkline({
  series,
  last7Avg,
  prev7Avg,
  delta,
  isLoading,
  threshold = 20,
}: VelocitySparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    day: string;
    count: number;
  } | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !series.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 20;

    ctx.clearRect(0, 0, width, height);

    const maxCount = Math.max(...series.map((d) => d.count), 1);
    const xStep = (width - padding * 2) / (series.length - 1);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    series.forEach((point, i) => {
      const x = padding + i * xStep;
      const y = height - padding - (point.count / maxCount) * (height - padding * 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Fill area under curve
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = "hsla(var(--primary), 0.1)";
    ctx.fill();

    // Draw points
    series.forEach((point, i) => {
      const x = padding + i * xStep;
      const y = height - padding - (point.count / maxCount) * (height - padding * 2);

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "hsl(var(--primary))";
      ctx.fill();
    });
  }, [series]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !series.length) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 20;
    const xStep = (rect.width - padding * 2) / (series.length - 1);

    const index = Math.round((x - padding) / xStep);
    if (index >= 0 && index < series.length) {
      const point = series[index];
      const maxCount = Math.max(...series.map((d) => d.count), 1);
      const pointX = padding + index * xStep;
      const pointY =
        rect.height - padding - (point.count / maxCount) * (rect.height - padding * 2);

      setHoveredPoint({
        x: pointX,
        y: pointY,
        day: new Date(point.day).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count: point.count,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const exportCSV = () => {
    const csv = [
      "Date,Count",
      ...series.map((d) => `${d.day},${d.count}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `velocity_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `velocity_${new Date().toISOString().split("T")[0]}.png`;
    a.click();
  };

  if (isLoading) {
    return (
      <MetricCard
        title="Daily Velocity"
        subtitle="Anonymized pledge activity (14 days)"
        tooltip="Shows daily pledge counts with 7-day moving average. All data is aggregated and anonymized per n≥20 gating policy."
        threshold={threshold}
      >
        <Skeleton className="w-full h-[120px]" />
      </MetricCard>
    );
  }

  const DeltaIcon =
    delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const deltaColor =
    delta > 0
      ? "text-green-500"
      : delta < 0
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <MetricCard
      title="Daily Velocity"
      subtitle="Anonymized pledge activity (14 days)"
      tooltip="Shows daily pledge counts with 7-day moving average. All data is aggregated and anonymized per n≥20 gating policy."
      threshold={threshold}
      lastUpdated="~10 min ago"
      onExportCSV={exportCSV}
      onExportPNG={exportPNG}
    >
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">
            {Math.round(last7Avg * 10) / 10}
          </div>
          <div className={`text-sm flex items-center gap-1 ${deltaColor}`}>
            <DeltaIcon className="h-3 w-3" />
            <span>{Math.abs(Math.round(delta))}%</span>
          </div>
          <div className="text-sm text-muted-foreground">7-day avg</div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-[120px] cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            aria-label="Daily anonymized pledge count sparkline for the last 14 days"
            role="img"
          />
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none bg-popover border border-border px-2 py-1 rounded text-xs shadow-lg"
              style={{
                left: `${hoveredPoint.x}px`,
                top: `${hoveredPoint.y - 40}px`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="font-semibold">{hoveredPoint.day}</div>
              <div className="text-muted-foreground">
                {hoveredPoint.count} pledges
              </div>
            </div>
          )}
        </div>
      </div>
    </MetricCard>
  );
}
