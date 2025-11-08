import { Trophy, TrendingUp, Medal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface District {
  name: string;
  count: number;
  cci: number;
  rank: number;
  change?: number;
}

interface DistrictLeaderboardProps {
  districts?: District[];
}

export function DistrictLeaderboard({ districts }: DistrictLeaderboardProps) {
  const mockDistricts: District[] = districts || [
    { name: "Toronto DSB", count: 847, cci: 67, rank: 1, change: 2 },
    { name: "Peel DSB", count: 623, cci: 64, rank: 2, change: -1 },
    { name: "York Region DSB", count: 512, cci: 61, rank: 3, change: 1 },
    { name: "Durham DSB", count: 389, cci: 59, rank: 4 },
    { name: "Halton DSB", count: 301, cci: 58, rank: 5, change: 1 },
  ];

  const maxCount = Math.max(...mockDistricts.map(d => d.count));

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">District Leaderboard</h3>
        <span className="ml-auto text-xs text-muted-foreground">Most Active</span>
      </div>

      <div className="space-y-3">
        {mockDistricts.map((district) => (
          <div 
            key={district.name}
            className="group relative bg-background/50 hover:bg-background/80 border border-border/50 rounded-lg p-3 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 w-8 flex items-center justify-center">
                {getRankIcon(district.rank)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{district.name}</span>
                  {district.change !== undefined && district.change !== 0 && (
                    <span className={`text-xs flex items-center gap-0.5 ${
                      district.change > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      <TrendingUp className={`w-3 h-3 ${district.change < 0 ? 'rotate-180' : ''}`} />
                      {Math.abs(district.change)}
                    </span>
                  )}
                </div>
                <Progress 
                  value={(district.count / maxCount) * 100} 
                  className="h-1.5 mt-1"
                />
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold tabular-nums">{district.count}</div>
                <div className="text-xs text-muted-foreground">CCI {district.cci}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          Is your district falling behind? <span className="text-primary font-medium cursor-pointer hover:underline">Share to catch up</span>
        </p>
      </div>
    </Card>
  );
}
