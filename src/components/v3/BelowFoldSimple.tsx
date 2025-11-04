import { Shield, Lock, TrendingUp, MapPin, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface District {
  name: string;
  count: number;
  unlocked: boolean;
  threshold: number;
}

interface BelowFoldSimpleProps {
  districts: District[];
  dailyVelocity: number[];
  coveragePercent: number;
  onDownloadPress: () => void;
}

export function BelowFoldSimple({ 
  districts, 
  dailyVelocity, 
  coveragePercent,
  onDownloadPress 
}: BelowFoldSimpleProps) {
  const avgVelocity = dailyVelocity.reduce((a, b) => a + b, 0) / dailyVelocity.length;
  const unlockedCount = districts.filter(d => d.unlocked).length;

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Progress tiles (2-col grid) */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* District Unlocks */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-green-400" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-gray-200">District Unlocks</h3>
            </div>

            <div className="space-y-2">
              <div className="text-4xl font-bold text-green-400 tabular-nums">
                {unlockedCount} / {districts.length}
              </div>
              <p className="text-sm text-gray-400">districts meet n≥20 threshold</p>

              {/* Progress bar */}
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden mt-3">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000"
                  style={{ width: `${coveragePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 7-day Velocity */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-400" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-gray-200">7-Day Velocity</h3>
            </div>

            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-400 tabular-nums">
                {avgVelocity.toFixed(1)}
              </div>
              <p className="text-sm text-gray-400">signals per day (avg)</p>

              {/* Mini sparkline */}
              <div className="flex items-end gap-1 h-16 mt-3">
                {dailyVelocity.map((value, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500/30 rounded-t transition-all hover:bg-blue-500/50"
                    style={{ height: `${(value / Math.max(...dailyVelocity)) * 100}%` }}
                    title={`Day ${i + 1}: ${value} signals`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Press Kit */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-purple-400" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-gray-200">Press Kit</h3>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Auto-updated daily PNG tile (1200×630) for media and union accounts
            </p>

            <Button
              onClick={onDownloadPress}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Press Tile
            </Button>
          </div>
        </div>

        {/* Districts grid with progress */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-200">
              District Progress
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" aria-hidden="true" />
              <span>Privacy threshold: n≥20</span>
            </div>
          </div>

          {/* Grid of districts with progress indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {districts.map((district, i) => {
              const remaining = district.threshold - district.count;
              const progress = (district.count / district.threshold) * 100;
              const nearThreshold = !district.unlocked && district.count >= 15;

              return (
                <div
                  key={i}
                  className={`relative p-3 rounded-lg border transition-all ${
                    district.unlocked
                      ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                      : nearThreshold
                      ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-gray-800/50 border-gray-700 opacity-50'
                  }`}
                  title={
                    district.unlocked 
                      ? `${district.name}: ${district.count} signals` 
                      : nearThreshold
                      ? `${district.name}: ${district.count}/${district.threshold} (${remaining} more needed)`
                      : `${district.name}: Locked`
                  }
                >
                  <div className="text-xs font-medium text-gray-300 mb-1 truncate">
                    {district.name}
                  </div>

                  {district.unlocked ? (
                    // Unlocked: show count
                    <div className="text-lg font-bold text-green-400 tabular-nums">
                      {district.count}
                    </div>
                  ) : nearThreshold ? (
                    // Near threshold: show progress
                    <>
                      <div className="text-sm font-semibold text-amber-400 tabular-nums mb-1">
                        {district.count}/{district.threshold}
                      </div>
                      <div className="relative h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-amber-400 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-amber-300 mt-1">
                        {remaining} more
                      </div>
                    </>
                  ) : (
                    // Locked: show lock icon
                    <div className="flex items-center gap-1 text-gray-600">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                      <span className="text-xs">Locked</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Privacy explanation */}
          <div className="mt-6 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-gray-400">
                <p className="font-medium text-blue-300 mb-1">Why are some districts locked?</p>
                <p>
                  We only display data when at least 20 signals have been received from a district. 
                  This protects individual privacy while showing collective sentiment (k-anonymity principle).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
