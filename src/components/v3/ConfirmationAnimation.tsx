import { useEffect, useState } from "react";
import { CheckCircle2, TrendingUp } from "lucide-react";

interface ConfirmationAnimationProps {
  delta: number; // How much the needle moved
  onComplete: () => void;
}

export function ConfirmationAnimation({ delta, onComplete }: ConfirmationAnimationProps) {
  const [visible, setVisible] = useState(true);

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

    // Auto-advance after 2 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      {/* Confetti container */}
      <div id="confetti-container" aria-hidden="true" />
      
      {/* Confirmation message */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        role="alert"
        aria-live="assertive"
      >
        <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
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
          
          <div className="flex items-center justify-center gap-2 text-blue-400 mb-4">
            <TrendingUp className="w-5 h-5" aria-hidden="true" />
            <span className="text-lg font-semibold">
              You moved the needle by +{delta.toFixed(2)}
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Your anonymous signal has been added to the collective voice
          </p>
        </div>
      </div>

      {/* Confetti animation styles */}
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
