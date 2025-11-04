import { useState } from "react";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check, Users, TrendingUp, Award } from "lucide-react";
import { toast } from "sonner";

interface ReferralStats {
  directReferrals: number;
  indirectReferrals: number;
  totalImpact: number;
  rank: number;
  totalUsers: number;
  badges: string[];
}

// Mock data - in production this would come from the database
const MOCK_STATS: ReferralStats = {
  directReferrals: 12,
  indirectReferrals: 47,
  totalImpact: 59,
  rank: 23,
  totalUsers: 145,
  badges: ["First Share", "Network Builder", "Top 50"]
};

export function ReferralDashboard() {
  const [copied, setCopied] = useState(false);
  const [stats] = useState<ReferralStats>(MOCK_STATS);
  
  // Generate unique referral code (in production, this would be from the user's profile)
  const referralCode = "DS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const referralUrl = `${window.location.origin}?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = (platform: "twitter" | "facebook" | "email") => {
    const message = `I've joined ${stats.totalUsers} Alberta educators standing up for our Charter rights. Add your voice anonymously:`;
    
    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralUrl)}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent(message)}`,
          "_blank"
        );
        break;
      case "email":
        window.location.href = `mailto:?subject=${encodeURIComponent("Stand Up for Our Rights")}&body=${encodeURIComponent(message + "\n\n" + referralUrl)}`;
        break;
    }
  };

  const progressToNext = Math.min((stats.directReferrals / 20) * 100, 100);

  return (
    <Panel className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Users className="size-5 text-primary" />
              Your Network Impact
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              See how your voice is amplifying the movement
            </p>
          </div>
          {stats.badges.length > 0 && (
            <div className="flex items-center gap-1">
              {stats.badges.slice(0, 3).map((badge, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                  title={badge}
                >
                  <Award className="size-4 text-primary" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 ring-1 ring-primary/20">
            <div className="text-sm text-muted-foreground mb-1">Direct Referrals</div>
            <div className="text-3xl font-bold text-primary">{stats.directReferrals}</div>
            <div className="text-xs text-muted-foreground mt-1">People you invited</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-4 ring-1 ring-blue-500/20">
            <div className="text-sm text-muted-foreground mb-1">Indirect Impact</div>
            <div className="text-3xl font-bold text-blue-500">{stats.indirectReferrals}</div>
            <div className="text-xs text-muted-foreground mt-1">People they invited</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-4 ring-1 ring-amber-500/20">
            <div className="text-sm text-muted-foreground mb-1">Total Impact</div>
            <div className="text-3xl font-bold text-amber-500">{stats.totalImpact}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Rank #{stats.rank} of {stats.totalUsers}
            </div>
          </div>
        </div>

        {/* Progress to next milestone */}
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Next Milestone: 20 Direct Referrals</span>
            <span className="text-sm text-muted-foreground">{stats.directReferrals}/20</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Unlock the "Network Champion" badge and special recognition
          </p>
        </div>

        {/* Referral Link */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Your Unique Referral Link</label>
          <div className="flex gap-2">
            <Input
              value={referralUrl}
              readOnly
              className="bg-muted/50 font-mono text-sm"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="size-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Share Your Link</label>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleShare("twitter")}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Share2 className="size-4" />
              Twitter/X
            </Button>
            <Button
              onClick={() => handleShare("facebook")}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Share2 className="size-4" />
              Facebook
            </Button>
            <Button
              onClick={() => handleShare("email")}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Share2 className="size-4" />
              Email
            </Button>
          </div>
        </div>

        {/* Leaderboard teaser */}
        <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4 border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <TrendingUp className="size-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Keep Going!</h4>
              <p className="text-xs text-muted-foreground">
                You're in the top {Math.round((stats.rank / stats.totalUsers) * 100)}% of network builders. 
                Just {20 - stats.directReferrals} more direct referrals to reach the next milestone!
              </p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
