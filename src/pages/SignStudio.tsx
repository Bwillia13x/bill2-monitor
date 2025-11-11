import { useState, useEffect } from "react";
import { BackgroundFX } from "@/components/BackgroundFX";
import { Header } from "@/components/Header";
import { Banner } from "@/components/Banner";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTodayAggregate } from "@/hooks/useSignals";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { funnelTracker } from "@/lib/funnelTracker";

const PRESETS = [
  { name: "Bold Stake", bg: "bg-gradient-to-br from-red-600 to-red-800", text: "text-white" },
  { name: "Hazard Stripe", bg: "bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_20px,#000_20px,#000_40px)]", text: "text-white" },
  { name: "Solidarity", bg: "bg-gradient-to-br from-emerald-600 to-emerald-800", text: "text-white" },
  { name: "Chalkboard", bg: "bg-slate-800", text: "text-slate-100" },
];

const SignStudio = () => {
  const { data: aggregateData } = useTodayAggregate();
  const [headline, setHeadline] = useState("We're not okay");
  const [subline, setSubline] = useState("Respect teachers. Respect students.");
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [hasCustomized, setHasCustomized] = useState(false);

  const dsm = aggregateData?.avgDissatisfaction ?? 0;
  const band = dsm >= 60 ? "Critical" : dsm >= 40 ? "Rising" : "Lower";
  const preset = PRESETS[selectedPreset];

  // Track sign studio start on mount
  useEffect(() => {
    funnelTracker.trackSignCreation('start', {
      dsm: Math.round(dsm),
      band,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track customization when user changes anything
  const handleCustomization = (field: 'headline' | 'subline' | 'preset', value: string | number) => {
    if (!hasCustomized) {
      setHasCustomized(true);
      funnelTracker.trackSignCreation('customize', {
        firstEdit: field,
      });
    }
  };

  const handleExport = async () => {
    try {
      // Track preview step (user is viewing the sign before export)
      await funnelTracker.trackSignCreation('preview', {
        headlineLength: headline.length,
        sublineLength: subline.length,
        preset: preset.name,
      });

      // Use html-to-image for client-side export
      const { toPng } = await import("html-to-image");
      const node = document.getElementById("sign-canvas");
      if (!node) return;

      const dataUrl = await toPng(node, {
        quality: 1,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = "digital-strike-sign.png";
      link.href = dataUrl;
      link.click();

      // Track download step
      await funnelTracker.trackSignCreation('download', {
        format: 'png',
        preset: preset.name,
      });

      toast.success("Sign exported successfully");
    } catch (error) {
      toast.error("Failed to export sign");
    }
  };

  const handleShare = (platform: "twitter" | "facebook") => {
    const url = window.location.origin;
    const text = `${headline} | Digital Strike Meter: ${Math.round(dsm)} (${band})`;

    // Track share completion (final funnel step)
    funnelTracker.trackSignCreation('share', {
      platform,
      preset: preset.name,
    });

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
    <div className="relative min-h-screen w-full text-foreground bg-background overflow-x-hidden">
      <BackgroundFX />
      <Header />
      <Banner />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Digital Sign Studio</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Create share-ready protest signs. Download or share directly to social media.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <Panel className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="headline">Headline (max 32 chars)</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => {
                    setHeadline(e.target.value.slice(0, 32));
                    handleCustomization('headline', e.target.value);
                  }}
                  className="bg-white/5 border-border mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {headline.length}/32
                </div>
              </div>

              <div>
                <Label htmlFor="subline">Subline (max 50 chars)</Label>
                <Input
                  id="subline"
                  value={subline}
                  onChange={(e) => {
                    setSubline(e.target.value.slice(0, 50));
                    handleCustomization('subline', e.target.value);
                  }}
                  className="bg-white/5 border-border mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {subline.length}/50
                </div>
              </div>

              <div>
                <Label>Preset Style</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PRESETS.map((preset, idx) => (
                    <Badge
                      key={preset.name}
                      onClick={() => {
                        setSelectedPreset(idx);
                        handleCustomization('preset', idx);
                      }}
                      className={`cursor-pointer h-12 justify-center text-sm ${selectedPreset === idx
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : ""
                        }`}
                    >
                      {preset.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <Button onClick={handleExport} className="w-full gap-2">
                  <Download className="size-4" />
                  Export PNG
                </Button>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleShare("twitter")}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Share2 className="size-4" />
                    Share on X
                  </Button>
                  <Button
                    onClick={() => handleShare("facebook")}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Share2 className="size-4" />
                    Share on FB
                  </Button>
                </div>
              </div>
            </div>
          </Panel>

          {/* Preview */}
          <Panel className="p-6">
            <div className="space-y-4">
              <Label>Preview</Label>
              <div
                id="sign-canvas"
                className={`aspect-[4/3] rounded-lg overflow-hidden flex flex-col items-center justify-center p-8 ${preset.bg}`}
              >
                <div className={`text-center space-y-6 ${preset.text}`}>
                  <h2 className="text-4xl font-bold leading-tight break-words">
                    {headline}
                  </h2>
                  <p className="text-lg break-words">
                    {subline}
                  </p>
                  {dsm > 0 && (
                    <div className="pt-6 border-t border-current/20">
                      <div className="text-sm opacity-75">DSM</div>
                      <div className="text-3xl font-bold">{Math.round(dsm)}</div>
                      <div className="text-xs opacity-75">{band} dissatisfaction</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border mt-16">
        <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Digital Strike.</span>
          <span>Evidence, not coordination. Privacy‑by‑design.</span>
        </div>
      </footer>
    </div>
  );
};

export default SignStudio;
