import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

interface CountdownRingProps {
  targetDate: Date;
}

export function CountdownRing({ targetDate }: CountdownRingProps) {
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateDays = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, days));

      // Calculate progress (assuming 4-year term = 1460 days)
      const totalDays = 1460;
      const elapsed = totalDays - days;
      const progressPercent = (elapsed / totalDays) * 100;
      setProgress(Math.min(100, Math.max(0, progressPercent)));
    };

    calculateDays();
    const interval = setInterval(calculateDays, 1000 * 60 * 60); // Update hourly

    return () => clearInterval(interval);
  }, [targetDate]);

  // SVG circle parameters
  const size = 240;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 lg:p-12">
      {/* Countdown Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#ringGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
              filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))',
            }}
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div 
            className="text-6xl md:text-7xl font-bold text-red-400 tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {daysRemaining}
          </div>
          <div className="text-lg md:text-xl text-gray-400 mt-1">
            days
          </div>
        </div>

        {/* Glow effect */}
        <div 
          className="absolute inset-0 blur-3xl opacity-15 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <div className="mt-8 text-center">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-200 mb-2 flex items-center justify-center gap-2">
          <Calendar className="w-6 h-6" aria-hidden="true" />
          Lawful Strike Window
        </h2>
        <p className="text-sm md:text-base text-gray-400 max-w-sm">
          Under Bill 2, educators may legally strike only during this period
        </p>
      </div>

      {/* Additional context */}
      <div className="mt-6 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
        <p className="text-xs text-red-300 text-center max-w-xs">
          Strike window: September 1 - August 31 of contract year
        </p>
      </div>
    </div>
  );
}
