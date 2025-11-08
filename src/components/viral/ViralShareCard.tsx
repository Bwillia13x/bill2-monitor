import { useRef } from "react";
import { Download, Share2, Twitter, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ViralShareCardProps {
  signalNumber: number;
  cci: number;
  district?: string;
  todayCount: number;
}

export function ViralShareCard({ signalNumber, cci, district, todayCount }: ViralShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    try {
      const { toPng } = await import("html-to-image");
      if (!cardRef.current) return;

      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `cci-voice-${signalNumber}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Card downloaded! Share it on social media.");
    } catch (error) {
      toast.error("Failed to export card");
    }
  };

  const shareText = `I just added my voice to the Climate Check-In. Signal #${signalNumber} - CCI is at ${Math.round(cci)}${district ? ` in ${district}` : ''}. Join ${todayCount}+ educators who spoke up today.`;
  
  const handleShare = (platform: "twitter" | "facebook") => {
    const url = window.location.origin;
    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
        "_blank"
      );
    } else {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`,
        "_blank"
      );
    }
  };

  const cciColor = cci >= 60 ? "text-red-500" : cci >= 40 ? "text-yellow-500" : "text-blue-500";
  const cciBg = cci >= 60 ? "from-red-500/20" : cci >= 40 ? "from-yellow-500/20" : "from-blue-500/20";

  return (
    <div className="space-y-4">
      {/* Preview Card */}
      <div 
        ref={cardRef}
        className={`relative bg-gradient-to-br ${cciBg} to-background border-2 border-primary/30 rounded-2xl p-8 text-center`}
      >
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 text-4xl opacity-20">📊</div>
        <div className="absolute bottom-4 left-4 text-4xl opacity-20">🎯</div>

        <div className="relative z-10">
          <div className="text-sm font-medium text-muted-foreground mb-2">I'm Voice</div>
          <div className="text-6xl font-bold text-primary mb-4">#{signalNumber}</div>
          
          <div className="space-y-3 mb-6">
            <div>
              <div className="text-sm text-muted-foreground">Climate Check-In</div>
              <div className={`text-5xl font-bold ${cciColor}`}>{Math.round(cci)}</div>
            </div>
            
            {district && (
              <div className="text-lg font-medium text-foreground">{district}</div>
            )}
          </div>

          <div className="pt-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              Join {todayCount.toLocaleString()}+ educators who spoke up today
            </div>
          </div>

          <div className="mt-4 text-xs text-muted-foreground opacity-60">
            digitalstrike.ca
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button onClick={handleExport} className="w-full gap-2" size="lg">
          <Download className="w-4 h-4" />
          Download Your Card
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => handleShare("twitter")} variant="outline" className="gap-2">
            <Twitter className="w-4 h-4" />
            Share on X
          </Button>
          <Button onClick={() => handleShare("facebook")} variant="outline" className="gap-2">
            <Facebook className="w-4 h-4" />
            Share on FB
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Share your voice and invite 3 colleagues to amplify the signal
        </p>
      </div>
    </div>
  );
}
