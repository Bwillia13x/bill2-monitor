import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

interface LiveMeterProps {
  value: number;
  trend: number; // 7-day change
  sparklineData?: number[];
}

export function LiveMeter({ value, trend, sparklineData = [] }: LiveMeterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animate number on mount
  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const isPositiveTrend = trend > 0;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 lg:p-12">
      {/* Main Meter Value */}
      <div className="relative">
        <div 
          className="text-8xl md:text-9xl font-bold tabular-nums tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))',
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {displayValue}
        </div>
        
        {/* Glow effect */}
        <div 
          className="absolute inset-0 blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* Subtitle */}
      <div className="mt-6 text-center">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-200 mb-2">
          Digital Strike Meter
        </h2>
        <p className="text-sm md:text-base text-gray-400 max-w-md">
          Province-wide anonymized dissatisfaction signal
        </p>
      </div>

      {/* 7-day trend */}
      <div className="mt-8 flex items-center gap-3">
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
          isPositiveTrend 
            ? 'bg-blue-500/20 text-blue-300' 
            : 'bg-gray-500/20 text-gray-400'
        }`}>
          {isPositiveTrend ? (
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <TrendingDown className="w-4 h-4" aria-hidden="true" />
          )}
          <span className="text-sm font-medium tabular-nums">
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}
          </span>
          <span className="text-xs opacity-75">7d</span>
        </div>

        {/* Mini sparkline */}
        {sparklineData.length > 0 && (
          <svg 
            width="80" 
            height="24" 
            className="opacity-60"
            aria-label="7-day trend sparkline"
            role="img"
          >
            <polyline
              points={sparklineData.map((val, i) => 
                `${(i / (sparklineData.length - 1)) * 80},${24 - (val / 100) * 24}`
              ).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-400"
            />
          </svg>
        )}
      </div>

      {/* Methodology link */}
      <a 
        href="/methodology"
        className="mt-6 flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-400 transition-colors group"
      >
        <Info className="w-4 h-4" aria-hidden="true" />
        <span className="border-b border-transparent group-hover:border-blue-400">
          Methodology & privacy
        </span>
      </a>
    </div>
  );
}
