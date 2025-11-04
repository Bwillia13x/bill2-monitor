import { LiveMeter } from "./LiveMeter";
import { CountdownRing } from "./CountdownRing";
import { Button } from "@/components/ui/button";
import { Shield, Eye } from "lucide-react";

interface V3HeroProps {
  meterValue: number;
  meterTrend: number;
  sparklineData?: number[];
  targetDate: Date;
  onSubmitClick: () => void;
  onEvidenceClick: () => void;
}

export function V3Hero({
  meterValue,
  meterTrend,
  sparklineData,
  targetDate,
  onSubmitClick,
  onEvidenceClick,
}: V3HeroProps) {
  return (
    <section 
      className="min-h-screen flex flex-col justify-center px-4 py-12 lg:py-16"
      aria-label="Digital Strike overview"
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Two-tile hero grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Left tile: Meter (dominant) */}
          <div 
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(17, 24, 39, 0.5) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              boxShadow: '0 0 40px rgba(59, 130, 246, 0.1)',
            }}
          >
            <LiveMeter 
              value={meterValue}
              trend={meterTrend}
              sparklineData={sparklineData}
            />
          </div>

          {/* Right tile: Countdown */}
          <div 
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.3) 0%, rgba(17, 24, 39, 0.5) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.1)',
            }}
          >
            <CountdownRing targetDate={targetDate} />
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
          {/* Primary CTA */}
          <Button
            onClick={onSubmitClick}
            size="lg"
            className="w-full sm:w-auto px-8 py-6 text-lg font-semibold rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
            }}
            aria-label="Add your anonymous signal to the Digital Strike"
          >
            <Shield className="w-5 h-5 mr-2" aria-hidden="true" />
            Add My Anonymous Signal
          </Button>

          {/* Secondary CTA */}
          <Button
            onClick={onEvidenceClick}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto px-8 py-6 text-lg font-semibold rounded-xl border-2 border-gray-600 bg-transparent hover:bg-gray-800/50 text-gray-200"
            aria-label="View evidence and educator voices"
          >
            <Eye className="w-5 h-5 mr-2" aria-hidden="true" />
            See Evidence & Voices
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <span>100% Anonymous</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-600" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <span>Privacy threshold: n≥20</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-600" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <span>Evidence-based, non-coordinative</span>
          </div>
        </div>
      </div>
    </section>
  );
}
