import { useMemo } from "react";

interface CCISparklineProps {
  data: Array<{ day: string; cci: number; n: number }>;
  width?: number;
  height?: number;
  showAxis?: boolean;
}

export function CCISparkline({ 
  data, 
  width = 320, 
  height = 80,
  showAxis = true 
}: CCISparklineProps) {
  const { path, points, minY, maxY } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: "", points: [], minY: 0, maxY: 100 };
    }

    const padding = 10;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Use fixed scale 0-100 for CCI
    const minY = 0;
    const maxY = 100;
    const yRange = maxY - minY;

    const xStep = chartWidth / (data.length - 1);

    const points = data.map((d, i) => ({
      x: padding + i * xStep,
      y: padding + chartHeight - ((d.cci - minY) / yRange) * chartHeight,
      cci: d.cci,
      day: d.day,
      n: d.n,
    }));

    const path = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
      .join(' ');

    return { path, points, minY, maxY };
  }, [data, width, height]);

  const getZoneColor = (cci: number) => {
    if (cci < 40) return "#ef4444"; // red
    if (cci < 60) return "#f59e0b"; // amber
    return "#3b82f6"; // blue
  };

  const getZoneFill = (cci: number) => {
    if (cci < 40) return "rgba(239, 68, 68, 0.1)";
    if (cci < 60) return "rgba(245, 158, 11, 0.1)";
    return "rgba(59, 130, 246, 0.1)";
  };

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-sm text-gray-500"
        style={{ width, height }}
      >
        Insufficient data for sparkline
      </div>
    );
  }

  const latestCCI = data[data.length - 1]?.cci ?? 50;
  const lineColor = getZoneColor(latestCCI);

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        aria-label={`CCI trend over last ${data.length} days`}
      >
        {/* Zone reference lines */}
        {showAxis && (
          <>
            {/* Red zone line (40) */}
            <line
              x1={10}
              y1={height - 10 - ((40 / 100) * (height - 20))}
              x2={width - 10}
              y2={height - 10 - ((40 / 100) * (height - 20))}
              stroke="#ef4444"
              strokeWidth={0.5}
              strokeDasharray="2,2"
              opacity={0.3}
            />
            {/* Neutral line (50) */}
            <line
              x1={10}
              y1={height - 10 - ((50 / 100) * (height - 20))}
              x2={width - 10}
              y2={height - 10 - ((50 / 100) * (height - 20))}
              stroke="#6b7280"
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.5}
            />
            {/* Blue zone line (60) */}
            <line
              x1={10}
              y1={height - 10 - ((60 / 100) * (height - 20))}
              x2={width - 10}
              y2={height - 10 - ((60 / 100) * (height - 20))}
              stroke="#3b82f6"
              strokeWidth={0.5}
              strokeDasharray="2,2"
              opacity={0.3}
            />
          </>
        )}

        {/* Gradient fill under line */}
        <defs>
          <linearGradient id="cciGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Fill area under line */}
        {path && (
          <path
            d={`${path} L ${points[points.length - 1].x},${height - 10} L ${points[0].x},${height - 10} Z`}
            fill="url(#cciGradient)"
          />
        )}

        {/* Main line */}
        <path
          d={path}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: `drop-shadow(0 0 6px ${lineColor}66)`,
          }}
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r={3}
              fill={getZoneColor(point.cci)}
              stroke="#0a0a0a"
              strokeWidth={1.5}
            />
            <title>
              {new Date(point.day).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}: CCI {point.cci.toFixed(1)} (n={point.n})
            </title>
          </g>
        ))}
      </svg>

      {/* Legend */}
      {showAxis && (
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>&lt;40 Worsening</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>40-60 Stable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>&gt;60 Improving</span>
          </div>
        </div>
      )}
    </div>
  );
}
