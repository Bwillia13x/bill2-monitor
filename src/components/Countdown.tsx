import { InfoTooltip } from "./InfoTooltip";

interface CountdownProps {
  days: number;
  target: Date;
}

export function Countdown({ days, target }: CountdownProps) {
  const dateStr = target.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  
  return (
    <div className="relative h-full grid place-items-center min-h-[300px]">
      {/* Bold gradient ribbon background */}
      <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_30%_10%,hsl(var(--accent)/0.18),transparent_60%),radial-gradient(800px_400px_at_70%_90%,hsl(var(--danger-red)/0.18),transparent_60%)]"/>
      
      <div className="relative w-full p-8">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div className="text-xs uppercase tracking-[.25em] text-muted-foreground flex items-center gap-2">
            Days until lawful strike window
            <InfoTooltip>
              Under <b>Bill 2 — Back to School Act</b>, strike action is prohibited until this window. Unless re‑enacted, Section 33 declarations expire after five years.
            </InfoTooltip>
          </div>
          <div className="text-[11px] text-muted-foreground/70">Target: {dateStr}</div>
        </div>
        
        <div className="mt-4 flex items-end gap-6">
          <div className="text-[7rem] leading-none font-semibold drop-shadow-[0_8px_24px_rgba(0,0,0,.35)]">
            {days}
          </div>
          <div className="pb-3 text-muted-foreground">
            <div className="text-sm">Days remaining</div>
            <div className="text-xs text-muted-foreground/70">America/Edmonton</div>
          </div>
        </div>
        
        {/* Slim progress bar to visualise the wait */}
        <CountdownBar target={target} />
      </div>
    </div>
  );
}

function CountdownBar({ target }: { target: Date }) {
  const now = new Date();
  // For visual only: assume epoch one year ago; replace with real enactment date for production.
  const epoch = new Date(now);
  epoch.setFullYear(epoch.getFullYear() - 1);
  const total = Math.max(1, target.getTime() - epoch.getTime());
  const elapsed = Math.max(0, now.getTime() - epoch.getTime());
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
  
  return (
    <div className="mt-5 h-3 w-full rounded-full bg-white/10 overflow-hidden ring-1 ring-border">
      <div 
        className="h-full bg-gradient-to-r from-primary via-accent to-[hsl(var(--glow-fuchsia))]" 
        style={{ width: `${pct}%` }} 
      />
    </div>
  );
}
