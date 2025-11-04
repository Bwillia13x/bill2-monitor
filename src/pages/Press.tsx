import { BackgroundFX } from "@/components/BackgroundFX";
import { Header } from "@/components/Header";
import { Banner } from "@/components/Banner";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { ButtonGhost } from "@/components/ButtonGhost";
import { useTodayAggregate } from "@/hooks/useSignals";
import { useCampaignSummary } from "@/hooks/usePledge";
import { useTodayPoll } from "@/hooks/useMicroPoll";
import { Download, Code } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { VelocitySparkline } from "@/components/metrics/VelocitySparkline";
import { CoverageDial } from "@/components/metrics/CoverageDial";
import { DispersionBar } from "@/components/metrics/DispersionBar";
import { SafeguardMeter } from "@/components/metrics/SafeguardMeter";
import {
  useDailyVelocity,
  useCoverage,
  usePollDistribution,
  useSafeguardRatio,
} from "@/hooks/useMetrics";

const TARGET_DATE = new Date("2028-08-31T06:00:00Z");

const Press = () => {
  const { data: aggregateData } = useTodayAggregate();
  const { data: pledgeSummary } = useCampaignSummary();
  const { data: todayPoll } = useTodayPoll();
  const [showEmbed, setShowEmbed] = useState(false);

  const { data: velocityData, isLoading: velocityLoading } = useDailyVelocity();
  const { data: coverageData, isLoading: coverageLoading } = useCoverage();
  const { data: pollDistribution, isLoading: pollLoading } = usePollDistribution(todayPoll?.id);
  const { data: safeguardData, isLoading: safeguardLoading } = useSafeguardRatio();

  const dsm = aggregateData?.avgDissatisfaction ?? 0;
  const totalSignals = aggregateData?.totalSignals ?? 0;
  const band = dsm >= 60 ? "Critical" : dsm >= 40 ? "Rising" : "Lower";
  const daysRemaining = Math.max(0, Math.ceil((TARGET_DATE.getTime() - Date.now()) / 86_400_000));
  
  const summary = pledgeSummary ?? { total: 0, today: 0, minShowN: 20 };
  const canShowCounts = summary.total >= summary.minShowN;

  const embedCode = `<iframe src="${window.location.origin}/embed/meter" width="600" height="400" frameborder="0"></iframe>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied");
  };

  const handleDownload = (type: "svg" | "csv" | "png") => {
    toast.info(`${type.toUpperCase()} export - coming soon`);
  };

  return (
    <div className="relative min-h-screen w-full text-foreground bg-background overflow-x-hidden">
      <BackgroundFX band={dsm >= 60 ? "red" : dsm >= 40 ? "amber" : "green"} />
      <Header />
      <Banner />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Press Kit & Media Resources</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Download assets, embed live data, and access factual information about educator sentiment.
          </p>
        </div>

        {/* Advisory banner if critical for 3 days */}
        {dsm >= 60 && (
          <div className="mb-8">
            <Panel className="p-6 ring-2 ring-destructive">
              <div className="flex items-start gap-4">
                <div className="shrink-0 text-2xl">⚠️</div>
                <div>
                  <h3 className="font-semibold text-destructive mb-2">Media Advisory</h3>
                  <p className="text-sm text-foreground mb-3">
                    The Digital Strike Meter has registered <strong>Critical</strong> dissatisfaction. This is a privacy-preserving, aggregated signal from verified educators.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      const quote = `The Digital Strike Meter shows ${Math.round(dsm)} (Critical) with ${totalSignals}+ educators reporting. For employment matters, consult the appropriate association or legal counsel.`;
                      navigator.clipboard.writeText(quote);
                      toast.success("Media quote copied");
                    }}
                  >
                    Copy media quote
                  </Button>
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* Live facts panel */}
        <div className="mb-8">
          <Panel className="p-6">
            <h2 className="text-xl font-semibold mb-6">Live Facts</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold text-primary">{Math.round(dsm)}</div>
                <div className="text-sm text-muted-foreground">Dissatisfaction Meter</div>
                <div className="text-xs text-muted-foreground/70 mt-1">{band}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{totalSignals}+</div>
                <div className="text-sm text-muted-foreground">Educator Signals</div>
                <div className="text-xs text-muted-foreground/70 mt-1">Today</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{daysRemaining}</div>
                <div className="text-sm text-muted-foreground">Days to Window</div>
                <div className="text-xs text-muted-foreground/70 mt-1">Aug 31, 2028</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">n≥20</div>
                <div className="text-sm text-muted-foreground">Privacy Threshold</div>
                <div className="text-xs text-muted-foreground/70 mt-1">All data</div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Privacy-Preserving Charts */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Press-Ready Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {velocityData && (
              <VelocitySparkline
                series={velocityData.series}
                last7Avg={velocityData.last7Avg}
                prev7Avg={velocityData.prev7Avg}
                delta={velocityData.delta}
                isLoading={velocityLoading}
              />
            )}
            {coverageData && (
              <CoverageDial
                covered={coverageData.covered}
                observed={coverageData.observed}
                ratio={coverageData.ratio}
                threshold={coverageData.threshold}
                isLoading={coverageLoading}
              />
            )}
            {pollDistribution && (
              <DispersionBar
                distribution={pollDistribution}
                isLoading={pollLoading}
              />
            )}
            {safeguardData && (
              <SafeguardMeter
                suppressed={safeguardData.suppressed}
                visible={safeguardData.visible}
                share_suppressed={safeguardData.share_suppressed}
                threshold={safeguardData.threshold}
                isLoading={safeguardLoading}
              />
            )}
          </div>
        </div>

        {/* Downloadables */}
        <div className="mb-8">
          <Panel className="p-6">
            <h2 className="text-xl font-semibold mb-6">Downloadable Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="gap-2 h-auto py-4 flex-col"
                onClick={() => handleDownload("svg")}
              >
                <Download className="size-5" />
                <div className="text-center">
                  <div className="font-semibold">SVG Chart</div>
                  <div className="text-xs text-muted-foreground">Vector format</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="gap-2 h-auto py-4 flex-col"
                onClick={() => handleDownload("png")}
              >
                <Download className="size-5" />
                <div className="text-center">
                  <div className="font-semibold">PNG Chart</div>
                  <div className="text-xs text-muted-foreground">High resolution</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="gap-2 h-auto py-4 flex-col"
                onClick={() => handleDownload("csv")}
              >
                <Download className="size-5" />
                <div className="text-center">
                  <div className="font-semibold">CSV Data (30d)</div>
                  <div className="text-xs text-muted-foreground">Aggregate only</div>
                </div>
              </Button>
            </div>
          </Panel>
        </div>

        {/* Embed widget */}
        <div className="mb-8">
          <Panel className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Embed Live Meter</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmbed(!showEmbed)}
                className="gap-2"
              >
                <Code className="size-4" />
                {showEmbed ? "Hide" : "Show"} code
              </Button>
            </div>

            {showEmbed && (
              <div className="space-y-3">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  {embedCode}
                </pre>
                <Button onClick={copyEmbed} size="sm">
                  Copy embed code
                </Button>
              </div>
            )}
          </Panel>
        </div>

        {/* Pledge summary card */}
        <div className="mb-8">
          <Panel className="p-6">
            <h2 className="text-xl font-semibold mb-6">Pledge Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-primary">
                  {canShowCounts ? summary.total.toLocaleString() : "—"}
                </div>
                <div className="text-sm text-muted-foreground">Total Signatures</div>
                <div className="text-xs text-muted-foreground/70 mt-1">
                  {canShowCounts ? "All-time" : `Hidden until n≥${summary.minShowN}`}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {canShowCounts && summary.today > 0 ? summary.today : "—"}
                </div>
                <div className="text-sm text-muted-foreground">Today's Adds</div>
                <div className="text-xs text-muted-foreground/70 mt-1">
                  {canShowCounts ? "New signatures" : "Gated"}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">n≥20</div>
                <div className="text-sm text-muted-foreground">Privacy Threshold</div>
                <div className="text-xs text-muted-foreground/70 mt-1">All slices</div>
              </div>
            </div>
          </Panel>
        </div>

        {/* About section */}
        <Panel className="p-6">
          <h2 className="text-xl font-semibold mb-4">About Digital Strike</h2>
          <div className="prose prose-sm prose-invert max-w-none">
            <p className="text-muted-foreground">
              Digital Strike is an <strong>information and analytics platform</strong> that measures educator sentiment through privacy-preserving aggregate data. It does not call for or coordinate job action.
            </p>
            <p className="text-muted-foreground mt-4">
              <strong>Key principles:</strong>
            </p>
            <ul className="text-muted-foreground list-disc pl-5 space-y-2">
              <li>All data is aggregated and anonymous</li>
              <li>Minimum n≥20 threshold for all published metrics</li>
              <li>One signal per verified educator per day</li>
              <li>No coordination or calls for action</li>
              <li>Evidence-based reporting only</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              For employment-related questions, consult your association or legal counsel.
            </p>
          </div>
        </Panel>
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

export default Press;
