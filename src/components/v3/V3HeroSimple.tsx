import { Button } from "@/components/ui/button";
import { Shield, Share2, TrendingUp, Info } from "lucide-react";

interface V3HeroSimpleProps {
  meterValue: number;
  delta7d: number;
  daysRemaining: number;
  onSubmitClick: () => void;
  onShareClick: () => void;
  onMethodologyClick: () => void;
}

export function V3HeroSimple({
  meterValue,
  delta7d,
  daysRemaining,
  onSubmitClick,
  onShareClick,
  onMethodologyClick,
}: V3HeroSimpleProps) {
  return (
    <section 
      className="min-h-screen flex flex-col justify-center px-4 py-12"
      aria-label="Digital Strike Meter"
    >
      <div className="max-w-2xl mx-auto w-full text-center">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-300 mb-8">
          Digital Strike Meter
        </h1>

        {/* Big Number */}
        <div className="mb-6">
          <div 
            className="text-8xl md:text-9xl font-bold tabular-nums mb-2"
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.4))',
            }}
            aria-label={`${meterValue} dissatisfaction signals`}
          >
            {meterValue}
          </div>

          {/* Delta */}
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <TrendingUp className="w-5 h-5 text-blue-400" aria-hidden="true" />
            <span className="text-blue-400 font-semibold">+{delta7d.toFixed(1)}</span>
            <span>7-day avg</span>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl mx-auto">
          Alberta Educator Dissatisfaction <br className="hidden sm:inline" />
          (Anonymous, Real-Time)
        </p>

        {/* Microcopy row */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" aria-hidden="true" />
            <span>100% anonymous</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-600" aria-hidden="true" />
          <div>
            <span>n≥20 privacy rule</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-600" aria-hidden="true" />
          <div>
            <span>evidence-based, non-coordinative</span>
          </div>
          <button
            onClick={onMethodologyClick}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
            aria-label="Learn about our methodology and privacy"
          >
            <Info className="w-4 h-4" />
            <span className="underline">Methodology</span>
          </button>
        </div>

        {/* Countdown */}
        <div className="text-sm text-gray-500 mb-10">
          <span className="font-semibold text-red-400">{daysRemaining.toLocaleString()}</span>
          {" "}days until imposed agreement ends{" "}
          <a 
            href="https://ablawg.ca/2025/10/30/back-to-school-notwithstanding-the-charter/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 hover:text-red-300 underline"
          >
            (Bill 2)
          </a>
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-col gap-4 mb-12">
          {/* Add Signal */}
          <Button
            onClick={onSubmitClick}
            size="lg"
            className="w-full py-6 text-lg font-semibold rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
            }}
            aria-label="Add your anonymous signal to the Digital Strike Meter"
          >
            <Shield className="w-5 h-5 mr-2" aria-hidden="true" />
            Add Anonymous Signal
          </Button>

          {/* Share */}
          <Button
            onClick={onShareClick}
            size="lg"
            variant="outline"
            className="w-full py-6 text-lg font-semibold rounded-xl border-2 border-blue-500/50 bg-transparent hover:bg-blue-500/10 text-blue-300"
            aria-label="Share with 3 colleagues to help unlock your district"
          >
            <Share2 className="w-5 h-5 mr-2" aria-hidden="true" />
            Share With 3 Colleagues
          </Button>
        </div>

        {/* Subtitle for context */}
        <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
          A privacy-safe, non-coordinative signal of working-conditions sentiment.
        </p>
      </div>
    </section>
  );
}
