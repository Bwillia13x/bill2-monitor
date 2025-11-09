import { Button } from "@/components/ui/button";
import { Shield, Share2, TrendingUp, TrendingDown, Info } from "lucide-react";
import { CCISparkline } from "./CCISparkline";
import { SuppressionNotice } from "@/components/methods/SuppressionNotice";

interface V3HeroSimpleProps {
  cciValue: number | null;
  cciChange?: number | null;
  totalN: number;
  sparklineData?: Array<{ day: string; cci: number; n: number }>;
  daysRemaining: number;
  onSubmitClick: () => void;
  onShareClick: () => void;
  onMethodologyClick: () => void;
  isSuppressed?: boolean;
}

export function V3HeroSimple({
  cciValue,
  cciChange,
  totalN,
  sparklineData,
  daysRemaining,
  onSubmitClick,
  onShareClick,
  onMethodologyClick,
  isSuppressed = false,
}: V3HeroSimpleProps) {
  const getCCIColor = (cci: number) => {
    if (cci >= 60) return "#3b82f6"; // blue (positive)
    if (cci >= 40) return "#f59e0b"; // amber (neutral)
    return "#ef4444"; // red (negative)
  };

  const getCCILabel = (cci: number) => {
    if (cci >= 60) return "Conditions improving";
    if (cci >= 40) return "Conditions stable";
    return "Conditions worsening";
  };

  // Handle suppressed data
  if (isSuppressed || cciValue === null) {
    return (
      <section 
        className="min-h-screen flex flex-col justify-center px-4 py-12"
        aria-label="Digital Strike Meter - Data Suppressed"
      >
        <div className="max-w-2xl mx-auto w-full">
          <SuppressionNotice n={totalN} threshold={20} />
          
          <div className="text-center mt-8">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-300 mb-6">
              Classroom Conditions Index (CCI)
            </h1>
            
            <p className="text-lg text-gray-400 mb-8">
              Help unlock this data by contributing your anonymous signal.
            </p>

            <div className="flex flex-col gap-4">
              <Button
                onClick={onSubmitClick}
                size="lg"
                className="w-full py-6 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90"
              >
                <Shield className="w-5 h-5 mr-2" />
                Add Anonymous Signal
              </Button>

              <Button
                onClick={onMethodologyClick}
                variant="outline"
                className="w-full py-6 text-lg font-semibold rounded-xl border-2 border-primary/50 bg-transparent hover:bg-primary/10 text-primary"
              >
                <Info className="w-5 h-5 mr-2" />
                Learn About Methodology
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section 
      className="min-h-screen flex flex-col justify-center px-4 py-12"
      aria-label="Digital Strike Meter"
    >
      <div className="max-w-2xl mx-auto w-full text-center">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-300 mb-8">
          Classroom Conditions Index (CCI)
        </h1>

        {/* Big Number */}
        <div className="mb-6">
          <div 
            className="text-8xl md:text-9xl font-bold tabular-nums mb-2"
            style={{
              background: `linear-gradient(135deg, ${getCCIColor(cciValue)} 0%, ${getCCIColor(cciValue)}dd 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: `drop-shadow(0 0 30px ${getCCIColor(cciValue)}66)`,
            }}
            aria-label={`CCI ${cciValue.toFixed(1)} out of 100`}
          >
            {cciValue.toFixed(1)}
          </div>

          {/* Delta */}
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            {cciChange !== null && cciChange !== undefined && (
              <>
                {cciChange >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-blue-400" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" aria-hidden="true" />
                )}
                <span className={cciChange >= 0 ? "text-blue-400 font-semibold" : "text-red-400 font-semibold"}>
                  {cciChange >= 0 ? '+' : ''}{cciChange.toFixed(1)}
                </span>
                <span>vs yesterday</span>
              </>
            )}
          </div>

          {/* CCI Label */}
          <p className="text-sm text-gray-500 mt-2">{getCCILabel(cciValue)}</p>
          <p className="text-xs text-gray-600 mt-1">n = {totalN.toLocaleString()}</p>
        </div>

        {/* 7-day Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mb-6">
            <CCISparkline data={sparklineData} width={320} height={80} showAxis={true} />
          </div>
        )}

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl mx-auto">
          Alberta Educator Sentiment <br className="hidden sm:inline" />
          (Diffusion Index: 0–100, 50 = neutral)
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
