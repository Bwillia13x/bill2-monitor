import { useEffect, useState } from "react";
import { Clock, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UrgencyCountdownProps {
  currentCount: number;
  nextMilestone: number;
  endDate?: Date;
}

export function UrgencyCountdown({ 
  currentCount, 
  nextMilestone,
  endDate = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
}: UrgencyCountdownProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const progress = (currentCount / nextMilestone) * 100;
  const remaining = nextMilestone - currentCount;

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;

      if (distance < 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border-2 border-primary/30 p-6">
      {/* Animated pulse background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Next Milestone</h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full">
            <Clock className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-bold tabular-nums">{timeLeft}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary tabular-nums">
              {remaining.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">voices needed</span>
          </div>

          <Progress value={progress} className="h-3" />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentCount.toLocaleString()} current</span>
            <span>{nextMilestone.toLocaleString()} goal</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">
              At current pace: <span className="font-semibold text-foreground">12 hours to goal</span>
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 Share with just <span className="font-semibold text-primary">3 colleagues</span> to help us reach this faster
          </p>
        </div>
      </div>
    </Card>
  );
}
