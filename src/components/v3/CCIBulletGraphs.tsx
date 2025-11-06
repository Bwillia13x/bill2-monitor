import { Info } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";

interface CCIBulletGraphsProps {
  satisfaction: number;
  exhaustion: number;
  totalN: number;
}

export function CCIBulletGraphs({ satisfaction, exhaustion, totalN }: CCIBulletGraphsProps) {
  // Satisfaction: 0-10 scale, higher is better
  // Zones: 0-4 (red), 4-7 (amber), 7-10 (green)
  const satColor = satisfaction >= 7 ? "#10b981" : satisfaction >= 4 ? "#f59e0b" : "#ef4444";
  const satPercent = (satisfaction / 10) * 100;

  // Exhaustion: 0-10 scale, lower is better
  // Zones: 0-4 (green), 4-7 (amber), 7-10 (red)
  const exhColor = exhaustion <= 4 ? "#10b981" : exhaustion <= 7 ? "#f59e0b" : "#ef4444";
  const exhPercent = (exhaustion / 10) * 100;

  return (
    <section className="py-12 px-4 bg-gray-950/30">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-200 mb-2">
            CCI Components
          </h2>
          <p className="text-sm text-gray-400">
            The two scales that inform the Classroom Conditions Index
          </p>
        </div>

        <div className="space-y-8">
          {/* Satisfaction Bullet Graph */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-200">
                  Job Satisfaction
                </h3>
                <InfoTooltip>
                  On a scale of 0-10, how satisfied are you with your job as an educator in Alberta?
                </InfoTooltip>
              </div>
              <div 
                className="text-3xl font-bold tabular-nums"
                style={{ color: satColor }}
              >
                {satisfaction.toFixed(1)}
              </div>
            </div>

            {/* Bullet graph */}
            <div className="relative h-12 rounded-lg overflow-hidden">
              {/* Background zones */}
              <div className="absolute inset-0 flex">
                <div className="flex-[4] bg-red-500/10" />
                <div className="flex-[3] bg-amber-500/10" />
                <div className="flex-[3] bg-green-500/10" />
              </div>

              {/* Value bar */}
              <div 
                className="absolute inset-y-0 left-0 transition-all duration-700 rounded-r"
                style={{ 
                  width: `${satPercent}%`,
                  background: `linear-gradient(90deg, ${satColor}dd 0%, ${satColor} 100%)`,
                  boxShadow: `0 0 20px ${satColor}66`
                }}
              />

              {/* Scale labels */}
              <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium text-gray-400 pointer-events-none">
                <span>0</span>
                <span>4</span>
                <span>7</span>
                <span>10</span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Very dissatisfied</span>
              <span>Very satisfied</span>
            </div>
          </div>

          {/* Exhaustion Bullet Graph */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-200">
                  Work Exhaustion
                </h3>
                <InfoTooltip>
                  On a scale of 0-10, how exhausted are you from work-related demands?
                </InfoTooltip>
              </div>
              <div 
                className="text-3xl font-bold tabular-nums"
                style={{ color: exhColor }}
              >
                {exhaustion.toFixed(1)}
              </div>
            </div>

            {/* Bullet graph */}
            <div className="relative h-12 rounded-lg overflow-hidden">
              {/* Background zones (inverted: low exhaustion is good) */}
              <div className="absolute inset-0 flex">
                <div className="flex-[4] bg-green-500/10" />
                <div className="flex-[3] bg-amber-500/10" />
                <div className="flex-[3] bg-red-500/10" />
              </div>

              {/* Value bar */}
              <div 
                className="absolute inset-y-0 left-0 transition-all duration-700 rounded-r"
                style={{ 
                  width: `${exhPercent}%`,
                  background: `linear-gradient(90deg, ${exhColor}dd 0%, ${exhColor} 100%)`,
                  boxShadow: `0 0 20px ${exhColor}66`
                }}
              />

              {/* Scale labels */}
              <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium text-gray-400 pointer-events-none">
                <span>0</span>
                <span>4</span>
                <span>7</span>
                <span>10</span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Not exhausted</span>
              <span>Completely exhausted</span>
            </div>
          </div>
        </div>

        {/* Sample size note */}
        <div className="text-center mt-6 text-xs text-gray-500">
          Based on n = {totalN.toLocaleString()} responses (past 7 days)
        </div>
      </div>
    </section>
  );
}
