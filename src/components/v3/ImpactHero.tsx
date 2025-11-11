import { Button } from "@/components/ui/button";
import { Shield, Volume2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ImpactHeroProps {
  onSubmitClick: () => void;
  totalSignals: number;
}

export function ImpactHero({ onSubmitClick, totalSignals }: ImpactHeroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-breathe" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-breathe-fast" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        {/* Alert badge */}
        <div 
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/20 border border-destructive/40 backdrop-blur-sm transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-destructive animate-pulse" />
          <span className="text-sm font-semibold text-destructive">Notwithstanding Clause Invoked</span>
        </div>

        {/* Main headline */}
        <h1 
          className={`text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight transition-all duration-700 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="block text-foreground/90">
            Your Voice Was
          </span>
          <span className="block mt-2 bg-gradient-to-r from-destructive via-warning to-destructive bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
            Silenced
          </span>
        </h1>

        {/* Subheadline */}
        <p 
          className={`text-2xl sm:text-3xl lg:text-4xl font-semibold transition-all duration-700 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="block text-foreground/80 mb-3">
            But You Can Still
          </span>
          <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Be Heard
          </span>
        </p>

        {/* Supporting text */}
        <p 
          className={`text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Alberta's government used the notwithstanding clause to impose Bill 2, 
          stripping teachers of their constitutional right to bargain. 
          <span className="block mt-3 text-foreground font-semibold">
            This platform gives you back your voice—anonymously, safely, powerfully.
          </span>
        </p>

        {/* Signal counter */}
        <div 
          className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-card/50 border border-border backdrop-blur-sm transition-all duration-700 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Volume2 className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-2xl font-bold text-primary tabular-nums">
            {totalSignals.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            educators have already spoken
          </span>
        </div>

        {/* CTA buttons */}
        <div 
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 transition-all duration-700 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Button
            onClick={onSubmitClick}
            size="lg"
            className="group relative w-full sm:w-auto px-10 py-7 text-xl font-bold rounded-2xl overflow-hidden shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer" />
            
            {/* Content */}
            <div className="relative flex items-center gap-3">
              <Shield className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>Add Your Anonymous Voice</span>
            </div>
          </Button>

          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>100% anonymous • Privacy protected • n≥20 rule</span>
          </div>
        </div>

        {/* Trust indicators */}
        <div 
          className={`flex flex-wrap items-center justify-center gap-6 pt-8 text-sm transition-all duration-700 delay-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Evidence-based</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Non-coordinative</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Independently verified</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
          Learn More
        </span>
        <div className="w-6 h-10 rounded-full border-2 border-primary/40 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
