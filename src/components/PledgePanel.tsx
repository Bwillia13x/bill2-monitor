import { useState } from "react";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useCampaignSummary, useHasUserSigned, useSignPledge } from "@/hooks/usePledge";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Share2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function PledgePanel() {
  const { user } = useAuth();
  const { data: summary } = useCampaignSummary();
  const { data: hasSigned = false } = useHasUserSigned();
  const signPledge = useSignPledge();
  
  const [attested, setAttested] = useState(false);
  const [district, setDistrict] = useState("");

  const canShowCounts = (summary?.total ?? 0) >= (summary?.minShowN ?? 20);

  const handleSign = () => {
    if (!attested) {
      toast.error("Please confirm you understand this is a lawful expression");
      return;
    }
    
    signPledge.mutate({ district: district || undefined });
  };

  const handleShare = (platform: "twitter" | "facebook") => {
    const url = window.location.origin;
    const text = `I've added my anonymized signature: "${summary?.statement}" | ${(summary?.total ?? 0).toLocaleString()} educators standing together.`;

    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank"
      );
    } else {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
        "_blank"
      );
    }
  };

  return (
    <Panel className="p-6">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
        {/* Left side - Statement & Actions */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Add your anonymized signature
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary?.statement || "Loading..."}
            </p>
          </div>

          {!hasSigned && user ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="attest" 
                  checked={attested}
                  onCheckedChange={(checked) => setAttested(checked === true)}
                  className="mt-1"
                />
                <label htmlFor="attest" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I understand this is a lawful expression of opinion and <strong>not</strong> a call for job action. Aggregates only; slices render when n≥{summary?.minShowN ?? 20}.
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Optional: your district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="bg-white/5 border-border sm:max-w-xs"
                />
                <Button
                  onClick={handleSign}
                  disabled={!attested || signPledge.isPending}
                  className="bg-primary hover:bg-primary/90 whitespace-nowrap"
                >
                  {signPledge.isPending ? "Adding..." : "Add my anonymized signature"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                We publish only aggregates. Slices don't render unless n≥{summary?.minShowN ?? 20}.
              </p>
            </div>
          ) : hasSigned ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <CheckCircle2 className="size-5" />
                <span className="font-semibold">You're counted</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("twitter")}
                  className="gap-2"
                >
                  <Share2 className="size-4" />
                  Share on X
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("facebook")}
                  className="gap-2"
                >
                  <Share2 className="size-4" />
                  Share on FB
                </Button>
                <Link to="/studio/signs?badge=ISigned">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Printer className="size-4" />
                    Print a sign
                  </Button>
                </Link>
                <Link to="/press">
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    Media kit
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Please sign in to add your signature
            </div>
          )}
        </div>

        {/* Right side - Count display */}
        <div className="lg:min-w-[240px] text-center lg:text-right">
          <div className="inline-flex flex-col items-center lg:items-end p-6 rounded-xl bg-white/5 ring-1 ring-border">
            <div className="text-sm text-muted-foreground mb-2">Signatures</div>
            <div className="text-5xl font-bold text-primary leading-none mb-1">
              {canShowCounts ? (summary?.total ?? 0).toLocaleString() : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              {canShowCounts 
                ? "province-wide" 
                : `hidden until n≥${summary?.minShowN ?? 20}`}
            </div>
            {summary && summary.today > 0 && canShowCounts && (
              <div className="text-xs text-primary mt-2">
                +{summary.today} today
              </div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
