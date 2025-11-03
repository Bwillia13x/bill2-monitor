import { useEffect, useRef, useState } from "react";

interface GiantMeterProps {
  value: number;
  bandHex: string;
}

export function GiantMeter({ value, bandHex }: GiantMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const [anim, setAnim] = useState(clamped);
  const [mounted, setMounted] = useState(false);
  const prev = useRef(clamped);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ease number toward target
  useEffect(() => {
    const start = performance.now();
    const from = prev.current;
    const to = clamped;
    const dur = 1200; // ms - slower, more dramatic
    const ease = (t: number) => 1 - Math.pow(1 - t, 4); // easeOutQuart - more dramatic
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setAnim(from + (to - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    prev.current = clamped;
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const pct = Math.max(0, Math.min(100, anim));
  const angle = (pct / 100) * 360;
  
  // Enhanced gradient with multiple stops for depth
  const ring = `conic-gradient(
    from 0deg,
    ${bandHex} 0deg,
    ${bandHex}ee ${angle * 0.7}deg,
    ${bandHex}bb ${angle}deg,
    hsl(var(--meter-ring-bg)) ${angle}deg 360deg
  )`;
  
  const label =
    clamped >= 60 ? "Critical dissatisfaction" :
    clamped >= 40 ? "Rising dissatisfaction" :
                    "Lower dissatisfaction";

  const statusColor = 
    clamped >= 60 ? "text-red-400" :
    clamped >= 40 ? "text-amber-400" :
                    "text-emerald-400";

  return (
    <section 
      aria-label="Digital Strike Meter" 
      aria-live="polite" 
      className="relative h-full grid place-items-center min-h-[340px] py-10 px-4"
    >
      <div className="relative w-full max-w-[560px] aspect-square mx-auto">
        
        {/* Outer glow layers */}
        <div 
          className="absolute -inset-8 rounded-full opacity-40 blur-3xl motion-reduce:animate-none animate-glow-pulse"
          style={{ 
            background: `radial-gradient(circle at center, ${bandHex}55 0%, transparent 70%)` 
          }} 
        />
        
        {/* Main ring container with glass effect */}
        <div className="absolute inset-0 rounded-full backdrop-blur-sm ring-1 ring-white/10 shadow-2xl overflow-hidden">
          {/* Animated fill ring */}
          <div 
            className="absolute inset-0 rounded-full transition-all duration-1000 ease-out" 
            style={{ background: ring }} 
          />
          
          {/* Inner ring shine */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-transparent to-transparent" />
        </div>
        
        {/* Inner plate with enhanced glass effect */}
        <div className="absolute inset-6 rounded-full bg-card/80 backdrop-blur-md ring-1 ring-white/20 shadow-inner">
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-transparent to-black/20" />
        </div>
        
        {/* Tick marks - refined */}
        <MeterTicks />
        
        {/* Threshold marks at 40 and 60 with labels */}
        <ThresholdMark deg={144} label="40" value={40} />
        <ThresholdMark deg={216} label="60" value={60} />
        
        {/* Enhanced needle with glow */}
        <Needle deg={angle} color={bandHex} mounted={mounted} />
        
        {/* Center content with better hierarchy */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center space-y-3">
            {/* Main number - larger and more dramatic */}
            <div className="relative">
              <div 
                className="text-[8.5rem] sm:text-[10rem] leading-[0.85] font-bold tracking-tighter font-space"
                style={{ 
                  color: bandHex,
                  textShadow: `0 0 40px ${bandHex}66, 0 0 80px ${bandHex}33`,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(pct)}
              </div>
              {/* Subtle reflection */}
              <div 
                className="absolute inset-0 opacity-20 blur-md"
                style={{ color: bandHex }}
              >
                {Math.round(pct)}
              </div>
            </div>
            
            {/* Labels with better spacing */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground/90 tracking-wide uppercase">
                Digital Strike Meter
              </div>
              <div className={`text-xs font-semibold ${statusColor} tracking-wider uppercase`}>
                {label}
              </div>
            </div>
          </div>
        </div>
        
        {/* Ambient halo - more subtle and refined */}
        <div 
          className={`absolute -inset-10 rounded-full opacity-60 motion-reduce:animate-none ${
            clamped >= 60 ? "animate-breathe-fast" : "animate-breathe"
          }`}
          style={{ 
            background: `radial-gradient(circle at center, ${bandHex}18 0%, transparent 60%)` 
          }} 
        />
      </div>

      {/* Critical hazard stripe - enhanced */}
      {clamped >= 60 && (
        <div className="absolute -top-3 left-0 right-0 h-3 opacity-60 rounded-t-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,hsl(var(--danger-red))_0_16px,transparent_16px_32px)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        </div>
      )}
    </section>
  );
}

function MeterTicks() {
  return (
    <div className="absolute inset-8">
      {[...Array(72)].map((_, i) => {
        const major = i % 12 === 0;
        const minor = i % 6 === 0;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 origin-bottom"
            style={{ transform: `rotate(${i * 5}deg) translateY(-46%)` }}
          >
            <div 
              className={`w-[2px] rounded-full ${
                major ? "h-7 bg-[hsl(var(--meter-tick-major))]" : 
                minor ? "h-5 bg-[hsl(var(--meter-tick-minor))] opacity-60" :
                "h-3 bg-[hsl(var(--meter-tick-minor))] opacity-30"
              }`} 
            />
          </div>
        );
      })}
    </div>
  );
}

function ThresholdMark({ deg, label, value }: { deg: number; label: string; value: number }) {
  const color = value >= 60 ? "text-red-400" : "text-amber-400";
  
  return (
    <>
      {/* Enhanced threshold line */}
      <div 
        className="absolute left-1/2 top-1/2 origin-bottom" 
        style={{ transform: `rotate(${deg}deg) translateY(-47%)` }}
      >
        <div className="w-[3px] h-10 bg-gradient-to-b from-transparent via-[hsl(var(--meter-threshold))] to-transparent rounded-full" />
      </div>
      
      {/* Label with background */}
      <div 
        className="absolute left-1/2 top-1/2"
        style={{ transform: `rotate(${deg}deg) translateY(-60%) rotate(${-deg}deg)` }}
      >
        <div className={`text-xs font-bold ${color} px-2 py-0.5 rounded-full bg-black/40 ring-1 ring-white/10 backdrop-blur-sm`}>
          {label}
        </div>
      </div>
    </>
  );
}

function Needle({ deg, color, mounted }: { deg: number; color: string; mounted: boolean }) {
  return (
    <>
      {/* Needle shadow/glow */}
      <div 
        className="absolute left-1/2 top-1/2 origin-bottom transition-transform duration-1000 ease-out motion-reduce:transition-none pointer-events-none"
        style={{ transform: `rotate(${deg}deg) translateY(-42%)` }}
      >
        <div 
          className="w-[6px] h-28 rounded-full blur-md opacity-50" 
          style={{ backgroundColor: color }} 
        />
      </div>
      
      {/* Main needle */}
      <div 
        className={`absolute left-1/2 top-1/2 origin-bottom transition-transform duration-1000 ease-out motion-reduce:transition-none ${
          !mounted ? "opacity-0" : ""
        }`}
        style={{ transform: `rotate(${deg}deg) translateY(-42%)` }}
      >
        <div 
          className="w-[3px] h-28 rounded-full shadow-2xl relative" 
          style={{ 
            background: `linear-gradient(to bottom, ${color} 0%, ${color}dd 50%, ${color}88 100%)` 
          }}
        >
          {/* Needle tip highlight */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
        </div>
      </div>
      
      {/* Center cap */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div 
          className="w-6 h-6 rounded-full ring-2 shadow-lg"
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 20px ${color}88, inset 0 2px 4px rgba(255,255,255,0.3), 0 0 0 2px ${color}66`
          }}
        />
      </div>
    </>
  );
}
