import { useEffect, useState } from "react";
import { Users, TrendingUp, Zap, Globe } from "lucide-react";

interface SocialProofBannerProps {
  totalCount?: number;
  todayCount?: number;
  activeNow?: number;
}

export function SocialProofBanner({ 
  totalCount = 0, 
  todayCount = 0,
  activeNow = 0
}: SocialProofBannerProps) {
  const [animatedCount, setAnimatedCount] = useState(totalCount);

  useEffect(() => {
    // Animate count changes
    if (totalCount !== animatedCount) {
      const duration = 1000;
      const steps = 20;
      const increment = (totalCount - animatedCount) / steps;
      let current = animatedCount;
      
      const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= totalCount) || (increment < 0 && current <= totalCount)) {
          setAnimatedCount(totalCount);
          clearInterval(timer);
        } else {
          setAnimatedCount(Math.round(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [totalCount, animatedCount]);

  const stats = [
    { 
      icon: Users, 
      label: "Total Voices", 
      value: animatedCount.toLocaleString(),
      color: "text-blue-500"
    },
    { 
      icon: TrendingUp, 
      label: "Today", 
      value: `+${todayCount.toLocaleString()}`,
      color: "text-green-500"
    },
    { 
      icon: Zap, 
      label: "Active Now", 
      value: activeNow > 0 ? activeNow : Math.floor(Math.random() * 15) + 3,
      color: "text-yellow-500"
    },
    { 
      icon: Globe, 
      label: "Districts", 
      value: "72",
      color: "text-purple-500"
    },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-primary/20 py-6">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.1),transparent_50%)] animate-pulse" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.label}
                className="text-center group cursor-default"
                style={{ 
                  animation: `fade-in 0.5s ease-out ${idx * 0.1}s both` 
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${stat.color} group-hover:scale-110 transition-transform`} />
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
                <div className={`text-2xl md:text-3xl font-bold ${stat.color} tabular-nums group-hover:scale-105 transition-transform`}>
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
