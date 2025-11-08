import { useState } from "react";
import { SocialMetaTags } from "@/components/v3/SocialMetaTags";
import { V3HeroSimple } from "@/components/v3/V3HeroSimple";
import { CCIBulletGraphs } from "@/components/v3/CCIBulletGraphs";
import { SubmitModal } from "@/components/v3/SubmitModal";
import { ConfirmationWithProgress } from "@/components/v3/ConfirmationWithProgress";
import { ShareWith3Modal } from "@/components/v3/ShareWith3Modal";
import { BelowFoldSimple } from "@/components/v3/BelowFoldSimple";
import { MethodologyModal } from "@/components/v3/MethodologyModal";
import { LiveActivityTicker } from "@/components/viral/LiveActivityTicker";
import { DistrictLeaderboard } from "@/components/viral/DistrictLeaderboard";
import { UrgencyCountdown } from "@/components/viral/UrgencyCountdown";
import { SocialProofBanner } from "@/components/viral/SocialProofBanner";
import { StoryWallCTA } from "@/components/viral/StoryWallCTA";
import { usePressTileDownload } from "@/components/v3/PressTileGenerator";
import { useCCI, useCCISparkline } from "@/hooks/useMetrics";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Mock data - in production this would come from the database
const TARGET_DATE = new Date("2028-08-31T06:00:00Z");

const MOCK_DISTRICTS = [
  { name: "Calgary 1", count: 45, unlocked: true, threshold: 20 },
  { name: "Calgary 2", count: 38, unlocked: true, threshold: 20 },
  { name: "Edmonton 1", count: 52, unlocked: true, threshold: 20 },
  { name: "Edmonton 2", count: 41, unlocked: true, threshold: 20 },
  { name: "Red Deer", count: 23, unlocked: true, threshold: 20 },
  { name: "Lethbridge", count: 18, unlocked: false, threshold: 20 },
  { name: "Medicine Hat", count: 15, unlocked: false, threshold: 20 },
  { name: "Grande Prairie", count: 12, unlocked: false, threshold: 20 },
  { name: "Fort McMurray", count: 8, unlocked: false, threshold: 20 },
  { name: "Airdrie", count: 14, unlocked: false, threshold: 20 },
  { name: "Spruce Grove", count: 11, unlocked: false, threshold: 20 },
  { name: "Okotoks", count: 9, unlocked: false, threshold: 20 },
];

const MOCK_VELOCITY = [12, 15, 18, 14, 16, 19, 17];

