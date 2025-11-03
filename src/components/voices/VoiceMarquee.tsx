import { useOneLiners, useOneLinerCount } from "@/hooks/useVoices";
import { meetsThreshold } from "@/lib/gating";

export function VoiceMarquee() {
  const { data: count } = useOneLinerCount();
  const { data: oneLiners } = useOneLiners(12);

  if (!count || !meetsThreshold(count) || !oneLiners || oneLiners.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border overflow-hidden motion-reduce:hidden">
      <div className="py-2 px-4 flex items-center gap-2">
        <div className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          What educators are saying:
        </div>
        <div className="relative flex overflow-hidden">
          <div className="flex animate-[scroll_40s_linear_infinite] gap-8">
            {[...oneLiners, ...oneLiners].map((quote, idx) => (
              <div key={`${quote.id}-${idx}`} className="shrink-0 text-sm text-foreground">
                "{quote.text}"
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
