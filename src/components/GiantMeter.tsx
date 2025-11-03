import { useEffect, useRef, useState } from "react";

interface GiantMeterProps {
  value: number;
  bandHex: string;
}

export function GiantMeter({ value, bandHex }: GiantMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const [anim, setAnim] = useState(clamped);
  const prev = useRef(clamped);

  // Ease number toward target
  useEffect(() => {
    const start = performance.now();
    const from = prev.current;
    const to = clamped;
    const dur = 700; // ms
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
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
  const ring = `conic-gradient(${bandHex} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg 360deg)`;
  const label =
    clamped >= 60 ? "Critical dissatisfaction" :
    clamped >= 40 ? "Rising dissatisfaction" :
                    "Lower dissatisfaction";

  return (
    <section 
      aria-label="Digital Strike Meter" 
      aria-live="polite" 
      className="relative h-full grid place-items-center min-h-[300px] py-8"
    >
      <div className="relative w-full max-w-[540px] aspect-square mx-auto">
        {/* Main fill ring with transition */}
        <div 
          className="absolute inset-0 rounded-full transition-[background] duration-700" 
          style={{ background: ring }} 
        />
        
        {/* Inner plate */}
        <div className="absolute inset-4 rounded-full bg-card ring-1 ring-border" />
        
        {/* Tick marks */}
        <MeterTicks />
        
        {/* Threshold marks at 40 and 60 */}
        <ThresholdMark deg={144} label="40" />
        <ThresholdMark deg={216} label="60" />
        
        {/* Needle indicator */}
        <Needle deg={angle} color={bandHex} />
        
        {/* Center content - compressed weight number */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div 
              className="text-[7.5rem] leading-[0.85] font-semibold tracking-tight"
              style={{ 
                color: bandHex,
                fontStretch: "condensed"
              }}
            >
              {Math.round(pct)}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">Digital Strike Meter</div>
            <div className="text-xs text-muted-foreground/70">{label}</div>
          </div>
        </div>
        
        {/* Ambient halo pulse - stronger when red, respects reduced motion */}
        <div 
          className={`absolute -inset-6 rounded-full opacity-70 motion-reduce:animate-none ${
            clamped >= 60 ? "animate-breathe-fast" : "animate-breathe"
          }`}
          style={{ 
            background: `radial-gradient(circle at center, ${bandHex}22 0%, transparent 55%)` 
          }} 
        />
      </div>

      {/* Hazard stripe when red */}
      {clamped >= 60 && (
        <div className="absolute -top-2 left-0 right-0 h-2 opacity-50 rounded-t-2xl bg-[repeating-linear-gradient(45deg,rgba(239,68,68,.9)_0_14px,transparent_14px_28px)]" />
      )}
    </section>
  );
}

function MeterTicks() {
  return (
    <div className="absolute inset-6">
      {[...Array(60)].map((_, i) => {
        const major = i % 10 === 0;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 origin-bottom"
            style={{ transform: `rotate(${i * 6}deg) translateY(-43%)` }}
          >
            <div className={`w-[2px] ${major ? "h-6 bg-white/40" : "h-3 bg-white/20"}`} />
          </div>
        );
      })}
    </div>
  );
}

function ThresholdMark({ deg, label }: { deg: number; label: string }) {
  return (
    <>
      <div 
        className="absolute left-1/2 top-1/2 origin-bottom" 
        style={{ transform: `rotate(${deg}deg) translateY(-44%)` }}
      >
        <div className="w-[3px] h-8 bg-white/60" />
      </div>
      <div 
        className="absolute left-1/2 top-1/2 text-[10px] text-muted-foreground font-medium"
        style={{ transform: `rotate(${deg}deg) translateY(-56%) rotate(${-deg}deg)` }}
      >
        {label}
      </div>
    </>
  );
}

function Needle({ deg, color }: { deg: number; color: string }) {
  return (
    <div 
      className="absolute left-1/2 top-1/2 origin-bottom transition-transform duration-700 ease-out motion-reduce:transition-none"
      style={{ transform: `rotate(${deg}deg) translateY(-40%)` }}
    >
      <div className="w-[3px] h-24 rounded-full" style={{ backgroundColor: color }} />
    </div>
  );
}
