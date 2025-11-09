import { useEffect, useRef } from 'react';
import { useTheme } from '@/components/theme-provider';

interface SparklineDataPoint {
  date: string;
  count: number;
  type: string;
}

interface SparklineProps {
  data: SparklineDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

export function Sparkline({ 
  data, 
  width = 800, 
  height = 200, 
  color,
  strokeWidth = 2 
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Aggregate data by date
    const aggregatedData = aggregateByDate(data);
    
    if (aggregatedData.length === 0) return;

    // Calculate scales
    const maxCount = Math.max(...aggregatedData.map(d => d.count));
    const minCount = Math.min(...aggregatedData.map(d => d.count));
    const countRange = maxCount - minCount || 1;
    
    const xScale = width / (aggregatedData.length - 1 || 1);
    const yScale = (height - 40) / countRange; // Leave space for labels

    // Set colors based on theme
    const lineColor = color || (theme === 'dark' ? '#10b981' : '#059669'); // emerald-500/600
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = theme === 'dark' ? '#94a3b8' : '#64748b'; // slate-400/500

    // Draw grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = 20 + (i * (height - 40) / 4);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Y-axis labels
      const value = Math.round(maxCount - (i * countRange / 4));
      ctx.fillStyle = textColor;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(value.toString(), 30, y + 4);
    }

    // Draw the sparkline
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw line
    ctx.beginPath();
    aggregatedData.forEach((point, index) => {
      const x = index * xScale;
      const y = height - 20 - ((point.count - minCount) * yScale);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = lineColor;
    aggregatedData.forEach((point, index) => {
      const x = index * xScale;
      const y = height - 20 - ((point.count - minCount) * yScale);
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw X-axis labels (dates)
    ctx.fillStyle = textColor;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    const labelCount = Math.min(6, aggregatedData.length);
    for (let i = 0; i < labelCount; i++) {
      const index = Math.floor((i * (aggregatedData.length - 1)) / (labelCount - 1));
      const x = index * xScale;
      const date = new Date(aggregatedData[index].date);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      ctx.fillText(label, x, height - 5);
    }

    // Draw title
    ctx.fillStyle = theme === 'dark' ? '#f1f5f9' : '#1e293b'; // slate-100/800
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Submission Activity', 10, 20);
  }, [data, width, height, color, strokeWidth, theme]);

  return (
    <div className="w-full h-full">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}

// Aggregate data points by date
function aggregateByDate(data: SparklineDataPoint[]): Array<{ date: string; count: number }> {
  const dailyCounts = new Map<string, number>();
  
  data.forEach(point => {
    const date = new Date(point.date).toISOString().split('T')[0];
    dailyCounts.set(date, (dailyCounts.get(date) || 0) + point.count);
  });
  
  return Array.from(dailyCounts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Lightweight alternative using SVG (better for accessibility)
export function SparklineSVG({ 
  data, 
  width = 800, 
  height = 200,
  color 
}: SparklineProps) {
  const { theme } = useTheme();
  
  if (!data || data.length === 0) return null;

  const aggregatedData = aggregateByDate(data);
  const maxCount = Math.max(...aggregatedData.map(d => d.count));
  const minCount = Math.min(...aggregatedData.map(d => d.count));
  const countRange = maxCount - minCount || 1;
  
  const xScale = width / (aggregatedData.length - 1 || 1);
  const yScale = (height - 40) / countRange;
  
  const lineColor = color || (theme === 'dark' ? '#10b981' : '#059669');
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  // Generate path for sparkline
  const pathData = aggregatedData.map((point, index) => {
    const x = index * xScale;
    const y = height - 20 - ((point.count - minCount) * yScale);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <svg 
      width={width} 
      height={height} 
      className="w-full h-full"
      role="img"
      aria-label="Submission activity sparkline"
    >
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map(i => {
        const y = 20 + (i * (height - 40) / 4);
        return (
          <line
            key={i}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke={gridColor}
            strokeWidth={1}
          />
        );
      })}
      
      {/* Sparkline path */}
      <path
        d={pathData}
        stroke={lineColor}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Data points */}
      {aggregatedData.map((point, index) => {
        const x = index * xScale;
        const y = height - 20 - ((point.count - minCount) * yScale);
        
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={3}
            fill={lineColor}
          />
        );
      })}
      
      {/* X-axis labels */}
      {Array.from({ length: Math.min(6, aggregatedData.length) }).map((_, i) => {
        const index = Math.floor((i * (aggregatedData.length - 1)) / (Math.min(6, aggregatedData.length) - 1 || 1));
        const x = index * xScale;
        const date = new Date(aggregatedData[index].date);
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return (
          <text
            key={i}
            x={x}
            y={height - 5}
            textAnchor="middle"
            fill={textColor}
            fontSize="12"
            fontFamily="sans-serif"
          >
            {label}
          </text>
        );
      })}
      
      {/* Title */}
      <text
        x={10}
        y={20}
        textAnchor="start"
        fill={theme === 'dark' ? '#f1f5f9' : '#1e293b'}
        fontSize="14"
        fontFamily="sans-serif"
        fontWeight="bold"
      >
        Submission Activity
      </text>
    </svg>
  );
}