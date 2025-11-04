import { Button } from "@/components/ui/button";
import { Shield, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PulsingCTAProps {
  onClick?: () => void;
  disabled?: boolean;
  isPending?: boolean;
  variant?: "primary" | "secondary";
  currentCount?: number;
  targetCount?: number;
}

export function PulsingCTA({ 
  onClick, 
  disabled, 
  isPending,
  variant = "primary",
  currentCount = 0,
  targetCount = 10000
}: PulsingCTAProps) {
  const progress = Math.min((currentCount / targetCount) * 100, 100);
  
  return (
    <div className="relative">
      {/* Pulsing background effect */}
      <div className="absolute inset-0 animate-pulse-slow">
        <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
      </div>

      <div className="relative bg-gradient-to-br from-primary/10 via-background to-background rounded-2xl p-8 ring-1 ring-primary/20">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Our Collective Voice
            </span>
            <span className="text-sm text-muted-foreground">
              {currentCount.toLocaleString()} / {targetCount.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main CTA */}
        <div className="text-center space-y-4">
          <h3 className="text-3xl font-bold leading-tight">
            Stand Up for Your Rights
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join {currentCount.toLocaleString()} Alberta educators in making your voice heard. 
            Pledge anonymously and help us reach {targetCount.toLocaleString()} voices for fairness.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button
              onClick={onClick}
              disabled={disabled || isPending}
              size="lg"
              className={cn(
                "text-lg px-8 py-6 rounded-xl font-semibold shadow-lg transition-all duration-300",
                "hover:scale-105 hover:shadow-xl",
                variant === "primary" 
                  ? "bg-primary hover:bg-primary/90 animate-pulse-subtle" 
                  : "bg-secondary hover:bg-secondary/90"
              )}
            >
              {isPending ? "Adding Your Voice..." : "Pledge Anonymously Now"}
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="size-4 text-primary" />
              <span>100% Anonymous</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4 text-primary" />
              <span>Privacy Protected</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="size-4 text-primary" />
              <span>Real-time Impact</span>
            </div>
          </div>

          {/* Privacy note */}
          <p className="text-xs text-muted-foreground pt-4 max-w-xl mx-auto">
            Your signature is completely anonymous. We only publish aggregated data and never show 
            slices with fewer than 20 participants to protect individual privacy.
          </p>
        </div>
      </div>

      {/* Add custom animation to global CSS */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
