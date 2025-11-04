import { useState } from "react";
import { SocialMetaTags } from "@/components/v3/SocialMetaTags";
import { V3Hero } from "@/components/v3/V3Hero";
import { SubmitModal } from "@/components/v3/SubmitModal";
import { ConfirmationAnimation } from "@/components/v3/ConfirmationAnimation";
import { ShareModal } from "@/components/v3/ShareModal";
import { BelowFold } from "@/components/v3/BelowFold";
import { useNavigate } from "react-router-dom";

// Mock data - in production this would come from the database
const MOCK_METER_VALUE = 67;
const MOCK_TREND = 2.3;
const MOCK_SPARKLINE = [62, 63, 65, 64, 66, 67, 67];
const TARGET_DATE = new Date("2028-08-31T06:00:00Z");

const MOCK_DISTRICTS = [
  { name: "Calgary 1", count: 45, unlocked: true },
  { name: "Calgary 2", count: 38, unlocked: true },
  { name: "Edmonton 1", count: 52, unlocked: true },
  { name: "Edmonton 2", count: 41, unlocked: true },
  { name: "Red Deer", count: 23, unlocked: true },
  { name: "Lethbridge", count: 18, unlocked: false },
  { name: "Medicine Hat", count: 15, unlocked: false },
  { name: "Grande Prairie", count: 12, unlocked: false },
  { name: "Fort McMurray", count: 8, unlocked: false },
  { name: "Airdrie", count: 14, unlocked: false },
  { name: "Spruce Grove", count: 11, unlocked: false },
  { name: "Okotoks", count: 9, unlocked: false },
];

const MOCK_VELOCITY = [12, 15, 18, 14, 16, 19, 17];

const MOCK_VOICES = [
  {
    quote: "I've dedicated 15 years to teaching Alberta's children. Using the notwithstanding clause feels like a betrayal of everything we stand for.",
    attribution: "High school teacher, 15 years, Calgary region"
  },
  {
    quote: "How can I teach my students about democracy and Charter rights when their government suspends those very rights?",
    attribution: "Social studies teacher, 8 years, Edmonton region"
  },
  {
    quote: "This isn't about money. It's about respect, dignity, and the fundamental rights we all deserve.",
    attribution: "Elementary teacher, 22 years, Central Alberta"
  }
];

export default function V3Index() {
  const navigate = useNavigate();
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const handleSubmit = (value: number, role?: string, region?: string) => {
    console.log("Signal submitted:", { value, role, region });
    
    // Generate referral code (in production, this would come from backend)
    const code = "DS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setReferralCode(code);
    
    // Close submit modal
    setSubmitModalOpen(false);
    
    // Show confirmation
    setShowConfirmation(true);
  };

  const handleConfirmationComplete = () => {
    setShowConfirmation(false);
    setShareModalOpen(true);
  };

  const handleEvidenceClick = () => {
    navigate("/voices");
  };

  const coveragePercent = Math.round(
    (MOCK_DISTRICTS.filter(d => d.unlocked).length / MOCK_DISTRICTS.length) * 100
  );

  return (
    <>
      <SocialMetaTags meterValue={MOCK_METER_VALUE} />
      <div 
      className="min-h-screen text-gray-100"
      style={{
        background: 'linear-gradient(to bottom, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)',
      }}
    >
      {/* Hero section */}
      <V3Hero
        meterValue={MOCK_METER_VALUE}
        meterTrend={MOCK_TREND}
        sparklineData={MOCK_SPARKLINE}
        targetDate={TARGET_DATE}
        onSubmitClick={() => setSubmitModalOpen(true)}
        onEvidenceClick={handleEvidenceClick}
      />

      {/* Below-fold content */}
      <BelowFold
        districts={MOCK_DISTRICTS}
        dailyVelocity={MOCK_VELOCITY}
        coveragePercent={coveragePercent}
        voices={MOCK_VOICES}
      />

      {/* Modals */}
      <SubmitModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSubmit={handleSubmit}
      />

      {showConfirmation && (
        <ConfirmationAnimation
          delta={0.15}
          onComplete={handleConfirmationComplete}
        />
      )}

      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        meterValue={MOCK_METER_VALUE}
        daysRemaining={Math.ceil((TARGET_DATE.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
        referralCode={referralCode}
      />

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div>
            © 2024 Digital Strike. Evidence-based, non-coordinative, privacy-first.
          </div>
          <div className="flex gap-6">
            <a href="/methodology" className="hover:text-gray-300 transition-colors">
              Methodology & Privacy
            </a>
            <a href="/press" className="hover:text-gray-300 transition-colors">
              Press
            </a>
            <a href="/engage" className="hover:text-gray-300 transition-colors">
              Dashboard
            </a>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
