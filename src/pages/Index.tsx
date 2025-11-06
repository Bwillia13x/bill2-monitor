import { useState } from "react";
import { SocialMetaTags } from "@/components/v3/SocialMetaTags";
import { V3HeroSimple } from "@/components/v3/V3HeroSimple";
import { SubmitModal } from "@/components/v3/SubmitModal";
import { ConfirmationWithProgress } from "@/components/v3/ConfirmationWithProgress";
import { ShareWith3Modal } from "@/components/v3/ShareWith3Modal";
import { BelowFoldSimple } from "@/components/v3/BelowFoldSimple";
import { MethodologyModal } from "@/components/v3/MethodologyModal";
import { usePressTileDownload } from "@/components/v3/PressTileGenerator";
import { useCCI } from "@/hooks/useMetrics";
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

  const handleSubmit = (value: number, role?: string, region?: string) => {
    console.log("Signal submitted:", { value, role, region });
    
    // Generate referral code (in production, this would come from backend)
    const code = "DS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setReferralCode(code);
    
    // Update counts
    setSignalNumber(totalN + 1);
    setTodayCount(todayCount + 1);
    
    // Close submit modal
    setSubmitModalOpen(false);
    
    // Show confirmation
    setShowConfirmation(true);
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
          daysRemaining={daysRemaining}
          onSubmitClick={() => setSubmitModalOpen(true)}
          onShareClick={handleShareClick}
          onMethodologyClick={() => setMethodologyModalOpen(true)}
        />

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
            <div className="flex gap-6">
              <button
                onClick={() => setMethodologyModalOpen(true)}
                className="hover:text-gray-300 transition-colors"
              >
                Methodology & Privacy
              </button>
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