export default function V3IndexRefined() {
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [methodologyModalOpen, setMethodologyModalOpen] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  // Fetch CCI data
  const { data: cciData, isLoading: cciLoading } = useCCI(7);
  const { data: sparklineData, isLoading: sparklineLoading } = useCCISparkline(7);
  
  // Use CCI data or defaults
  const cciValue = cciData?.cci ?? 47.6;
  const cciChange = cciData?.cci_change_1d ?? null;
  const totalN = cciData?.total_n ?? 1284;

  const [signalNumber, setSignalNumber] = useState(totalN);
  const [todayCount, setTodayCount] = useState(MOCK_VELOCITY[MOCK_VELOCITY.length - 1]);

  const downloadPressTile = usePressTileDownload(
    cciValue,
    cciChange ?? 0,
    MOCK_DISTRICTS
  );

  const handleSubmit = async (data: {
    weeklyComparison: 'better' | 'same' | 'worse';
    satisfaction: number;
    exhaustion: number;
    role?: string;
    district?: string;
  }) => {
    try {
      // Since auth is disabled, use a temporary user ID
      // In production, this would be auth.uid()
      const tempUserId = localStorage.getItem('temp_user_id') || 
        (() => {
          const id = crypto.randomUUID();
          localStorage.setItem('temp_user_id', id);
          return id;
        })();

      const { error } = await supabase
        .from('cci_submissions')
        .insert({
          user_id: tempUserId,
          weekly_comparison: data.weeklyComparison,
          satisfaction_10: data.satisfaction,
          exhaustion_10: data.exhaustion,
          role: data.role,
          district: data.district,
        });

      if (error) {
        console.error("Submission error:", error);
        toast.error("Failed to submit. Please try again.");
        return;
      }

      console.log("CCI submission successful:", data);
      
      // Generate referral code
      const code = "CCI-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      setReferralCode(code);
      
      // Update counts
      setSignalNumber(totalN + 1);
      setTodayCount(todayCount + 1);
      
      // Close submit modal
      setSubmitModalOpen(false);
      
      // Show confirmation
      setShowConfirmation(true);
      
      toast.success("Your signal has been recorded!");
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleConfirmationComplete = () => {
    setShowConfirmation(false);
    setShareModalOpen(true);
  };

  const handleShareClick = () => {
    // If user hasn't submitted yet, prompt them to submit first
    if (!referralCode) {
      toast.info("Add your signal first to get your personal referral link!");
      setSubmitModalOpen(true);
      return;
    }
    
    setShareModalOpen(true);
  };

  const handlePressDownload = () => {
    downloadPressTile();
    toast.success("Press tile downloaded!");
  };

  const daysRemaining = Math.ceil((TARGET_DATE.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const coveragePercent = Math.round(
    (MOCK_DISTRICTS.filter(d => d.unlocked).length / MOCK_DISTRICTS.length) * 100
  );

  // Simulate user's district (in production, would be detected from IP or selected)
  const userDistrict = MOCK_DISTRICTS.find(d => d.name === "Lethbridge");

  return (
    <>
      <SocialMetaTags meterValue={cciValue} />
      <div 
        className="min-h-screen text-gray-100"
        style={{
          background: 'linear-gradient(to bottom, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)',
        }}
      >
        {/* Hero section */}
        <V3HeroSimple
          cciValue={cciValue}
          cciChange={cciChange}
          totalN={totalN}
          sparklineData={sparklineData}
          daysRemaining={daysRemaining}
          onSubmitClick={() => setSubmitModalOpen(true)}
          onShareClick={handleShareClick}
          onMethodologyClick={() => setMethodologyModalOpen(true)}
        />

        {/* Social Proof Banner */}
        <SocialProofBanner 
          totalCount={totalN}
          todayCount={todayCount}
          activeNow={Math.floor(Math.random() * 15) + 5}
        />

        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Metrics */}
            <div className="lg:col-span-2 space-y-6">
              {/* CCI Component Bullet Graphs */}
              <CCIBulletGraphs
                satisfaction={cciData?.sat_mean ?? 4.9}
                exhaustion={cciData?.exh_mean ?? 7.1}
                totalN={totalN}
              />

              {/* Urgency Countdown */}
              <UrgencyCountdown
                currentCount={totalN}
                nextMilestone={2000}
              />
            </div>

            {/* Right Column - Social/Viral */}
            <div className="space-y-6">
              {/* Story Wall CTA */}
              <StoryWallCTA />

              {/* Live Activity Ticker */}
              <LiveActivityTicker />

              {/* District Leaderboard */}
              <DistrictLeaderboard />
            </div>
          </div>
        </div>

        {/* Below-fold content */}
        <BelowFoldSimple
          districts={MOCK_DISTRICTS}
          dailyVelocity={MOCK_VELOCITY}
          coveragePercent={coveragePercent}
          onDownloadPress={handlePressDownload}
        />

        {/* Modals */}
        <SubmitModal
          open={submitModalOpen}
          onClose={() => setSubmitModalOpen(false)}
          onSubmit={handleSubmit}
        />

        {showConfirmation && (
          <ConfirmationWithProgress
            signalNumber={signalNumber}
            todayCount={todayCount}
            userDistrict={userDistrict}
            cci={cciValue}
            onComplete={handleConfirmationComplete}
          />
        )}

        <ShareWith3Modal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          meterValue={cciValue}
          referralCode={referralCode || "DEMO-CODE"}
        />

        <MethodologyModal
          open={methodologyModalOpen}
          onClose={() => setMethodologyModalOpen(false)}
        />

        {/* Footer */}
        <footer className="border-t border-gray-800 py-8 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div>
              © 2024 Digital Strike. Evidence-based, non-coordinative, privacy-first.
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
              <button
                onClick={() => setMethodologyModalOpen(true)}
                className="hover:text-gray-300 transition-colors"
              >
                Methodology & Privacy
              </button>
              <a href="/story-wall" className="hover:text-gray-300 transition-colors">
                Story Wall
              </a>
              <a href="/press" className="hover:text-gray-300 transition-colors">
                Press
              </a>
              <a href="/v2" className="hover:text-gray-300 transition-colors">
                Full Dashboard
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
