import { useState } from "react";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Activity, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface PulseOption {
  value: number;
  emoji: string;
  label: string;
  color: string;
}

const PULSE_OPTIONS: PulseOption[] = [
  { value: 1, emoji: "😊", label: "Optimistic", color: "from-green-500 to-emerald-500" },
  { value: 2, emoji: "😐", label: "Neutral", color: "from-blue-500 to-cyan-500" },
  { value: 3, emoji: "😟", label: "Concerned", color: "from-yellow-500 to-amber-500" },
  { value: 4, emoji: "😠", label: "Frustrated", color: "from-orange-500 to-red-500" },
  { value: 5, emoji: "😡", label: "Outraged", color: "from-red-500 to-rose-600" }
];

// Mock aggregate data
const MOCK_AGGREGATE = {
  date: new Date().toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" }),
  totalResponses: 87,
  distribution: [
    { value: 1, count: 3, percentage: 3.4 },
    { value: 2, count: 8, percentage: 9.2 },
    { value: 3, count: 15, percentage: 17.2 },
    { value: 4, count: 31, percentage: 35.6 },
    { value: 5, count: 30, percentage: 34.5 }
  ],
  averagePulse: 3.9
};

export function DailyPulse() {
  const [selectedPulse, setSelectedPulse] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedPulse === null) {
      toast.error("Please select your current sentiment");
      return;
    }

    // In production, this would submit to the database
    setHasSubmitted(true);
    toast.success("Your pulse has been recorded anonymously");
  };

  const handleDownloadCard = () => {
    // In production, this would generate a shareable graphic
    toast.success("Generating your shareable pulse card...");
  };

  const handleShare = () => {
    const text = `Today's educator sentiment: ${MOCK_AGGREGATE.averagePulse.toFixed(1)}/5.0 (${MOCK_AGGREGATE.totalResponses} voices). Join the pulse check at Digital Strike.`;
    
    if (navigator.share) {
      navigator.share({
        title: "Daily Educator Pulse",
        text: text,
        url: window.location.origin
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text + " " + window.location.origin);
      toast.success("Pulse summary copied to clipboard!");
    }
  };

  return (
    <Panel className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Daily Pulse Check
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              How are you feeling about the situation today?
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {MOCK_AGGREGATE.averagePulse.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Today's avg</div>
          </div>
        </div>

        {!hasSubmitted ? (
          <>
            {/* Pulse Selection */}
            <div className="grid grid-cols-5 gap-2">
              {PULSE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedPulse(option.value)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all
                    ${selectedPulse === option.value
                      ? "border-primary bg-primary/10 scale-105"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }
                  `}
                >
                  <div className="text-4xl mb-2">{option.emoji}</div>
                  <div className="text-xs font-medium">{option.label}</div>
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={selectedPulse === null}
              className="w-full"
              size="lg"
            >
              Submit My Pulse Anonymously
            </Button>
          </>
        ) : (
          <>
            {/* Thank you message */}
            <div className="bg-primary/10 rounded-xl p-4 text-center">
              <div className="text-4xl mb-2">
                {PULSE_OPTIONS.find(o => o.value === selectedPulse)?.emoji}
              </div>
              <p className="font-semibold mb-1">Thank you for sharing!</p>
              <p className="text-sm text-muted-foreground">
                Your anonymous pulse has been recorded. Come back tomorrow to share again.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadCard}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Download className="size-4" />
                Download Pulse Card
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Share2 className="size-4" />
                Share Results
              </Button>
            </div>
          </>
        )}

        {/* Aggregate Visualization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Today's Sentiment Distribution</span>
            <span className="text-xs text-muted-foreground">
              {MOCK_AGGREGATE.totalResponses} responses
            </span>
          </div>

          {MOCK_AGGREGATE.distribution.map((item) => {
            const option = PULSE_OPTIONS.find(o => o.value === item.value)!;
            return (
              <div key={item.value} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{option.emoji}</span>
                    <span>{option.label}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${option.color} transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Trend insight */}
        <div className="bg-muted/30 rounded-xl p-4 text-sm">
          <p className="text-muted-foreground">
            <strong className="text-foreground">Trend:</strong> Sentiment has remained 
            consistently high (3.8-4.1) over the past 7 days, indicating sustained concern 
            among Alberta educators about the use of the notwithstanding clause.
          </p>
        </div>
      </div>
    </Panel>
  );
}
