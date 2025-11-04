import { useState, useEffect } from "react";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Users, Sparkles, Share2, X } from "lucide-react";

interface Milestone {
  id: string;
  threshold: number;
  title: string;
  description: string;
  reward: string;
  achieved: boolean;
  achievedDate?: string;
  icon: string;
}

const MILESTONES: Milestone[] = [
  {
    id: "first-50",
    threshold: 50,
    title: "First 50 Voices",
    description: "The movement begins - 50 educators have spoken",
    reward: "Initial media outreach launched",
    achieved: true,
    achievedDate: "Oct 13, 2024",
    icon: "🎯"
  },
  {
    id: "first-100",
    threshold: 100,
    title: "Century Mark",
    description: "100 educators standing together",
    reward: "Press release distributed to major outlets",
    achieved: true,
    achievedDate: "Oct 19, 2024",
    icon: "💯"
  },
  {
    id: "next-200",
    threshold: 200,
    title: "200 Strong",
    description: "Doubling our collective voice",
    reward: "Full-page ad in Edmonton Journal",
    achieved: false,
    icon: "📰"
  },
  {
    id: "next-500",
    threshold: 500,
    title: "Half a Thousand",
    description: "500 educators demanding to be heard",
    reward: "Provincial media campaign + MLA briefing",
    achieved: false,
    icon: "🏛️"
  },
  {
    id: "next-1000",
    threshold: 1000,
    title: "One Thousand Voices",
    description: "A movement that cannot be ignored",
    reward: "Legislative presentation + national media",
    achieved: false,
    icon: "🎊"
  },
  {
    id: "next-5000",
    threshold: 5000,
    title: "Provincial Impact",
    description: "5,000 educators - representing significant portion of workforce",
    reward: "Major policy advocacy campaign",
    achieved: false,
    icon: "🌟"
  },
  {
    id: "next-10000",
    threshold: 10000,
    title: "Ten Thousand Strong",
    description: "Undeniable collective voice of Alberta educators",
    reward: "Historic demonstration of educator solidarity",
    achieved: false,
    icon: "🏆"
  }
];

interface MilestoneCelebrationProps {
  currentCount: number;
  onClose?: () => void;
  autoShow?: boolean;
}

export function MilestoneCelebration({ 
  currentCount = 145, 
  onClose,
  autoShow = false 
}: MilestoneCelebrationProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratingMilestone, setCelebratingMilestone] = useState<Milestone | null>(null);

  // Find next milestone
  const nextMilestone = MILESTONES.find(m => !m.achieved && m.threshold > currentCount);
  const lastAchieved = MILESTONES.filter(m => m.achieved).sort((a, b) => b.threshold - a.threshold)[0];

  useEffect(() => {
    // Auto-show celebration when milestone is reached
    if (autoShow && nextMilestone && currentCount >= nextMilestone.threshold) {
      setCelebratingMilestone(nextMilestone);
      setShowCelebration(true);
    }
  }, [currentCount, nextMilestone, autoShow]);

  const handleClose = () => {
    setShowCelebration(false);
    setCelebratingMilestone(null);
    onClose?.();
  };

  const handleShare = () => {
    const text = `We did it! Digital Strike has reached ${celebratingMilestone?.threshold} Alberta educators standing up for Charter rights. ${celebratingMilestone?.reward}`;
    
    if (navigator.share) {
      navigator.share({
        title: celebratingMilestone?.title,
        text: text,
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(text + " " + window.location.origin);
    }
  };

  const progressToNext = nextMilestone 
    ? ((currentCount - (lastAchieved?.threshold || 0)) / (nextMilestone.threshold - (lastAchieved?.threshold || 0))) * 100
    : 100;

  // Celebration Modal
  if (showCelebration && celebratingMilestone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
        <Panel className="max-w-2xl w-full p-8 relative overflow-hidden">
          {/* Confetti effect background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-amber-500/20 to-primary/20 animate-pulse" />
          
          <div className="relative z-10 text-center space-y-6">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-0 right-0 p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Icon */}
            <div className="text-8xl animate-bounce">
              {celebratingMilestone.icon}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-4xl font-bold">Milestone Achieved!</h2>
              <h3 className="text-2xl text-primary font-semibold">
                {celebratingMilestone.title}
              </h3>
            </div>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {celebratingMilestone.description}
            </p>

            {/* Count */}
            <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl p-6">
              <div className="text-6xl font-bold text-primary mb-2">
                {celebratingMilestone.threshold.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Alberta educators standing together
              </div>
            </div>

            {/* Reward */}
            <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/10 rounded-xl p-4 border-l-4 border-amber-500">
              <div className="flex items-center gap-3 justify-center">
                <Trophy className="size-6 text-amber-500" />
                <div className="text-left">
                  <div className="text-sm font-semibold">Unlocked Reward</div>
                  <div className="text-sm text-muted-foreground">
                    {celebratingMilestone.reward}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={handleShare} className="gap-2">
                <Share2 className="size-4" />
                Share This Achievement
              </Button>
              <Button onClick={handleClose} variant="outline">
                Continue
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  // Regular milestone tracker display
  return (
    <Panel className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Target className="size-5 text-primary" />
              Milestone Tracker
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Collective goals that unlock rewards and amplify our impact
            </p>
          </div>
        </div>

        {/* Current Progress to Next Milestone */}
        {nextMilestone && (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 ring-1 ring-primary/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-lg">Next Milestone</h4>
                  <p className="text-sm text-muted-foreground">{nextMilestone.title}</p>
                </div>
                <div className="text-4xl">{nextMilestone.icon}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">
                    {currentCount.toLocaleString()} / {nextMilestone.threshold.toLocaleString()}
                  </span>
                </div>
                <Progress value={progressToNext} className="h-3" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{progressToNext.toFixed(0)}% to next milestone</span>
                  <span>{(nextMilestone.threshold - currentCount).toLocaleString()} more needed</span>
                </div>
              </div>

              <div className="bg-background/50 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Sparkles className="size-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Reward: </span>
                    <span className="text-muted-foreground">{nextMilestone.reward}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Timeline */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">All Milestones</h4>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            {/* Milestones */}
            <div className="space-y-6">
              {MILESTONES.map((milestone, index) => (
                <div key={milestone.id} className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div className={`
                    relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0
                    ${milestone.achieved 
                      ? "bg-gradient-to-br from-primary to-primary/80 ring-4 ring-primary/20" 
                      : currentCount >= milestone.threshold
                        ? "bg-gradient-to-br from-amber-500 to-amber-600 ring-4 ring-amber-500/20 animate-pulse"
                        : "bg-muted ring-2 ring-border opacity-50"
                    }
                  `}>
                    {milestone.achieved ? "✓" : milestone.icon}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-6 ${!milestone.achieved && currentCount < milestone.threshold ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold">{milestone.title}</h5>
                          {milestone.achieved && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                              Achieved
                            </span>
                          )}
                          {!milestone.achieved && currentCount >= milestone.threshold && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 animate-pulse">
                              Just Reached!
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {milestone.description}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold">Reward:</span> {milestone.reward}
                        </div>
                        {milestone.achievedDate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Achieved on {milestone.achievedDate}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-primary">
                          {milestone.threshold.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">signatures</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Motivation */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-4 border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <Users className="size-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Every Voice Matters</h4>
              <p className="text-xs text-muted-foreground">
                Each signature brings us closer to the next milestone. Share your referral link 
                to help us reach our collective goals and unlock rewards that amplify our message.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
