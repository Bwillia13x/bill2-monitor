interface GiantMeterProps {
  value: number;
  bandHex: string;
}

export function GiantMeter({ value, bandHex }: GiantMeterProps) {
  const pct = Math.max(0, Math.min(100, value));
  const angle = (pct / 100) * 360;
  const ring = `conic-gradient(${bandHex} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg 360deg)`;
  const label = pct >= 60 ? "High dissatisfaction" : pct >= 40 ? "Rising dissatisfaction" : "Lower dissatisfaction";
  
  return (
    <section aria-label="Digital Strike Meter" aria-live="polite" className="relative h-full grid place-items-center min-h-[300px] py-8">
      <div className="relative w-full max-w-[520px] aspect-square mx-auto">
        <div className="absolute inset-0 rounded-full" style={{ background: ring }} />
        <div className="absolute inset-4 rounded-full bg-card ring-1 ring-border" />
        
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-[7rem] leading-none font-semibold" style={{ color: bandHex }}>
              {Math.round(value)}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">Digital Strike Meter</div>
            <div className="text-xs text-muted-foreground/70">{label}</div>
          </div>
        </div>
        
        {/* Neon halo */}
        <div className="absolute -inset-6 rounded-full bg-[radial-gradient(circle_at_center,transparent_0,transparent_55%,hsl(var(--accent)/0.08))]" />
      </div>
    </section>
  );
}
