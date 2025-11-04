import { useState, useEffect } from "react";
import { Panel } from "@/components/Panel";
import { Play, Pause, RotateCcw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataPoint {
  date: string;
  count: number;
  milestone?: string;
}

// Mock historical data
const GROWTH_DATA: DataPoint[] = [
  { date: "Oct 1", count: 0 },
  { date: "Oct 3", count: 5 },
  { date: "Oct 5", count: 12 },
  { date: "Oct 7", count: 23 },
  { date: "Oct 9", count: 34 },
  { date: "Oct 11", count: 48 },
  { date: "Oct 13", count: 67, milestone: "First 50!" },
  { date: "Oct 15", count: 82 },
  { date: "Oct 17", count: 98 },
  { date: "Oct 19", count: 115, milestone: "100+ voices" },
  { date: "Oct 21", count: 132 },
  { date: "Oct 23", count: 145 },
  { date: "Today", count: 145 }
];

export function GrowthTimelapse() {
  const [currentIndex, setCurrentIndex] = useState(GROWTH_DATA.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    if (currentIndex >= GROWTH_DATA.length - 1) {
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= GROWTH_DATA.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 500); // Advance every 500ms

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex]);

  const handlePlayPause = () => {
    if (currentIndex >= GROWTH_DATA.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const currentData = GROWTH_DATA[currentIndex];
  const visibleData = GROWTH_DATA.slice(0, currentIndex + 1);
  const maxCount = Math.max(...GROWTH_DATA.map(d => d.count));

  // Calculate growth rate
  const growthRate = currentIndex > 0
    ? ((currentData.count - GROWTH_DATA[0].count) / Math.max(currentIndex, 1)).toFixed(1)
    : "0.0";

  return (
    <Panel className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Movement Growth Timeline
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Watch how the movement has grown over time
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              disabled={currentIndex === 0}
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Current Stats Display */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 text-center ring-1 ring-primary/20">
            <div className="text-3xl font-bold text-primary">{currentData.count}</div>
            <div className="text-xs text-muted-foreground mt-1">Signatures</div>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{currentData.date}</div>
            <div className="text-xs text-muted-foreground mt-1">Date</div>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-500">+{growthRate}</div>
            <div className="text-xs text-muted-foreground mt-1">Avg. daily growth</div>
          </div>
        </div>

        {/* Milestone Alert */}
        {currentData.milestone && (
          <div className="bg-gradient-to-r from-amber-500/20 to-transparent rounded-xl p-4 border-l-4 border-amber-500 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <div>
                <div className="font-semibold">{currentData.milestone}</div>
                <div className="text-xs text-muted-foreground">Milestone reached on {currentData.date}</div>
              </div>
            </div>
          </div>
        )}

        {/* Graph Visualization */}
        <div className="relative bg-muted/20 rounded-xl p-6 h-64">
          <div className="relative h-full flex items-end justify-between gap-1">
            {visibleData.map((point, index) => {
              const height = (point.count / maxCount) * 100;
              const isLatest = index === currentIndex;
              
              return (
                <div
                  key={index}
                  className="relative flex-1 flex flex-col items-center justify-end group"
                >
                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      isLatest
                        ? "bg-gradient-to-t from-primary to-primary/80 ring-2 ring-primary"
                        : "bg-gradient-to-t from-primary/60 to-primary/40"
                    }`}
                    style={{ height: `${height}%` }}
                  >
                    {/* Value label on hover */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-background/95 backdrop-blur-sm px-2 py-1 rounded-md ring-1 ring-border text-xs font-medium whitespace-nowrap shadow-lg">
                        {point.count}
                      </div>
                    </div>
                  </div>
                  
                  {/* Date label (show every few bars to avoid crowding) */}
                  {index % Math.ceil(visibleData.length / 6) === 0 && (
                    <div className="absolute -bottom-6 text-xs text-muted-foreground whitespace-nowrap">
                      {point.date}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Timeline Progress</span>
            <span className="text-muted-foreground">
              Day {currentIndex + 1} of {GROWTH_DATA.length}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={GROWTH_DATA.length - 1}
            value={currentIndex}
            onChange={(e) => {
              setCurrentIndex(parseInt(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-sm font-medium mb-1">Fastest Growth Period</div>
            <div className="text-xs text-muted-foreground">
              Oct 11-13: <span className="text-primary font-semibold">+19 signatures</span> in 2 days
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-sm font-medium mb-1">Projected Milestone</div>
            <div className="text-xs text-muted-foreground">
              At current rate: <span className="text-primary font-semibold">200 signatures by Nov 1</span>
            </div>
          </div>
        </div>

        {/* Share prompt */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Share this growth story to show the momentum we're building together
          </p>
          <Button variant="outline" size="sm" className="gap-2">
            <TrendingUp className="size-4" />
            Share Growth Chart
          </Button>
        </div>
      </div>
    </Panel>
  );
}
