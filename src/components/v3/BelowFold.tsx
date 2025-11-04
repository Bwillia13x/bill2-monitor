import { Shield, Lock, TrendingUp, MapPin, MessageSquare } from "lucide-react";

interface District {
  name: string;
  count: number;
  unlocked: boolean;
}

interface BelowFoldProps {
  districts: District[];
  dailyVelocity: number[];
  coveragePercent: number;
  voices: Array<{ quote: string; attribution: string }>;
}

export function BelowFold({ districts, dailyVelocity, coveragePercent, voices }: BelowFoldProps) {
  const avgVelocity = dailyVelocity.reduce((a, b) => a + b, 0) / dailyVelocity.length;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-transparent to-gray-950/50">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-100 mb-3">
            Movement Progress
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Real-time evidence of educator sentiment across Alberta, 
            displayed only where privacy thresholds are met
          </p>
        </div>

        {/* Mini cards grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Daily Velocity Card */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200">Daily Velocity</h3>
            </div>

            <div className="space-y-3">
              <div className="text-4xl font-bold text-blue-400 tabular-nums">
                {avgVelocity.toFixed(1)}
              </div>
              <p className="text-sm text-gray-400">signals per day (7-day avg)</p>

              {/* Mini bar chart */}
              <div className="flex items-end gap-1 h-20">
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

          {/* Coverage Card */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MapPin className="w-5 h-5 text-green-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200">Coverage</h3>
            </div>

            <div className="space-y-3">
              <div className="text-4xl font-bold text-green-400 tabular-nums">
                {coveragePercent}%
              </div>
              <p className="text-sm text-gray-400">districts unlocked</p>

              {/* Progress bar */}
              <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000"
                  style={{ width: `${coveragePercent}%` }}
                />
              </div>

              <p className="text-xs text-gray-500">
                {districts.filter(d => d.unlocked).length} of {districts.length} districts meet threshold
              </p>
            </div>
          </div>

          {/* Voices Card */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MessageSquare className="w-5 h-5 text-purple-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200">Voices</h3>
            </div>

            <div className="space-y-3">
              {voices.slice(0, 1).map((voice, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm text-gray-300 italic line-clamp-3">
                    "{voice.quote}"
                  </p>
                  <p className="text-xs text-gray-500">
                    — {voice.attribution}
                  </p>
                </div>
              ))}

              <a
                href="/voices"
                className="inline-flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Read more voices →
              </a>
            </div>
          </div>
        </div>

        {/* Districts map/grid */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-200">
              Districts Unlocked
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" aria-hidden="true" />
              <span>Privacy threshold: n≥20</span>
            </div>
          </div>

          {/* Grid of districts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {districts.map((district, i) => (
              <div
                key={i}
                className={`relative p-3 rounded-lg border transition-all ${
                  district.unlocked
                    ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
                    : 'bg-gray-800/50 border-gray-700 opacity-50'
                }`}
                title={district.unlocked ? `${district.name}: ${district.count} signals` : `${district.name}: Locked (threshold not met)`}
              >
                {district.unlocked ? (
                  <>
                    <div className="text-xs font-medium text-gray-300 mb-1 truncate">
                      {district.name}
                    </div>
                    <div className="text-lg font-bold text-blue-400 tabular-nums">
                      {district.count}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-medium text-gray-500 mb-1 truncate">
                      {district.name}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                      <span className="text-xs">Locked</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Privacy explanation */}
          <div className="mt-6 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-gray-400">
                <p className="font-medium text-blue-300 mb-1">Why are some districts locked?</p>
                <p>
                  We only display data when at least 20 signals have been received from a district. 
                  This protects individual privacy while showing collective sentiment.{' '}
                  <a href="/methodology" className="text-blue-400 hover:underline">
                    Learn more about our methodology
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
