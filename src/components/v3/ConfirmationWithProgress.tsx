import { useEffect, useState } from "react";
import { CheckCircle2, TrendingUp, MapPin } from "lucide-react";
import { ViralShareCard } from "@/components/viral/ViralShareCard";

interface District {
  name: string;
  count: number;
  threshold: number;
}

interface ConfirmationWithProgressProps {
  signalNumber: number;
  todayCount: number;
  userDistrict?: District;
  cci?: number;
  onComplete: () => void;
}

export function ConfirmationWithProgress({
  signalNumber,
  todayCount,
  userDistrict,
  cci = 50,
  onComplete,
}: ConfirmationWithProgressProps) {
  const [visible, setVisible] = useState(true);
  const [stage, setStage] = useState<'confetti' | 'progress' | 'share'>('confetti');

  useEffect(() => {
    // Create confetti effect
    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];
    const confettiCount = 50;
    const container = document.getElementById('confetti-container');
    
    if (container) {
      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.cssText = `
          position: fixed;
          width: ${Math.random() * 10 + 5}px;
          height: ${Math.random() * 10 + 5}px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}vw;
          top: -20px;
          opacity: ${Math.random() * 0.7 + 0.3};
          animation: confetti-fall ${Math.random() * 2 + 2}s linear forwards;
          border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
          z-index: 9999;
        `;
        container.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 4000);
      }
    }

    // Transition to progress after 1.5s
    const progressTimer = setTimeout(() => {
      setStage('progress');
    }, 1500);

    // Transition to share after 3.5s
    const shareTimer = setTimeout(() => {
      setStage('share');
    }, 3500);

    // Auto-advance after 10s total (give time for share)
    const completeTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300);
    }, 10000);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(shareTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const remaining = userDistrict ? userDistrict.threshold - userDistrict.count : 0;
  const progress = userDistrict ? (userDistrict.count / userDistrict.threshold) * 100 : 0;

  return (
    <>
      {/* Confetti container */}
      <div id="confetti-container" aria-hidden="true" />
      
      {/* Confirmation overlay */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        role="alert"
        aria-live="assertive"
      >
        <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
          {stage === 'confetti' ? (
            <>
              {/* Success icon */}
              <div className="flex justify-center mb-4">
                <div 
                  className="relative"
                  style={{
                    animation: 'scale-in 0.5s ease-out',
                  }}
                >
                  <CheckCircle2 
                    className="w-20 h-20 text-blue-400"
                    strokeWidth={2}
                  />
                  <div 
                    className="absolute inset-0 blur-2xl opacity-50"
                    style={{
                      background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
                    }}
                  />
                </div>
              </div>

              {/* Message */}
              <h2 className="text-2xl font-bold text-gray-100 mb-2">
                Signal Received!
              </h2>
              
              <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                <span className="text-lg">
                  You're signal <span className="font-bold">#{signalNumber}</span>
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-gray-400">
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm">
                  +{todayCount} today
                </span>
              </div>
            </>
          ) : stage === 'progress' ? (
            <>
              {/* District progress */}
              {userDistrict ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <MapPin className="w-6 h-6 text-blue-400" aria-hidden="true" />
                    <h3 className="text-xl font-semibold text-gray-100">
                      {userDistrict.name}
                    </h3>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden mb-2">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    
                    <div className="text-2xl font-bold text-blue-400 tabular-nums">
                      {userDistrict.count} / {userDistrict.threshold}
                    </div>
                  </div>

                  {remaining > 0 ? (
                    <p className="text-gray-300 mb-2">
                      <span className="font-semibold text-blue-400">{remaining}</span>
                      {" "}more signal{remaining !== 1 ? 's' : ''} needed to unlock
                    </p>
                  ) : (
                    <p className="text-green-400 font-semibold mb-2">
                      ✓ District Unlocked!
                    </p>
                  )}

                  <p className="text-sm text-gray-500">
                    Share with 3 colleagues to unlock your district faster
                  </p>
                </>
              ) : (
                <p className="text-gray-400">
                  Thanks! Your signal has been recorded.
                </p>
              )}
            </>
          ) : (
            <>
              {/* Viral share card */}
              <h3 className="text-xl font-semibold text-gray-100 mb-4">
                Share Your Voice
              </h3>
              <ViralShareCard
                signalNumber={signalNumber}
                cci={cci}
                district={userDistrict?.name}
                todayCount={todayCount}
              />
            </>
          )}
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .confetti-piece {
            animation: none !important;
            display: none;
          }
          
          @keyframes scale-in {
            from, to {
              transform: scale(1);
              opacity: 1;
            }
          }
        }
      `}</style>
    </>
  );
}
