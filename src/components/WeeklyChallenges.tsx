import { useState } from "react";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Users, MapPin, Calendar, CheckCircle2, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "individual" | "collective" | "regional";
  goal: number;
  current: number;
  reward: string;
  icon: React.ReactNode;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "upcoming";
  participants?: number;
}

// Mock challenge data
const CHALLENGES: Challenge[] = [
  {
    id: "week-45-collective",
    title: "500 Voices Strong",
    description: "Help us reach 500 total signatures this week",
    type: "collective",
    goal: 500,
    current: 145,
    reward: "Unlock provincial media campaign",
    icon: <Users className="size-5" />,
    startDate: "Nov 4",
    endDate: "Nov 10",
    status: "active",
    participants: 145
  },
  {
    id: "week-45-individual",
    title: "Network Builder",
    description: "Refer 5 new educators this week",
    type: "individual",
    goal: 5,
    current: 2,
    reward: "Unlock 'Weekly Champion' badge",
    icon: <Target className="size-5" />,
    startDate: "Nov 4",
    endDate: "Nov 10",
    status: "active"
  },
  {
    id: "week-45-regional",
    title: "Calgary Region Push",
    description: "Get 100 signatures from Calgary-area schools",
    type: "regional",
    goal: 100,
    current: 38,
    reward: "Featured in Calgary Herald press release",
    icon: <MapPin className="size-5" />,
    startDate: "Nov 4",
    endDate: "Nov 10",
    status: "active",
    participants: 38
  },
  {
    id: "week-46-collective",
    title: "Every District Represented",
    description: "Get at least 20 signatures from each of Alberta's 61 school districts",
    type: "collective",
    goal: 61,
    current: 12,
    reward: "Full-page newspaper ad",
    icon: <Trophy className="size-5" />,
    startDate: "Nov 11",
    endDate: "Nov 17",
    status: "upcoming",
    participants: 0
  }
];

const getChallengeColor = (type: Challenge["type"]) => {
  switch (type) {
    case "individual":
      return "from-blue-500 to-blue-600";
    case "collective":
      return "from-primary to-primary/80";
    case "regional":
      return "from-amber-500 to-amber-600";
  }
};

const getChallengeTypeLabel = (type: Challenge["type"]) => {
  switch (type) {
    case "individual":
      return "Personal Goal";
    case "collective":
      return "Community Goal";
    case "regional":
      return "Regional Goal";
  }
};

export function WeeklyChallenges() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    CHALLENGES.find(c => c.status === "active") || null
  );

  const activeChallenges = CHALLENGES.filter(c => c.status === "active");
  const upcomingChallenges = CHALLENGES.filter(c => c.status === "upcoming");
  const completedCount = CHALLENGES.filter(c => c.status === "completed").length;

  const handleJoinChallenge = (challenge: Challenge) => {
    // In production, this would register the user for the challenge
    setSelectedChallenge(challenge);
  };

  return (
    <Panel className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="size-5 text-primary" />
              Weekly Challenges
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Join collective campaigns to amplify our impact
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{activeChallenges.length}</div>
            <div className="text-xs text-muted-foreground">Active now</div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{activeChallenges.length}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{upcomingChallenges.length}</div>
            <div className="text-xs text-muted-foreground">Upcoming</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-xl font-bold">{completedCount}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Active Challenges */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Calendar className="size-4" />
            This Week's Challenges
          </h4>

          {activeChallenges.map((challenge) => {
            const progress = (challenge.current / challenge.goal) * 100;
            const isSelected = selectedChallenge?.id === challenge.id;

            return (
              <div
                key={challenge.id}
                className={`
                  rounded-xl border-2 transition-all cursor-pointer
                  ${isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 bg-muted/20"
                  }
                `}
                onClick={() => setSelectedChallenge(challenge)}
              >
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getChallengeColor(challenge.type)} flex items-center justify-center text-white flex-shrink-0`}>
                        {challenge.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold">{challenge.title}</h5>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {getChallengeTypeLabel(challenge.type)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {challenge.current.toLocaleString()} / {challenge.goal.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{progress.toFixed(0)}% complete</span>
                      <span>Ends {challenge.endDate}</span>
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 rounded p-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="size-4 text-amber-500 flex-shrink-0" />
                      <div className="text-xs">
                        <span className="text-muted-foreground">Reward: </span>
                        <span className="font-medium">{challenge.reward}</span>
                      </div>
                    </div>
                  </div>

                  {/* Participants (for collective/regional) */}
                  {challenge.participants !== undefined && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="size-4" />
                      <span>{challenge.participants.toLocaleString()} educators participating</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upcoming Challenges */}
        {upcomingChallenges.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Lock className="size-4" />
              Coming Soon
            </h4>

            {upcomingChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="rounded-xl border border-border bg-muted/10 p-4 opacity-60"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getChallengeColor(challenge.type)} flex items-center justify-center text-white flex-shrink-0`}>
                    {challenge.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold">{challenge.title}</h5>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Starts {challenge.startDate}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                      <Trophy className="size-3" />
                      <span>{challenge.reward}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How It Works */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">How Weekly Challenges Work</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary flex-shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Individual challenges</strong> track your personal contributions and unlock badges</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary flex-shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Collective challenges</strong> require the entire community to work together toward a shared goal</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary flex-shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Regional challenges</strong> focus on specific geographic areas to build local momentum</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary flex-shrink-0 mt-0.5" />
              <span>New challenges launch every Monday and run for one week</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary flex-shrink-0 mt-0.5" />
              <span>Completing challenges unlocks rewards like badges, media campaigns, and special recognition</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        {selectedChallenge && selectedChallenge.status === "active" && (
          <Button
            onClick={() => handleJoinChallenge(selectedChallenge)}
            className="w-full"
            size="lg"
          >
            Join This Challenge
          </Button>
        )}
      </div>
    </Panel>
  );
}
