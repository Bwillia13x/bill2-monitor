import { AlertTriangle, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SuppressionNoticeProps {
  n: number;
  threshold?: number;
  className?: string;
}

export function SuppressionNotice({ n, threshold = 20, className = "" }: SuppressionNoticeProps) {
  return (
    <Card className={`bg-red-900/20 border-red-700 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Lock className="w-6 h-6 text-red-400 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-300 mb-2">
              Data Suppressed for Privacy Protection
            </h3>
            <p className="text-red-200 mb-3">
              This data cannot be displayed because the sample size is too small to protect individual privacy.
            </p>
            <div className="bg-red-950/50 rounded-lg p-4 border border-red-800">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-red-400">Current sample size:</span>
                  <span className="text-white font-bold ml-2">n = {n}</span>
                </div>
                <div>
                  <span className="text-red-400">Minimum required:</span>
                  <span className="text-white font-bold ml-2">n ≥ {threshold}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-red-400">Signals needed:</span>
                  <span className="text-white font-bold ml-2">{threshold - n} more</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-red-300 mt-3">
              This follows k-anonymity principles to prevent re-identification of individual participants.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SuppressionTooltip({ n, threshold = 20 }: { n: number; threshold?: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/50 px-2 py-1 rounded">
      <AlertTriangle className="w-3 h-3" />
      <span>Insufficient data (n={n}, need ≥{threshold})</span>
    </div>
  );
}

// Hook to check if data should be suppressed
export function useSuppressionCheck(n: number, threshold: number = 20): {
  isSuppressed: boolean;
  remaining: number;
} {
  const isSuppressed = n < threshold;
  const remaining = Math.max(0, threshold - n);
  
  return { isSuppressed, remaining };
}