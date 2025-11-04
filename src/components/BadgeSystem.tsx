import { Panel } from "@/components/Panel";
import { Award, Lock, Check } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

// Mock badge data
const BADGES: Badge[] = [
  {
    id: "first-voice",
    name: "First Voice",
    description: "Added your signature to the movement",
    icon: "🎯",
    requirement: "Sign the pledge",
    unlocked: true
  },
  {
    id: "first-share",
    name: "First Share",
    description: "Shared your referral link for the first time",
    icon: "📢",
    requirement: "Share your link once",
    unlocked: true
  },
  {
    id: "network-starter",
    name: "Network Starter",
    description: "Brought 5 educators into the movement",
    icon: "🌱",
    requirement: "5 direct referrals",
    unlocked: true,
    progress: 5,
    maxProgress: 5
  },
  {
    id: "network-builder",
    name: "Network Builder",
    description: "Growing the movement with 20 direct referrals",
    icon: "🏗️",
    requirement: "20 direct referrals",
    unlocked: false,
    progress: 12,
    maxProgress: 20
  },
  {
    id: "network-champion",
    name: "Network Champion",
    description: "Reached 50 direct referrals - you're a movement leader!",
    icon: "🏆",
    requirement: "50 direct referrals",
    unlocked: false,
    progress: 12,
    maxProgress: 50
  },
  {
    id: "storyteller",
    name: "Storyteller",
    description: "Shared your personal story to humanize the cause",
    icon: "📖",
    requirement: "Submit your story",
    unlocked: false
  },
  {
    id: "pulse-tracker",
    name: "Pulse Tracker",
    description: "Checked in with your daily pulse for 7 consecutive days",
    icon: "💓",
    requirement: "7-day pulse streak",
    unlocked: false,
    progress: 3,
    maxProgress: 7
  },
  {
    id: "early-adopter",
    name: "Early Adopter",
    description: "Joined when the movement had fewer than 100 signatures",
    icon: "⭐",
    requirement: "Sign before 100 total",
    unlocked: true
  },
  {
    id: "media-amplifier",
    name: "Media Amplifier",
    description: "Downloaded and shared media kit materials",
    icon: "📰",
    requirement: "Use media kit",
    unlocked: false
  },
  {
    id: "district-leader",
    name: "District Leader",
    description: "Your district reached 50+ signatures",
    icon: "🎓",
    requirement: "50 signatures in district",
    unlocked: false,
    progress: 23,
    maxProgress: 50
  },
  {
    id: "cascade-effect",
    name: "Cascade Effect",
    description: "Your network generated 100+ indirect referrals",
    icon: "🌊",
    requirement: "100 indirect referrals",
    unlocked: false,
    progress: 47,
    maxProgress: 100
  },
  {
    id: "top-50",
    name: "Top 50",
    description: "Ranked in the top 50 network builders",
    icon: "🥇",
    requirement: "Top 50 rank",
    unlocked: true
  }
];

export function BadgeSystem() {
  const unlockedCount = BADGES.filter(b => b.unlocked).length;
  const totalCount = BADGES.length;
  const completionPercentage = (unlockedCount / totalCount) * 100;

  return (
    <Panel className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Award className="size-5 text-primary" />
              Your Achievements
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Unlock badges as you help grow the movement
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {unlockedCount}/{totalCount}
            </div>
            <div className="text-xs text-muted-foreground">Unlocked</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Collection Progress</span>
            <span className="text-muted-foreground">{completionPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {BADGES.map((badge) => (
            <div
              key={badge.id}
              className={`
                relative rounded-xl p-4 text-center transition-all
                ${badge.unlocked
                  ? "bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-primary/30 hover:ring-primary/50"
                  : "bg-muted/30 ring-1 ring-border opacity-60 hover:opacity-80"
                }
              `}
            >
              {/* Badge Icon */}
              <div className="text-4xl mb-2 relative">
                {badge.unlocked ? (
                  <>
                    {badge.icon}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="size-3 text-primary-foreground" />
                    </div>
                  </>
                ) : (
                  <div className="relative">
                    <span className="filter grayscale opacity-40">{badge.icon}</span>
                    <Lock className="absolute inset-0 m-auto size-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Badge Info */}
              <div className="space-y-1">
                <h4 className="font-semibold text-sm leading-tight">{badge.name}</h4>
                <p className="text-xs text-muted-foreground leading-tight">
                  {badge.description}
                </p>
              </div>

              {/* Progress Bar (if applicable) */}
              {!badge.unlocked && badge.progress !== undefined && badge.maxProgress !== undefined && (
                <div className="mt-3 space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {badge.progress}/{badge.maxProgress}
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Requirement */}
              {!badge.unlocked && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {badge.requirement}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Next Badge Spotlight */}
        {BADGES.filter(b => !b.unlocked && b.progress !== undefined).length > 0 && (
          <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-4 border-l-4 border-primary">
            <h4 className="font-semibold text-sm mb-2">Next Badge to Unlock</h4>
            {BADGES.filter(b => !b.unlocked && b.progress !== undefined)
              .sort((a, b) => {
                const aProgress = (a.progress! / a.maxProgress!) * 100;
                const bProgress = (b.progress! / b.maxProgress!) * 100;
                return bProgress - aProgress;
              })[0] && (
              <div className="flex items-center gap-3">
                <div className="text-3xl">{BADGES.filter(b => !b.unlocked && b.progress !== undefined)[0].icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {BADGES.filter(b => !b.unlocked && b.progress !== undefined)[0].name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {BADGES.filter(b => !b.unlocked && b.progress !== undefined)[0].description}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
