import { useEffect, useState } from "react";
import { TrendingUp, MapPin, Clock } from "lucide-react";

interface Activity {
  id: string;
  type: "submission" | "milestone";
  district?: string;
  timeAgo: string;
  count?: number;
}

export function LiveActivityTicker() {
  const [activities, setActivities] = useState<Activity[]>([
    { id: "1", type: "submission", district: "Toronto District", timeAgo: "2m ago" },
    { id: "2", type: "submission", district: "Peel District", timeAgo: "3m ago" },
    { id: "3", type: "milestone", timeAgo: "5m ago", count: 1000 },
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      const districts = ["Toronto", "Peel", "York", "Durham", "Halton", "Hamilton"];
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: Math.random() > 0.9 ? "milestone" : "submission",
        district: districts[Math.floor(Math.random() * districts.length)] + " District",
        timeAgo: "Just now",
      };
      
      setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
    }, 8000 + Math.random() * 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-foreground">Live Activity</span>
      </div>
      
      <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
        {activities.map((activity, idx) => (
          <div 
            key={activity.id}
            className="flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-top-2"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {activity.type === "submission" ? (
              <>
                <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="truncate">Educator from <span className="font-medium text-foreground">{activity.district}</span> just submitted</span>
              </>
            ) : (
              <>
                <span className="text-primary font-bold">🎉</span>
                <span><span className="font-medium text-foreground">{activity.count}</span> voices milestone reached!</span>
              </>
            )}
            <Clock className="w-3 h-3 ml-auto flex-shrink-0" />
            <span className="text-xs opacity-60">{activity.timeAgo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
